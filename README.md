# AURA
**High-Fidelity. Low-Latency. The next-generation WebRTC walkie-talkie platform.**

AURA is a sophisticated, real-time communication system engineered to deliver instant Push-To-Talk (PTT) capabilities across mobile and wearable devices. 

## Problem Statement
Traditional voice chat applications are bloated, computationally heavy, and rely on Peer-to-Peer (P2P) mesh networks. In a P2P architecture, every participant must send their audio stream to every other participant, causing exponential bandwidth degradation and high latency as the number of users increases. Furthermore, most voice apps do not support persistent background operation natively on mobile, cutting communication when the app is minimized.

## The AURA Solution
AURA is purpose-built for the critical moment. By leveraging a centralized Selective Forwarding Unit (SFU) architecture using **mediasoup** and raw WebRTC, AURA processes and routes all audio streams through an intelligent backend server. This ensures that clients only need to send one stream up and receive one optimized stream down, allowing the system to scale flawlessly even in low-bandwidth environments.

## Key Features
- **Instant Push-To-Talk:** Sub-second latency PTT utilizing the Opus codec over raw UDP transports.
- **Multi-Channel Routing:** Seamlessly switch between isolated communication frequencies (channels) within a unified room context.
- **Background Persistence:** A native Android foreground service ensures the socket signaling and WebRTC transport stay alive, even when the device is locked or the app is minimized.
- **Wear OS Companion:** A synchronized smartwatch application that mirrors the room state and allows operators to trigger transmissions directly from their wrist using the Wearable Data Layer API.
- **Live Roster & Telemetry:** Real-time visibility into active members, online statuses, and live speaker indications.
- **Authoritative State Sync:** The React Native Zustand store is perfectly synchronized with the Node.js backend via authoritative Socket.io broadcasts.

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
- **Download Mobile APK:** [GitHub Releases](https://github.com/DoonMad/AURA/releases)
- **Download Watch APK:** [GitHub Releases](https://github.com/DoonMad/AURA/releases)
