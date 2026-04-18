import * as mediasoup from "mediasoup";

const AUDIO_MEDIA_CODECS = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
    parameters: {
      minptime: 10,
      useinbandfec: 1
    }
  }
];

import os from "os";

function getLocalIp() {
  // Removed Fly.io specific public IP handling; fallback to local network interfaces

  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
}

function buildListenIps() {
  const announcedIp = process.env.MEDIASOUP_ANNOUNCED_IP || getLocalIp();
  console.log("[mediasoup] using announcedIp:", announcedIp);
  return [{ ip: "0.0.0.0", announcedIp }];
}

function createChannelRoomKey(roomId, channelId) {
  return `${roomId}:${channelId}`;
}

function getWorkerPortRange() {
  const minPort = Number(process.env.MEDIASOUP_RTC_MIN_PORT ?? 40000);
  const maxPort = Number(process.env.MEDIASOUP_RTC_MAX_PORT ?? 40100);

  if (!Number.isInteger(minPort) || !Number.isInteger(maxPort) || minPort < 1024 || maxPort <= minPort) {
    throw new Error(`Invalid mediasoup port range: ${minPort}-${maxPort}`);
  }

  return { rtcMinPort: minPort, rtcMaxPort: maxPort };
}

class MediasoupManager {
  constructor() {
    this.worker = null;
    this.io = null;

    this.rooms = new Map();
    this.transports = new Map();
    this.producers = new Map();
    this.consumers = new Map();
  }

  setIo(io) {
    this.io = io;
  }

  async init() {
    if (this.worker) {
      return this.worker;
    }

    const { rtcMinPort, rtcMaxPort } = getWorkerPortRange();
    console.log("[mediasoup] worker port range", { rtcMinPort, rtcMaxPort });

    this.worker = await mediasoup.createWorker({
      logLevel: "debug",
      logTags: ["info", "ice", "dtls", "rtp", "srtp", "rtcp"],
      rtcMinPort,
      rtcMaxPort
    });

    this.worker.on("died", () => {
      console.error("mediasoup worker died unexpectedly");
      setTimeout(() => process.exit(1), 2000);
    });

    return this.worker;
  }

  async closeAll() {
    for (const [roomId, room] of this.rooms.entries()) {
      for (const channelId of Array.from(room.channels.keys())) {
        await this.closeChannel(roomId, channelId);
      }
    }

    this.rooms.clear();
    this.transports.clear();
    this.producers.clear();
    this.consumers.clear();
  }

  _getRoomState(roomId) {
    let room = this.rooms.get(roomId);

    if (!room) {
      room = {
        roomId,
        channels: new Map()
      };
      this.rooms.set(roomId, room);
    }

    return room;
  }

  _getChannelState(roomId, channelId) {
    const room = this._getRoomState(roomId);
    let channel = room.channels.get(channelId);

    if (!channel) {
      channel = {
        roomId,
        channelId,
        router: null,
        routerPromise: null,
        peers: new Map()
      };
      room.channels.set(channelId, channel);
    }

    return channel;
  }

  _getPeerState(roomId, channelId, peerId) {
    const channel = this._getChannelState(roomId, channelId);
    let peer = channel.peers.get(peerId);

    if (!peer) {
      peer = {
        peerId,
        transports: new Map(),
        producers: new Map(),
        consumers: new Map()
      };
      channel.peers.set(peerId, peer);
    }

    return { channel, peer };
  }

  async _getRouter(roomId, channelId) {
    await this.init();

    const channel = this._getChannelState(roomId, channelId);

    if (channel.router) {
      return channel.router;
    }

    if (!channel.routerPromise) {
      channel.routerPromise = this.worker.createRouter({
        mediaCodecs: AUDIO_MEDIA_CODECS
      }).then((router) => {
        channel.router = router;
        channel.routerPromise = null;
        return router;
      }).catch((error) => {
        channel.routerPromise = null;
        throw error;
      });
    }

    return channel.routerPromise;
  }

  async getRouterRtpCapabilities(roomId, channelId) {
    const router = await this._getRouter(roomId, channelId);
    return router.rtpCapabilities;
  }

  async createWebRtcTransport({ roomId, channelId, peerId, direction }) {
    const router = await this._getRouter(roomId, channelId);
    const { channel, peer } = this._getPeerState(roomId, channelId, peerId);

    const existingTransport = peer.transports.get(direction);
    if (existingTransport && !existingTransport.closed) {
      return this._transportToClientPayload(existingTransport);
    }

    const transport = await router.createWebRtcTransport({
      listenIps: buildListenIps(),
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: 800000,
      appData: {
        roomId,
        channelId,
        peerId,
        direction
      }
    });

    transport.on("dtlsstatechange", (dtlsState) => {
      console.log("[mediasoup] transport dtlsstatechange", {
        transportId: transport.id,
        dtlsState
      });

      if (dtlsState === "closed") {
        transport.close();
      }
    });

    transport.on("icestatechange", (iceState) => {
      console.log("[mediasoup] transport icestatechange", {
        transportId: transport.id,
        iceState
      });
    });

    transport.on("connectionstatechange", (connectionState) => {
      console.log("[mediasoup] transport connectionstatechange", {
        transportId: transport.id,
        connectionState
      });
    });

    transport.on("close", () => {
      this.transports.delete(transport.id);
      peer.transports.delete(direction);
    });

    this.transports.set(transport.id, {
      transport,
      roomId,
      channelId,
      peerId,
      direction
    });

    peer.transports.set(direction, transport);
    channel.peers.set(peerId, peer);

    return this._transportToClientPayload(transport);
  }

  async connectTransport(transportId, dtlsParameters) {
    const entry = this.transports.get(transportId);
    if (!entry) {
      throw new Error(`Transport not found: ${transportId}`);
    }

    try {
      await entry.transport.connect({ dtlsParameters });
    } catch (error) {
      if (error.message && error.message.includes("connect() already called")) {
        console.log(`[mediasoup] connectTransport ignored redundant connect for ${transportId}`);
        return true;
      }
      throw error;
    }
    return true;
  }

  async produce({ transportId, kind, rtpParameters, appData = {} }) {
    const entry = this.transports.get(transportId);
    if (!entry) {
      throw new Error(`Transport not found: ${transportId}`);
    }

    const { peer } = this._getPeerState(entry.roomId, entry.channelId, entry.peerId);
    for (const existingProducer of peer.producers.values()) {
      if (existingProducer.kind === kind && !existingProducer.closed) {
        return {
          id: existingProducer.id
        };
      }
    }

    const producer = await entry.transport.produce({
      kind,
      rtpParameters,
      appData: {
        ...appData,
        roomId: entry.roomId,
        channelId: entry.channelId,
        peerId: entry.peerId
      }
    });

    peer.producers.set(producer.id, producer);

    this.producers.set(producer.id, {
      producer,
      roomId: entry.roomId,
      channelId: entry.channelId,
      peerId: entry.peerId
    });

    producer.on("transportclose", () => {
      this._deleteProducer(producer.id);
    });

    producer.on("close", () => {
      this._deleteProducer(producer.id);
      this._emitToChannel(entry.roomId, entry.channelId, "mediasoup:producerClosed", {
        producerId: producer.id,
        peerId: entry.peerId,
        roomId: entry.roomId,
        channelId: entry.channelId
      });
    });

    producer.on("pause", () => {
      this._emitToChannel(entry.roomId, entry.channelId, "mediasoup:producerPaused", {
        producerId: producer.id,
        peerId: entry.peerId,
        roomId: entry.roomId,
        channelId: entry.channelId
      });
    });

    producer.on("resume", () => {
      this._emitToChannel(entry.roomId, entry.channelId, "mediasoup:producerResumed", {
        producerId: producer.id,
        peerId: entry.peerId,
        roomId: entry.roomId,
        channelId: entry.channelId
      });
    });

    this._emitToChannel(entry.roomId, entry.channelId, "mediasoup:newProducer", {
      producerId: producer.id,
      peerId: entry.peerId,
      kind: producer.kind,
      roomId: entry.roomId,
      channelId: entry.channelId,
      paused: producer.paused,
      appData: producer.appData
    });

    return {
      id: producer.id
    };
  }

  async getProducers(roomId, channelId, peerId) {
    const channel = this._getChannelState(roomId, channelId);
    const producers = [];

    for (const [channelPeerId, peer] of channel.peers.entries()) {
      if (peerId && channelPeerId === peerId) {
        continue;
      }

      for (const producer of peer.producers.values()) {
        producers.push({
          producerId: producer.id,
          peerId: channelPeerId,
          kind: producer.kind,
          paused: producer.paused,
          appData: producer.appData
        });
      }
    }

    return producers;
  }

  async consume({ transportId, producerId, rtpCapabilities }) {
    const entry = this.transports.get(transportId);
    if (!entry) {
      throw new Error(`Transport not found: ${transportId}`);
    }

    const producerEntry = this.producers.get(producerId);
    if (!producerEntry) {
      throw new Error(`Producer not found: ${producerId}`);
    }

    const router = await this._getRouter(entry.roomId, entry.channelId);
    if (!router.canConsume({ producerId, rtpCapabilities })) {
      throw new Error(`Cannot consume producer ${producerId}`);
    }

    const { peer } = this._getPeerState(entry.roomId, entry.channelId, entry.peerId);
    for (const existingConsumer of peer.consumers.values()) {
      if (existingConsumer.producerId === producerId && !existingConsumer.closed) {
        return {
          consumerOptions: {
            id: existingConsumer.id,
            producerId: existingConsumer.producerId,
            kind: existingConsumer.kind,
            rtpParameters: existingConsumer.rtpParameters,
            appData: existingConsumer.appData
          }
        };
      }
    }

    const consumer = await entry.transport.consume({
      producerId,
      rtpCapabilities,
      paused: true
    });

    peer.consumers.set(consumer.id, consumer);

    this.consumers.set(consumer.id, {
      consumer,
      roomId: entry.roomId,
      channelId: entry.channelId,
      peerId: entry.peerId,
      producerId
    });

    consumer.on("transportclose", () => {
      this._deleteConsumer(consumer.id);
    });

    consumer.on("producerclose", () => {
      this._deleteConsumer(consumer.id);
      this._emitToChannel(entry.roomId, entry.channelId, "mediasoup:consumerClosed", {
        consumerId: consumer.id,
        producerId,
        peerId: entry.peerId,
        roomId: entry.roomId,
        channelId: entry.channelId
      });
    });

    return {
      consumerOptions: {
        id: consumer.id,
        producerId: consumer.producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        appData: consumer.appData
      }
    };
  }

  async resumeConsumer(consumerId) {
    const entry = this.consumers.get(consumerId);
    if (!entry) {
      throw new Error(`Consumer not found: ${consumerId}`);
    }

    await entry.consumer.resume();
    return true;
  }

  async pauseConsumer(consumerId) {
    const entry = this.consumers.get(consumerId);
    if (!entry) {
      throw new Error(`Consumer not found: ${consumerId}`);
    }

    await entry.consumer.pause();
    return true;
  }

  async pausePeerProducer(roomId, channelId, peerId) {
    const producer = this._getPeerAudioProducer(roomId, channelId, peerId);
    if (!producer || producer.paused) {
      return false;
    }

    await producer.pause();
    return true;
  }

  async resumePeerProducer(roomId, channelId, peerId) {
    const producer = this._getPeerAudioProducer(roomId, channelId, peerId);
    if (!producer || !producer.paused) {
      return false;
    }

    await producer.resume();
    return true;
  }

  async closePeerMedia(roomId, channelId, peerId) {
    const channel = this._getChannelState(roomId, channelId);
    const peer = channel.peers.get(peerId);

    if (!peer) {
      return;
    }

    for (const transport of peer.transports.values()) {
      if (!transport.closed) {
        transport.close();
      }
    }

    for (const producer of peer.producers.values()) {
      if (!producer.closed) {
        producer.close();
      }
    }

    for (const consumer of peer.consumers.values()) {
      if (!consumer.closed) {
        consumer.close();
      }
    }

    channel.peers.delete(peerId);
  }

  async closeChannel(roomId, channelId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }

    const channel = room.channels.get(channelId);
    if (!channel) {
      return;
    }

    for (const peerId of Array.from(channel.peers.keys())) {
      await this.closePeerMedia(roomId, channelId, peerId);
    }

    if (channel.router && !channel.router.closed) {
      channel.router.close();
    }

    room.channels.delete(channelId);

    if (room.channels.size === 0) {
      this.rooms.delete(roomId);
    }
  }

  _getPeerAudioProducer(roomId, channelId, peerId) {
    const channel = this._getChannelState(roomId, channelId);
    const peer = channel.peers.get(peerId);

    if (!peer) {
      return null;
    }

    for (const producer of peer.producers.values()) {
      if (producer.kind === "audio") {
        return producer;
      }
    }

    return null;
  }

  _emitToChannel(roomId, channelId, event, payload) {
    if (!this.io) {
      return;
    }

    this.io.to(createChannelRoomKey(roomId, channelId)).emit(event, payload);
  }

  _deleteProducer(producerId) {
    const entry = this.producers.get(producerId);
    if (!entry) {
      return;
    }

    const channel = this._getChannelState(entry.roomId, entry.channelId);
    const peer = channel.peers.get(entry.peerId);

    if (peer) {
      peer.producers.delete(producerId);
    }

    this.producers.delete(producerId);
  }

  _deleteConsumer(consumerId) {
    const entry = this.consumers.get(consumerId);
    if (!entry) {
      return;
    }

    const channel = this._getChannelState(entry.roomId, entry.channelId);
    const peer = channel.peers.get(entry.peerId);

    if (peer) {
      peer.consumers.delete(consumerId);
    }

    this.consumers.delete(consumerId);
  }

  _transportToClientPayload(transport) {
    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters
    };
  }
}

const mediasoupManager = new MediasoupManager();

export default mediasoupManager;
export { createChannelRoomKey };
