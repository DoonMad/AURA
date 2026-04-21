import { mediaDevices, MediaStream } from 'react-native-webrtc';

export type AudioCaptureSourceKind = 'phone' | 'external';

export type AudioCaptureLease = {
  stream: MediaStream;
  release: () => void | Promise<void>;
  kind: AudioCaptureSourceKind;
};

export interface AudioCaptureSource {
  kind: AudioCaptureSourceKind;
  acquire(): Promise<AudioCaptureLease>;
}

export class PhoneMicAudioCaptureSource implements AudioCaptureSource {
  kind: AudioCaptureSourceKind = 'phone';

  async acquire(): Promise<AudioCaptureLease> {
    const stream = await mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    return {
      kind: this.kind,
      stream,
      release: () => {
        stream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (error) {
            console.warn('[mediasoup] failed to stop phone capture track', error);
          }
        });
      },
    };
  }
}

export class ExternalStreamAudioCaptureSource implements AudioCaptureSource {
  kind: AudioCaptureSourceKind = 'external';

  constructor(private readonly stream: MediaStream) {}

  async acquire(): Promise<AudioCaptureLease> {
    return {
      kind: this.kind,
      stream: this.stream,
      release: () => undefined,
    };
  }
}
