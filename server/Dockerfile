# ── Build stage: compile mediasoup native C++ worker ──
FROM node:20-bookworm-slim AS builder

# mediasoup needs these to compile its C++ worker
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY server/package.json server/package-lock.json* ./
RUN npm ci --omit=dev

COPY server/ .

# ── Production stage: slim runtime ──
FROM node:20-bookworm-slim

WORKDIR /app

COPY --from=builder /app .

EXPOSE 3000/tcp
EXPOSE 40000-40020/udp
EXPOSE 40000-40020/tcp

CMD ["node", "src/server.js"]
