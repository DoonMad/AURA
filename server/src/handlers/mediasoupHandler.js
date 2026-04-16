import mediasoupManager, { createChannelRoomKey } from "../mediasoup/mediasoupManager.js";
import { getRoom } from "../repositories/roomRepository.js";
import { getUser } from "../repositories/userRepository.js";

function reply(callback, payload) {
    if (typeof callback === "function") {
        callback(payload);
    }
}

function fail(callback, message) {
    reply(callback, { ok: false, error: message });
}

function resolvePeerContext(socket, roomId, channelId) {
    const deviceId = socket.data.deviceId;

    if (!deviceId) {
        return { error: "socket-not-associated-with-device" };
    }

    const room = getRoom(roomId);
    if (!room) {
        return { error: "room-not-found" };
    }

    const channel = room.getChannel(channelId);
    if (!channel) {
        return { error: "channel-not-found" };
    }

    const user = getUser(deviceId);
    if (!user || user.roomId !== roomId || user.currentChannelId !== channelId) {
        return { error: "not-in-channel" };
    }

    return { deviceId, room, channel, user };
}

export default function registerMediasoupEventHandlers(socket, io) {
    socket.on("mediasoup:getRouterRtpCapabilities", async ({ roomId, channelId }, callback) => {
        try {
            const context = resolvePeerContext(socket, roomId, channelId);
            if (context.error) {
                return fail(callback, context.error);
            }

            const routerRtpCapabilities = await mediasoupManager.getRouterRtpCapabilities(roomId, channelId);
            reply(callback, { ok: true, routerRtpCapabilities });
        } catch (error) {
            console.error("mediasoup:getRouterRtpCapabilities failed", error);
            fail(callback, error.message);
        }
    });

    socket.on("mediasoup:createTransport", async ({ roomId, channelId, direction }, callback) => {
        try {
            const context = resolvePeerContext(socket, roomId, channelId);
            if (context.error) {
                return fail(callback, context.error);
            }

            console.log("[mediasoup] createTransport", { roomId, channelId, direction, peerId: context.deviceId });
            const transport = await mediasoupManager.createWebRtcTransport({
                roomId,
                channelId,
                peerId: context.deviceId,
                direction
            });

            reply(callback, { ok: true, transport });
        } catch (error) {
            console.error("mediasoup:createTransport failed", error);
            fail(callback, error.message);
        }
    });

    socket.on("mediasoup:connectTransport", async ({ transportId, dtlsParameters }, callback) => {
        try {
            console.log("[mediasoup] connectTransport", {
                transportId,
                hasDtlsParameters: Boolean(dtlsParameters),
                fingerprintCount: Array.isArray(dtlsParameters?.fingerprints) ? dtlsParameters.fingerprints.length : 0
            });
            await mediasoupManager.connectTransport(transportId, dtlsParameters);
            reply(callback, { ok: true });
        } catch (error) {
            console.error("mediasoup:connectTransport failed", error);
            fail(callback, error.message);
        }
    });

    socket.on("mediasoup:produce", async ({ transportId, kind, rtpParameters, appData }, callback) => {
        try {
            console.log("[mediasoup] produce", {
                transportId,
                kind,
                hasRtpParameters: Boolean(rtpParameters),
                appData
            });

            if (kind !== "audio") {
                throw new Error(`unsupported kind: ${kind}`);
            }

            const result = await mediasoupManager.produce({
                transportId,
                kind,
                rtpParameters,
                appData
            });

            console.log("[mediasoup] produce ok", { transportId, producerId: result.id });
            reply(callback, { ok: true, producerId: result.id });
        } catch (error) {
            console.error("mediasoup:produce failed", error);
            fail(callback, error.message);
        }
    });

    socket.on("mediasoup:getProducers", async ({ roomId, channelId }, callback) => {
        try {
            const context = resolvePeerContext(socket, roomId, channelId);
            if (context.error) {
                return fail(callback, context.error);
            }

            const producers = await mediasoupManager.getProducers(roomId, channelId, context.deviceId);
            reply(callback, { ok: true, producers });
        } catch (error) {
            console.error("mediasoup:getProducers failed", error);
            fail(callback, error.message);
        }
    });

    socket.on("mediasoup:consume", async ({ transportId, producerId, rtpCapabilities }, callback) => {
        try {
            console.log("[mediasoup] consume", { transportId, producerId });
            const result = await mediasoupManager.consume({
                transportId,
                producerId,
                rtpCapabilities
            });

            reply(callback, { ok: true, ...result });
        } catch (error) {
            console.error("mediasoup:consume failed", error);
            fail(callback, error.message);
        }
    });

    socket.on("mediasoup:resumeConsumer", async ({ consumerId }, callback) => {
        try {
            console.log("[mediasoup] resumeConsumer", consumerId);
            await mediasoupManager.resumeConsumer(consumerId);
            reply(callback, { ok: true });
        } catch (error) {
            console.error("mediasoup:resumeConsumer failed", error);
            fail(callback, error.message);
        }
    });

    socket.on("mediasoup:pauseConsumer", async ({ consumerId }, callback) => {
        try {
            await mediasoupManager.pauseConsumer(consumerId);
            reply(callback, { ok: true });
        } catch (error) {
            console.error("mediasoup:pauseConsumer failed", error);
            fail(callback, error.message);
        }
    });
}

export { createChannelRoomKey };
