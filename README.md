# AURA
**High-Fidelity. Low-Latency. The next-generation WebRTC walkie-talkie platform.**

AURA is a sophisticated, real-time communication system engineered to deliver instant Push-To-Talk (PTT) capabilities across mobile and wearable devices. 

## Problem Statement
Traditional voice chat applications are bloated, computationally heavy, and rely on Peer-to-Peer (P2P) mesh networks. In a P2P architecture, every participant must send their audio stream to every other participant, causing exponential bandwidth degradation and high latency as the number of users increases. Furthermore, most voice apps do not support persistent background operation natively on mobile, cutting communication when the app is minimized.

## The AURA Solution
AURA is purpose-built for the critical moment. By leveraging a centralized Selective Forwarding Unit (SFU) architecture using **mediasoup** and raw WebRTC, AURA processes and routes all audio streams through an intelligent backend server. This ensures that clients only need to send one stream up and receive one optimized stream down, allowing the system to scale flawlessly even in low-bandwidth environments.

## Key Features

### Core Communication
- **Instant Push-To-Talk (PTT):** Sub-second latency voice transmission utilizing the high-fidelity Opus codec over raw UDP transports.
- **Intelligent Audio Routing:** Advanced hardware integration using `InCallManager` dynamically routes audio between the loud speakerphone, Bluetooth headsets, and wired peripherals seamlessly without dropping the WebRTC connection.
- **Multi-Channel Multiplexing:** Instantly switch between isolated communication frequencies (channels) within a unified room context, managed securely by the SFU without tearing down the connection.

### Platform Integration
- **Background Persistence Engine:** A resilient, native Android Foreground Service ensures socket signaling and WebRTC transports remain completely active, even when the device is locked, asleep, or the app is swiped away.
- **Cross-Device Wear OS Bridge:** A fully synchronized smartwatch application built with Jetpack Compose. It leverages the Wearable Data Layer API to remotely trigger transmissions, toggle the active microphone source, and mirror the room state on your wrist.
- **Deep Link Provisioning:** Instant, frictionless room access. Clicking an `aura://join/` link automatically launches the app, authenticates the operative, and bypasses the entry screens to immediately tune into the target frequency.

### Architecture & Reliability
- **Authoritative State Sync:** The React Native `Zustand` global store is kept in perfect harmony with the Node.js backend via authoritative `Socket.io` event broadcasts, ensuring UI consistency across all connected clients.
- **In-Flight Flood Protection:** Robust debouncing and concurrency guards prevent backend flooding, race conditions, and duplicate WebRTC producer instances during rapid hardware interactions.
- **Live Telemetry & Roster:** Real-time observability into active room members, online connectivity statuses, channel population, and instantaneous active-speaker indications.

## System Architecture

AURA is not a standard REST API application; it is a persistent, stateful, real-time media engine.

1. **Signaling Layer (Socket.io):** Handles room orchestration, member joins/leaves, channel switching, and PTT intent signaling. State changes on the backend are instantly broadcasted to all relevant clients.
2. **Media Layer (mediasoup SFU):** When a user enters a room, the server provisions a dedicated WebRTC Router. Client audio is ingested via a `Producer` transport and dynamically distributed to other clients in the same channel via `Consumer` transports. 
3. **Audio Pipeline:** All voice data is encoded using high-fidelity `audio/opus` and transmitted over UDP-based RTP streams. The backend intelligently handles dynamic mic allocation to prevent echo and manage permissions.
4. **Cloud-Ready Infrastructure:** Designed for highly scalable deployments on providers like Oracle Cloud. The backend dynamically configures `MEDIASOUP_ANNOUNCED_IP` and manages dedicated UDP port ranges for media traversal across NATs.

## Modules

### Access & Entry
Handles user provisioning and room creation/joining. Users can create private frequencies or join existing ones via deep-linking (`aura://join/`).

### Real-Time Communication Engine
The core WebRTC pipeline. Manages the lifecycle of device microphones, audio tracks, and the complex handshake required to establish mediasoup WebRTC transports.

### Room Orchestration & Control
Manages the logical division of users. Supports dynamically switching between channels (e.g., Alpha, Beta) within the same room without tearing down the underlying WebRTC connection.

### Platform Integration
Bridges the gap between the React Native JavaScript context and native device APIs. This includes the Android Foreground Service for background audio and the Wear OS bridge for smartwatch communication.

## Tech Stack
- **Client:** React Native, TypeScript, NativeWind, Zustand, react-native-webrtc.
- **Server:** Node.js, Express, Socket.io, mediasoup (C++ WebRTC worker).
- **Wearable:** Android Native (Wear OS), Kotlin, Jetpack Compose.
- **Website:** Next.js 15, Tailwind CSS v4, React.

## Project Structure
- `mobile/`: The primary React Native application for Android/iOS.
- `server/`: The Node.js + mediasoup SFU backend and signaling server.
- `watch/`: The native Wear OS companion application.
- `website/`: The Next.js landing page and presentation site.

## Setup Instructions

### 1. Server Setup
```bash
cd server
npm install
# Set MEDIASOUP_ANNOUNCED_IP to your local IP or public IP
# Ensure ports 3000 (TCP) and 40000-50000 (UDP) are open
npm start
```

### 2. Mobile Setup
```bash
cd mobile
npm install
# Update the API_URL in src/config/network.ts to point to your server
npm run android
```

## Future Scope
- **E2E Encryption:** Implementing WebRTC Insertable Streams for true end-to-end encryption of the audio payload.
- **Dynamic Scaling:** Orchestrating multiple mediasoup workers and cascading routers across geographic regions to minimize latency globally.
- **Advanced Codecs:** Support for variable bitrate encoding depending on network conditions.

## Links
- **Landing Page:** [AURA](https://aura-walkie-talkie.vercel.app/)
- **Download Mobile APK:** [GitHub Releases](https://github.com/DoonMad/AURA/releases/download/v1.0.0/aura.apk)
- **Download Watch APK:** [GitHub Releases](https://github.com/DoonMad/AURA/releases/download/v1.0.0/aura-watch.apk)
