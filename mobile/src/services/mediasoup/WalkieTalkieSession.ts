import { Device } from 'mediasoup-client';
import type { types as MediasoupTypes } from 'mediasoup-client';
import { mediaDevices, MediaStream } from 'react-native-webrtc';
import type { Socket } from 'socket.io-client';
import { setupWebRTC } from '../webrtc/setupWebRTC';
import { WatchBridgeService, type WatchRoomState } from '../watchBridge';
import * as AudioCapture from './audioCapture';
import type {
  AudioCaptureLease,
  AudioCaptureSource,
  AudioCaptureSourceKind,
} from './audioCapture';
import useAppStore from '../../store/useAppStore';

type SocketAck<T> = {
  ok: true;
} & T;

type SocketErr = {
  ok: false;
  error: string;
};

type RouterCapabilitiesResponse = SocketAck<{ routerRtpCapabilities: any }>;
type TransportResponse = SocketAck<{ transport: TransportPayload }>;
type ProduceResponse = SocketAck<{ producerId: string }>;
type GetProducersResponse = SocketAck<{ producers: ProducerSummary[] }>;
type ConsumeResponse = SocketAck<{ consumerOptions: ConsumerOptions }>;

type TransportPayload = {
  id: string;
  iceParameters: any;
  iceCandidates: any[];
  dtlsParameters: any;
};

type ProducerSummary = {
  producerId: string;
  peerId: string;
  kind: string;
  paused: boolean;
  appData: Record<string, unknown>;
};

type ConsumerOptions = {
  id: string;
  producerId: string;
  kind: 'audio';
  rtpParameters: any;
  appData: Record<string, unknown>;
};

type InitOptions = {
  roomId: string;
  channelId: string;
  deviceId: string;
};

type Consumer = MediasoupTypes.Consumer;
type Producer = MediasoupTypes.Producer;
type Transport = MediasoupTypes.Transport;

function emitWithAck<T>(socket: Socket, event: string, payload: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (response: SocketAck<any> | SocketErr) => {
      if (!response || response.ok === false) {
        reject(new Error(response?.error ?? `Failed to emit ${event}`));
        return;
      }

      resolve(response as T);
    });
  });
}

export default class WalkieTalkieSession {
  private socket: Socket | null = null;
  private device: Device | null = null;
  private roomId: string | null = null;
  private channelId: string | null = null;
  private deviceId: string | null = null;
  private sendTransport: Transport | null = null;
  private recvTransport: Transport | null = null;
  private micProducer: Producer | null = null;
  private micProducerPromise: Promise<Producer> | null = null;
  private localStream: MediaStream | null = null;
  private activeAudioCaptureLease: AudioCaptureLease | null = null;
  private audioCaptureSource: AudioCaptureSource = new AudioCapture.PhoneMicAudioCaptureSource();
  private micReleaseRequested = false;
  private initialized = false;
  private pendingConsumers = new Set<string>();
  private remoteConsumers = new Map<string, Consumer>();
  private remoteStreams = new Map<string, MediaStream>();

  private readonly handleNewProducer = async (event: { roomId: string; channelId: string; producerId: string; peerId: string }) => {
    if (!this.matchesChannel(event.roomId, event.channelId) || event.peerId === this.deviceId) {
      return;
    }

    await this.consumeProducer(event.producerId);
  };

  private readonly handleProducerClosed = (event: { roomId: string; channelId: string; producerId: string }) => {
    if (!this.matchesChannel(event.roomId, event.channelId)) {
      return;
    }

    this.removeRemoteConsumer(event.producerId);
  };

  private readonly handleProducerState = (event: {
    roomId: string;
    channelId: string;
    activeSpeaker: string | null;
    users: any[];
  }) => {
    if (!this.matchesChannel(event.roomId, event.channelId)) {
      return;
    }

    const activeSpeakerUser = event.users?.find((u: any) => u.id === event.activeSpeaker);

    // Sync speaker to watch
    WatchBridgeService.sendMessage(
      '/speaker_update',
      JSON.stringify({
        activeSpeakerName: activeSpeakerUser ? activeSpeakerUser.name : null,
        channelId: event.channelId,
      })
    );

    if (event.activeSpeaker === this.deviceId) {
      if (!this.micProducer || this.micProducer.closed) {
        console.warn('[mediasoup] mic granted before producer existed');
        return;
      }

      if (!this.micProducer.paused) {
        console.log('[mediasoup] mic producer already active');
        return;
      }

      try {
        void this.micProducer.resume();
        console.log('[mediasoup] mic producer resumed');
      } catch (error) {
        console.warn('[mediasoup] failed to resume mic producer', error);
      }
      return;
    }

    if (this.micProducer && !this.micProducer.closed) {
      console.log('[mediasoup] mic state changed away from self, releasing local capture');
      void this.releaseMicProducer();
    }
  };

  setSocket(socket: Socket) {
    if (this.socket === socket) {
      return;
    }

    this.detachSocket();
    this.socket = socket;
    this.attachSocket();

    // Listen to Watch messages
    WatchBridgeService.onMessage(({ path, data }) => {
      console.log(`[watch-bridge] Received message: ${path} with data: ${data}`);
      if (path === '/ptt_down') {
        // Switch to watch mic when watch PTT is pressed
        this.useWatchMicSource().then(() => {
          useAppStore.getState().setMicSource('watch');
          // Trigger PTT on phone if in a room
          if (this.initialized && this.socket) {
            console.log('[watch-bridge] PTT DOWN from watch');
            this.ensureMicProducer().then((producer) => {
              if (this.socket && this.roomId && this.channelId && this.deviceId) {
                this.socket.emit('requestMic', {
                  deviceId: this.deviceId,
                  roomId: this.roomId,
                  channelId: this.channelId,
                });
              }
            });
          }
        });
      } else if (path === '/ptt_up') {
        if (this.initialized && this.socket) {
          console.log('[watch-bridge] PTT UP from watch - releasing immediately');
          // Prioritize socket emission over local cleanup
          this.socket.emit('releaseMic', {
            deviceId: this.deviceId,
            roomId: this.roomId,
            channelId: this.channelId,
          });
          void this.releaseMicProducer();
        }
        // Fallback to phone mic after watch release
        this.usePhoneMicSource();
        useAppStore.getState().setMicSource('phone');
      } else if (path === '/watch_connected') {
        console.log('[watch-bridge] watch connected, sync requested');
        this.syncStateToWatch();
      } else if (path === '/open_phone_app') {
        console.log('[watch-bridge] watch requested to open phone app');
        WatchBridgeService.openPhoneApp();
      } else if (path === '/toggle_mic') {
        console.log('[watch-bridge] watch requested mic toggle to:', data);
        if (data === 'watch') {
          this.useWatchMicSource().then(() => {
            useAppStore.getState().setMicSource('watch');
            this.syncStateToWatch();
          });
        } else {
          this.usePhoneMicSource();
        }
      }
    });

    WatchBridgeService.onAudioFrame((base64) => {
      // If watch mic is active, we'd feed this into a custom stream
      // This requires an AudioCaptureSource that consumes these frames
    });
  }

  private syncStateToWatch() {
    const state: WatchRoomState = {
      roomId: this.roomId ?? '',
      channelId: this.channelId ?? '',
      channelName: (this.channelId ?? 'No Channel').toUpperCase(),
      activeSpeakerName: null,
      isConnected: !!this.socket?.connected,
      isInRoom: this.initialized,
      micSource: this.getAudioSourceKind(),
      isWatchActive: true
    };
    console.log('[mediasoup] syncing state to watch, isInRoom:', state.isInRoom, 'source:', state.micSource);
    WatchBridgeService.updateRoomState(state);
  }

  async initialize(options: InitOptions) {
    setupWebRTC();
    console.log('[mediasoup] initialize start', options);

    const sameTarget =
      this.initialized &&
      this.roomId === options.roomId &&
      this.channelId === options.channelId &&
      this.deviceId === options.deviceId;

    if (sameTarget) {
      return;
    }

    await this.dispose();

    if (!this.socket) {
      throw new Error('Socket is not ready');
    }

    this.roomId = options.roomId;
    this.channelId = options.channelId;
    this.deviceId = options.deviceId;
    this.attachSocket();

    const routerResponse = await emitWithAck<RouterCapabilitiesResponse>(
      this.socket,
      'mediasoup:getRouterRtpCapabilities',
      { roomId: options.roomId, channelId: options.channelId }
    );
    console.log('[mediasoup] router capabilities received');

    this.device = new Device();
    await this.device.load({ routerRtpCapabilities: routerResponse.routerRtpCapabilities });
    console.log('[mediasoup] device loaded', this.device.handlerName);

    if (!this.device.canProduce('audio')) {
      throw new Error('This device cannot produce audio');
    }

    await this.createSendTransport();
    console.log('[mediasoup] send transport created');
    await this.createRecvTransport();
    console.log('[mediasoup] recv transport created');
    await this.consumeExistingProducers();
    console.log('[mediasoup] existing producers synced');

    this.initialized = true;
    WatchBridgeService.startWatchApp();
    this.syncStateToWatch();
  }

  async dispose() {
    this.detachSocket();

    for (const consumer of this.remoteConsumers.values()) {
      if (!consumer.closed) {
        consumer.close();
      }
    }
    this.remoteConsumers.clear();
    this.remoteStreams.clear();
    this.pendingConsumers.clear();

    if (this.micProducer && !this.micProducer.closed) {
      this.micProducer.close();
    }
    this.micProducer = null;

    if (this.sendTransport && !this.sendTransport.closed) {
      this.sendTransport.close();
    }
    this.sendTransport = null;

    if (this.recvTransport && !this.recvTransport.closed) {
      this.recvTransport.close();
    }
    this.recvTransport = null;

    if (this.localStream) {
      this.localStream = null;
    }

    if (this.activeAudioCaptureLease) {
      await this.releaseCaptureLease('[mediasoup] failed to release active audio capture lease during dispose');
    }

    this.device = null;
    this.initialized = false;
    this.micReleaseRequested = false;
    this.syncStateToWatch();
  }

  getRemoteStreams() {
    return Array.from(this.remoteStreams.values());
  }

  getLocalStream() {
    return this.localStream;
  }

  getAudioSourceKind(): AudioCaptureSourceKind {
    return this.audioCaptureSource.kind;
  }

  usePhoneMicSource() {
    this.audioCaptureSource = new AudioCapture.PhoneMicAudioCaptureSource();
    if (this.micProducer || this.localStream) {
      void this.releaseMicProducer();
    }
    this.syncStateToWatch();
  }

  async useWatchMicSource() {
    console.log('[mediasoup] switching to watch mic source');
    // Set immediate UI state
    useAppStore.getState().setMicSource('watch');

    try {
      await WatchBridgeService.initAudioRelay();

      // We MUST use a real MediaStreamTrack from getUserMedia, otherwise Mediasoup
      // cannot add it to a transceiver. We'll mark it as 'watch' so the native
      // layer knows to ignore the hardware mic data and use the relay instead.
      const stream = await mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false
      });

      this.audioCaptureSource = new AudioCapture.WatchMicAudioCaptureSource(stream);
      if (this.micProducer || this.localStream) {
        void this.releaseMicProducer();
      }
      this.syncStateToWatch();
    } catch (e) {
      console.warn('[mediasoup] failed to switch to watch mic', e);
      // Fallback to phone mic if relay fails
      this.usePhoneMicSource();
    }
  }

  useExternalAudioStream(stream: MediaStream | null) {
    this.audioCaptureSource = stream
      ? new AudioCapture.ExternalStreamAudioCaptureSource(stream)
      : new AudioCapture.PhoneMicAudioCaptureSource();
    if (this.micProducer || this.localStream) {
      void this.releaseMicProducer();
    }
  }

  /**
   * Returns connection quality as a level 0-4 based on live WebRTC transport stats.
   * 0 = no data, 1 = poor, 2 = fair, 3 = good, 4 = excellent
   */
  async getConnectionQuality(): Promise<{ level: number; rtt: number | null; packetLoss: number | null }> {
    const transport = this.sendTransport || this.recvTransport;
    if (!transport || transport.closed) {
      return { level: 0, rtt: null, packetLoss: null };
    }

    try {
      const stats = await transport.getStats();
      let rtt: number | null = null;
      let packetLoss: number | null = null;

      stats.forEach((report: any) => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          if (typeof report.currentRoundTripTime === 'number') {
            rtt = report.currentRoundTripTime * 1000;
          }
        }
        if (report.type === 'remote-inbound-rtp') {
          if (typeof report.roundTripTime === 'number') {
            rtt = report.roundTripTime * 1000;
          }
          if (typeof report.fractionLost === 'number') {
            packetLoss = report.fractionLost * 100;
          }
        }
      });

      let level = 4;
      if (rtt !== null) {
        if (rtt > 300) level = 1;
        else if (rtt > 150) level = Math.min(level, 2);
        else if (rtt > 80) level = Math.min(level, 3);
      }
      if (packetLoss !== null) {
        if (packetLoss > 10) level = 1;
        else if (packetLoss > 5) level = Math.min(level, 2);
        else if (packetLoss > 2) level = Math.min(level, 3);
      }

      return { level, rtt, packetLoss };
    } catch (e) {
      return { level: 0, rtt: null, packetLoss: null };
    }
  }

  async releaseMicProducer() {
    this.micReleaseRequested = true;

    const producer = this.micProducer;
    if (producer && !producer.closed) {
      console.log('[mediasoup] closing mic producer for release', producer.id);
      try {
        producer.close();
      } catch (error) {
        console.warn('[mediasoup] failed to close mic producer', error);
      }
    }

    if (this.localStream) {
      this.localStream = null;
      this.onTracksUpdated?.();
    }

    // Optimization: Release lease in background, don't await it
    if (this.activeAudioCaptureLease) {
      void this.releaseCaptureLease('[mediasoup] failed to release audio capture lease');
    }

    this.micProducer = null;
  }

  private async releaseCaptureLease(warningPrefix: string = '[mediasoup] failed to release audio capture lease') {
    if (!this.activeAudioCaptureLease) {
      return;
    }

    try {
      await this.activeAudioCaptureLease.release();
    } catch (error) {
      console.warn(warningPrefix, error);
    } finally {
      this.activeAudioCaptureLease = null;
    }
  }

  private onTracksUpdated: (() => void) | null = null;

  setOnTracksUpdated(cb: () => void) {
    this.onTracksUpdated = cb;
  }

  private attachSocket() {
    if (!this.socket) {
      return;
    }

    this.socket.on('mediasoup:newProducer', this.handleNewProducer);
    this.socket.on('mediasoup:producerClosed', this.handleProducerClosed);
    this.socket.on('micStateUpdated', this.handleProducerState);
  }

  private detachSocket() {
    if (!this.socket) {
      return;
    }

    this.socket.off('mediasoup:newProducer', this.handleNewProducer);
    this.socket.off('mediasoup:producerClosed', this.handleProducerClosed);
    this.socket.off('micStateUpdated', this.handleProducerState);
  }

  private matchesChannel(roomId: string, channelId: string) {
    return this.roomId === roomId && this.channelId === channelId;
  }

  private async createSendTransport() {
    if (!this.socket || !this.device || !this.roomId || !this.channelId) {
      throw new Error('Missing mediasoup session state');
    }

    const response = await emitWithAck<TransportResponse>(this.socket, 'mediasoup:createTransport', {
      roomId: this.roomId,
      channelId: this.channelId,
      direction: 'send'
    });
    console.log('[mediasoup] send transport payload', response.transport.id);

    // ── Log exactly what ICE candidates the server sent ──
    const candidates = (response.transport as any).iceCandidates;
    if (candidates) {
      candidates.forEach((c: any, i: number) => {
        console.log(`[ICE CANDIDATE ${i}] ip=${c.ip} port=${c.port} protocol=${c.protocol} type=${c.type}`);
      });
    }

    const transport = this.device.createSendTransport(response.transport as any);

    transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        console.log('[mediasoup] send transport connect', {
          transportId: transport.id,
          dtlsRole: dtlsParameters?.role,
          fingerprintCount: Array.isArray(dtlsParameters?.fingerprints) ? dtlsParameters.fingerprints.length : 0
        });
        await emitWithAck(this.socket as Socket, 'mediasoup:connectTransport', {
          transportId: transport.id,
          dtlsParameters
        });
        console.log('[mediasoup] send transport connected');
        callback();
      } catch (error: unknown) {
        console.warn('[mediasoup] send transport connect failed', error);
        errback(error as Error);
      }
    });

    transport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
      try {
        console.log('[mediasoup] send transport produce', kind);
        const produceRes = await emitWithAck<ProduceResponse>(this.socket as Socket, 'mediasoup:produce', {
          transportId: transport.id,
          kind,
          rtpParameters,
          appData
        });
        console.log('[mediasoup] send transport produced', produceRes.producerId);
        callback({ id: produceRes.producerId });
      } catch (error: unknown) {
        console.warn('[mediasoup] send transport produce failed', error);
        errback(error as Error);
      }
    });

    transport.on('connectionstatechange', (state) => {
      console.log('[TRANSPORT STATE] send transport =>', state);
      if (state === 'failed') {
        console.error('[TRANSPORT STATE] ICE connection FAILED - phone cannot reach server RTP port');
      }
    });

    this.sendTransport = transport;
  }

  private async createRecvTransport() {
    if (!this.socket || !this.device || !this.roomId || !this.channelId) {
      throw new Error('Missing mediasoup session state');
    }

    const response = await emitWithAck<TransportResponse>(this.socket, 'mediasoup:createTransport', {
      roomId: this.roomId,
      channelId: this.channelId,
      direction: 'recv'
    });
    console.log('[mediasoup] recv transport payload', response.transport.id);

    const transport = this.device.createRecvTransport(response.transport as any);

    transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        console.log('[mediasoup] recv transport connect', {
          transportId: transport.id,
          dtlsRole: dtlsParameters?.role,
          fingerprintCount: Array.isArray(dtlsParameters?.fingerprints) ? dtlsParameters.fingerprints.length : 0
        });
        await emitWithAck(this.socket as Socket, 'mediasoup:connectTransport', {
          transportId: transport.id,
          dtlsParameters
        });
        console.log('[mediasoup] recv transport connected');
        callback();
      } catch (error: unknown) {
        console.warn('[mediasoup] recv transport connect failed', error);
        errback(error as Error);
      }
    });

    transport.on('connectionstatechange', (state) => {
      console.log('recv transport state', state);
    });

    this.recvTransport = transport;
  }

  async ensureMicProducer() {
    if (this.micProducerPromise) {
      console.log('[mediasoup] mic producer creation already in progress');
      return this.micProducerPromise;
    }

    if (!this.sendTransport) {
      throw new Error('Send transport is not ready');
    }

    this.micReleaseRequested = false;

    if (this.micProducer && !this.micProducer.closed) {
      if (this.localStream) {
        console.log('[mediasoup] reusing existing mic producer', this.micProducer.id);
        return this.micProducer;
      }

      const existingProducer = this.micProducer;
      console.log('[mediasoup] reattaching audio source to existing producer', this.micProducer.id);
      this.micProducerPromise = this.attachAudioSourceToProducer(existingProducer);
      try {
        const producer = await this.micProducerPromise;
        console.log('[mediasoup] mic producer ready', producer.id);
        return producer;
      } catch (e) {
        console.error('[mediasoup] Error inside micProducerPromise', e);
        throw e;
      } finally {
        this.micProducerPromise = null;
      }
    }

    console.log('[mediasoup] creating mic producer');
    this.micProducerPromise = this.createProducerFromCurrentSource();

    try {
      const producer = await this.micProducerPromise;
      console.log('[mediasoup] mic producer ready', producer.id);
      return producer;
    } catch (e) {
      console.error('[mediasoup] Error inside micProducerPromise', e);
      throw e;
    } finally {
      this.micProducerPromise = null;
    }
  }

  private async attachAudioSourceToProducer(existingProducer: Producer) {
    const lease = await this.audioCaptureSource.acquire();
    const stream = lease.stream;
    this.activeAudioCaptureLease = lease;

    console.log('[mediasoup] capture source ready', {
      source: lease.kind,
      audioTracks: stream.getAudioTracks().length,
      videoTracks: stream.getVideoTracks().length
    });

    this.localStream = stream;
    this.onTracksUpdated?.();

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) {
      throw new Error('Microphone track is not available');
    }

    audioTrack.enabled = true;
    console.log('[mediasoup] audio track ready', audioTrack.id);
    console.log('[mediasoup] replacing existing producer track');
    await existingProducer.replaceTrack({ track: audioTrack });
    audioTrack.enabled = true;
    console.log('[mediasoup] existing mic producer reattached', existingProducer.id);
    return existingProducer;
  }

  private async createProducerFromCurrentSource() {
    if (!this.sendTransport) {
      throw new Error('Send transport is not ready');
    }

    const lease = await this.audioCaptureSource.acquire();
    const stream = lease.stream;
    this.activeAudioCaptureLease = lease;

    console.log('[mediasoup] capture source ready', {
      source: lease.kind,
      audioTracks: stream.getAudioTracks().length,
      videoTracks: stream.getVideoTracks().length
    });

    this.localStream = stream;
    this.onTracksUpdated?.();

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) {
      throw new Error('Microphone track is not available');
    }

    audioTrack.enabled = true;
    console.log('[mediasoup] audio track ready', audioTrack.id);
    console.log('[mediasoup] calling transport.produce');
    const producer = await (this.sendTransport as any).produce({
      track: audioTrack,
      paused: true,
      stopTracks: false,
      appData: {
        source: this.audioCaptureSource.kind,
        startPaused: true
      }
    });
    console.log('[mediasoup] producer created', producer.id);

    this.micProducer = producer;

    producer.on('@close', () => {
      console.log('[mediasoup] mic producer closed');
      if (this.localStream) {
        this.localStream = null;
        this.onTracksUpdated?.();
      }
      void this.releaseCaptureLease('[mediasoup] failed to release capture lease after producer close');
      this.micProducer = null;
    });

    const outInterval = setInterval(() => {
      if (producer.closed) {
        clearInterval(outInterval);
        return;
      }
      producer.getStats().then((stats: any) => {
        stats.forEach((stat: any) => {
          if (stat.type === 'outbound-rtp') {
            console.log(`[RTP OUTBOUND] Audio Bytes Sent: ${stat.bytesSent}`);
          }
        });
      }).catch(() => {});
    }, 2000);
    producer.on('transportclose', () => clearInterval(outInterval));

    if (this.micReleaseRequested) {
      console.log('[mediasoup] mic release requested during producer creation; cleaning up');
      try {
        producer.close();
      } catch (error) {
        console.warn('[mediasoup] failed to close producer during release cleanup', error);
      }
      await this.releaseCaptureLease();
      throw new Error('Mic release requested before producer was ready');
    }

    return producer;
  }

  private async consumeExistingProducers() {
    if (!this.socket || !this.recvTransport || !this.roomId || !this.channelId) {
      return;
    }

    const response = await emitWithAck<GetProducersResponse>(this.socket, 'mediasoup:getProducers', {
      roomId: this.roomId,
      channelId: this.channelId
    });
    console.log('[mediasoup] existing producers count', response.producers.length);

    for (const producer of response.producers) {
      await this.consumeProducer(producer.producerId);
    }
  }

  private async consumeProducer(producerId: string) {
    if (!this.socket || !this.recvTransport || !this.device || !this.roomId || !this.channelId) {
      return;
    }

    if (this.remoteConsumers.has(producerId) || this.pendingConsumers.has(producerId)) {
      return;
    }

    this.pendingConsumers.add(producerId);

    try {
      const response = await emitWithAck<ConsumeResponse>(this.socket, 'mediasoup:consume', {
        transportId: this.recvTransport.id,
        producerId,
        rtpCapabilities: this.device.rtpCapabilities
      });
      console.log('[mediasoup] consume ack', producerId, response.consumerOptions.id);

      const consumer = await this.recvTransport.consume(response.consumerOptions as any);
      console.log('[mediasoup] consumer created', consumer.id);
      this.remoteConsumers.set(producerId, consumer);

      const stream = new MediaStream();
      stream.addTrack(consumer.track);
      this.remoteStreams.set(producerId, stream);
      this.onTracksUpdated?.();

      // --- ADDED STATS LOGGER FOR DIAGNOSTICS ---
      const intervalId = setInterval(() => {
        if (consumer.closed) {
          clearInterval(intervalId);
          return;
        }
        consumer.getStats().then(stats => {
          stats.forEach((stat: any) => {
            if (stat.type === 'inbound-rtp') {
              console.log(`[RTP STATS] Audio Data Received: ${stat.bytesReceived} bytes`);
            }
          });
        }).catch(() => {});
      }, 2000);
      // ------------------------------------------

      consumer.on('transportclose', () => {
        clearInterval(intervalId);
        this.removeRemoteConsumer(producerId);
      });

      await emitWithAck(this.socket, 'mediasoup:resumeConsumer', {
        consumerId: consumer.id
      });
      console.log('[mediasoup] consumer resumed', consumer.id);
    } catch (error) {
      console.warn('Failed to consume producer', producerId, error);
    } finally {
      this.pendingConsumers.delete(producerId);
    }
  }

  private removeRemoteConsumer(producerId: string) {
    const consumer = this.remoteConsumers.get(producerId);
    if (consumer && !consumer.closed) {
      consumer.close();
    }

    this.remoteConsumers.delete(producerId);
    this.remoteStreams.delete(producerId);
  }
}
