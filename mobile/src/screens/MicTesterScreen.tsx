import React, { useState } from 'react';
import { View, Text, TouchableOpacity, PermissionsAndroid, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// @ts-ignore
import { mediaDevices, MediaStream } from 'react-native-webrtc';
import { Device } from 'mediasoup-client';
import getSocket from '../services/socket';
import { setupWebRTC } from '../services/webrtc/setupWebRTC';
import useAppStore from '../store/useAppStore';

export default function MicTesterScreen({ navigation }: any) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [bytesSent, setBytesSent] = useState(0);

  const addLog = (msg: string) => {
    console.log('[MicTester] ' + msg);
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].slice(0, 8)} ${msg}`]);
  };

  const deviceId = useAppStore(s => s.deviceId);
  const displayName = useAppStore(s => s.displayName);

  const startTest = async () => {
    setIsTesting(true);
    setLogs([]);
    setBytesSent(0);
    setupWebRTC();
    addLog('=== MEDIASOUP FULL PIPELINE TEST ===');

    try {
      // ── Step 1: Permissions ──
      if (Platform.OS === 'android') {
        addLog('Step 1: Requesting RECORD_AUDIO...');
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          addLog('FAIL: Microphone permission denied.');
          setIsTesting(false);
          return;
        }
        addLog('OK: Permission granted');
      }

      // ── Step 2: Get mic stream ──
      addLog('Step 2: getUserMedia...');
      const stream = await mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false
      });
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) {
        addLog('FAIL: No audio track in stream!');
        setIsTesting(false);
        return;
      }
      audioTrack.enabled = true;
      addLog(`OK: Track id=${audioTrack.id} enabled=${audioTrack.enabled} readyState=${audioTrack.readyState}`);

      // ── Step 3: Socket — create a test room ──
      addLog('Step 3: Creating test room via socket...');
      const socket = getSocket();

      const roomData: any = await new Promise((resolve, reject) => {
        socket.emit('createRoom', { deviceId: deviceId || 'mic-tester', displayName: displayName || 'MicTester' }, (res: any) => {
          // createRoom uses event-based response, not callback
        });
        // Listen for the roomJoined event
        const timeout = setTimeout(() => reject(new Error('Room creation timed out')), 5000);
        socket.once('roomJoined', (data: any) => {
          clearTimeout(timeout);
          resolve(data);
        });
        socket.once('error', (err: any) => {
          clearTimeout(timeout);
          reject(new Error(err?.message || 'Room creation failed'));
        });
      });

      const roomId = roomData.room.id;
      const channelId = 'channel-1';
      addLog(`OK: Room created: ${roomId}, channel: ${channelId}`);

      // ── Step 4: Mediasoup Device ──
      addLog('Step 4: Loading mediasoup Device...');
      const routerResponse: any = await new Promise((resolve) => {
        socket.emit('mediasoup:getRouterRtpCapabilities', { roomId, channelId }, resolve);
      });
      if (!routerResponse?.ok) {
        addLog(`FAIL: Router capabilities: ${JSON.stringify(routerResponse)}`);
        setIsTesting(false);
        return;
      }

      const device = new Device();
      await device.load({ routerRtpCapabilities: routerResponse.routerRtpCapabilities });
      addLog(`OK: Device loaded, handler: ${device.handlerName}`);

      // ── Step 5: Create Send Transport ──
      addLog('Step 5: Creating send transport...');
      const transResponse: any = await new Promise((resolve) => {
        socket.emit('mediasoup:createTransport', { roomId, channelId, direction: 'send' }, resolve);
      });
      if (!transResponse?.ok) {
        addLog(`FAIL: Transport creation: ${JSON.stringify(transResponse)}`);
        setIsTesting(false);
        return;
      }

      // ── Log ICE candidates from server ──
      const candidates = transResponse.transport?.iceCandidates || [];
      addLog(`ICE candidates count: ${candidates.length}`);
      candidates.forEach((c: any, i: number) => {
        addLog(`  ICE[${i}]: ip=${c.ip} port=${c.port} proto=${c.protocol} type=${c.type}`);
      });

      const transport = device.createSendTransport(transResponse.transport);
      addLog(`OK: Transport created: ${transport.id}`);

      // ── Transport event handlers ──
      transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        addLog('Step 6: Transport CONNECT event fired...');
        socket.emit('mediasoup:connectTransport', { transportId: transport.id, dtlsParameters }, (res: any) => {
          if (!res || !res.ok) {
            addLog(`FAIL: connectTransport response: ${JSON.stringify(res)}`);
            errback(new Error('Connect failed'));
          } else {
            addLog('OK: Transport connected on server');
            callback();
          }
        });
      });

      transport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
        addLog(`Step 7: Transport PRODUCE event: ${kind}`);
        socket.emit('mediasoup:produce', { transportId: transport.id, kind, rtpParameters, appData }, (res: any) => {
          if (!res || !res.ok) {
            addLog(`FAIL: produce response: ${JSON.stringify(res)}`);
            errback(new Error('Produce failed'));
          } else {
            addLog(`OK: Producer created: ${res.producerId}`);
            callback({ id: res.producerId });
          }
        });
      });

      transport.on('connectionstatechange', (state) => {
        addLog(`>>> TRANSPORT STATE: ${state}`);
        if (state === 'connected') {
          addLog('SUCCESS: ICE+DTLS connection established!');
        }
        if (state === 'failed') {
          addLog('FAIL: ICE connection failed. Phone cannot reach server RTP ports!');
        }
      });

      // ── Step 8: Produce ──
      addLog('Step 8: Calling transport.produce()...');
      const producer = await transport.produce({ track: audioTrack, stopTracks: false });
      addLog(`OK: Producer ready: ${producer.id}, paused=${producer.paused}`);

      // ── Step 9: Poll stats ──
      addLog('Step 9: Polling RTP stats every 2s for 20s...');
      const interval = setInterval(() => {
        if (producer.closed) return clearInterval(interval);
        producer.getStats().then(stats => {
          stats.forEach(stat => {
            if (stat.type === 'outbound-rtp') {
              setBytesSent(stat.bytesSent);
              addLog(`  [RTP] bytesSent=${stat.bytesSent} packetsSent=${stat.packetsSent}`);
            }
          });
        }).catch(() => {});
      }, 2000);

      // ── Cleanup after 20s ──
      setTimeout(() => {
        clearInterval(interval);
        producer.close();
        transport.close();
        stream.release();
        // Leave the test room
        socket.emit('leaveRoom', { deviceId: deviceId || 'mic-tester', roomId });
        addLog('=== TEST COMPLETE ===');
        setIsTesting(false);
      }, 20000);

    } catch (err: any) {
      addLog(`ERROR: ${err.message || String(err)}`);
      setIsTesting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background px-4 py-6">
      <View className="mb-4">
        <Text className="text-2xl font-bold text-white mb-1">Mediasoup Pipeline Tester</Text>
        <Text className="text-gray-400 text-xs">
          Creates a real room, real transport, real producer. Logs every step.
        </Text>
      </View>

      <TouchableOpacity
        onPress={startTest}
        disabled={isTesting}
        className={`w-full py-4 rounded-xl items-center justify-center mb-4 ${isTesting ? 'bg-gray-600' : 'bg-primary'}`}
      >
        <Text className="text-white font-bold text-lg">{isTesting ? 'Testing...' : 'Run Full Pipeline Test'}</Text>
      </TouchableOpacity>

      <View className="flex-row justify-between bg-black/30 p-4 rounded-xl mb-4">
        <Text className="text-gray-300 font-semibold">Bytes Sent:</Text>
        <Text className={`font-bold ${bytesSent > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {bytesSent}
        </Text>
      </View>

      <ScrollView className="flex-1 bg-black/50 rounded-xl p-4">
        {logs.map((log, i) => (
          <Text key={i} className="text-green-400 text-xs font-mono mb-1">{log}</Text>
        ))}
      </ScrollView>

      <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4 p-3 items-center">
        <Text className="text-gray-400">Go Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
