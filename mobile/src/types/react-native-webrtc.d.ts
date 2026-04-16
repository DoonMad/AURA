declare module 'react-native-webrtc' {
  export type MediaStreamTrack = {
    id: string;
    kind: 'audio' | 'video';
    enabled: boolean;
    stop(): void;
  };

  export class MediaStream {
    constructor(tracks?: MediaStreamTrack[]);
    addTrack(track: MediaStreamTrack): void;
    getTracks(): MediaStreamTrack[];
    getAudioTracks(): MediaStreamTrack[];
    getVideoTracks(): MediaStreamTrack[];
  }

  export const mediaDevices: {
    getUserMedia(constraints: {
      audio?: boolean | Record<string, unknown>;
      video?: boolean | Record<string, unknown>;
    }): Promise<MediaStream>;
  };

  export function registerGlobals(): void;
}

