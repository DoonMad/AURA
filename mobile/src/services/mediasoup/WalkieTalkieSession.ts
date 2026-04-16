import { Device } from 'mediasoup-client';
import type { types as MediasoupTypes } from 'mediasoup-client';
import { mediaDevices, MediaStream, RTCPeerConnection } from 'react-native-webrtc';
import type { Socket } from 'socket.io-client';
import { setupWebRTC } from '../webrtc/setupWebRTC';

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
  private dummyPC: any = null; // Ignition hack for Native Android Microphones
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

  private readonly handleProducerState = (event: { roomId: string; channelId: string; activeSpeaker: string | null }) => {
    if (!this.matchesChannel(event.roomId, event.channelId)) {
      return;
    }

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
      if (this.micProducer.paused) {
        console.log('[mediasoup] mic producer already paused');
        return;
      }

      void this.micProducer.pause();
      console.log('[mediasoup] mic producer paused');
    }
  };

  setSocket(socket: Socket) {
    if (this.socket === socket) {
      return;
    }

    this.detachSocket();
    this.socket = socket;
    this.attachSocket();
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
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.dummyPC) {
      this.dummyPC.close();
      this.dummyPC = null;
    }

    this.device = null;
    this.initialized = false;
  }

  getRemoteStreams() {
    return Array.from(this.remoteStreams.values());
  }

  getLocalStream() {
    return this.localStream;
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
    if (this.micProducer && !this.micProducer.closed) {
      console.log('[mediasoup] reusing existing mic producer', this.micProducer.id);
      return this.micProducer;
    }

    if (this.micProducerPromise) {
      console.log('[mediasoup] mic producer creation already in progress');
      return this.micProducerPromise;
    }

    if (!this.sendTransport) {
      throw new Error('Send transport is not ready');
    }

    console.log('[mediasoup] creating mic producer');
    this.micProducerPromise = (async () => {
      console.log('[mediasoup] requesting microphone access');
      let stream: MediaStream;
      try {
        stream = await mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false
        });
      } catch (err) {
        console.error('[mediasoup] getUserMedia failed', err);
        throw err;
      }

      console.log('[mediasoup] getUserMedia ok', {
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

      // ── Android SDP Ignition ──────────────────────────────────────
      // Android's native WebRTC layer only powers on the physical
      // microphone after an RTCPeerConnection completes a FULL
      // offer/answer cycle (both local AND remote descriptions set).
      // mediasoup-client uses synthetic SDP and never does this,
      // so the mic hardware stays off.  We spin up a throwaway
      // loopback PC, run a real negotiation, and discard it.
      // The track is now globally "hot" for any subsequent PC.
      // ─────────────────────────────────────────────────────────────
      if (!this.dummyPC) {
        console.log('[mediasoup] starting SDP ignition for Android mic wake');
        const pc1 = new RTCPeerConnection({});
        const pc2 = new RTCPeerConnection({});

        // Attach the mic track to pc1
        stream.getTracks().forEach((t: any) => pc1.addTrack(t, stream));

        // Exchange ICE candidates
        pc1.onicecandidate = (e: any) => { if (e.candidate) pc2.addIceCandidate(e.candidate); };
        pc2.onicecandidate = (e: any) => { if (e.candidate) pc1.addIceCandidate(e.candidate); };

        // Full offer/answer — this is what wakes the hardware
        const offer = await pc1.createOffer();
        await pc1.setLocalDescription(offer);
        await pc2.setRemoteDescription(offer);
        const answer = await pc2.createAnswer();
        await pc2.setLocalDescription(answer);
        await pc1.setRemoteDescription(answer);

        // Keep pc1 alive (closing it would kill the track globally)
        this.dummyPC = pc1;
        pc2.close();
        console.log('[mediasoup] SDP ignition complete — mic hardware is active');
      }

      console.log('[mediasoup] audio track ready', audioTrack.id);

      console.log('[mediasoup] calling transport.produce');
      const producer = await this.sendTransport!.produce({
        track: audioTrack,
        stopTracks: false,
        appData: {
          source: 'microphone'
        }
      });
      console.log('[mediasoup] producer created', producer.id);

      this.micProducer = producer;

      // --- SENDER DIAGNOSTICS LOG ---
      const outInterval = setInterval(() => {
        if (producer.closed) {
          clearInterval(outInterval);
          return;
        }
        producer.getStats().then(stats => {
          stats.forEach((stat: any) => {
            if (stat.type === 'outbound-rtp') {
              console.log(`[RTP OUTBOUND] Audio Bytes Sent: ${stat.bytesSent}`);
            }
          });
        }).catch(() => {});
      }, 2000);
      producer.on('transportclose', () => clearInterval(outInterval));
      // ------------------------------

      return producer;
    })();

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
