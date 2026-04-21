/**
 * Server-to-client model types shared by AURA frontend.
 * Keep this in sync with server/src/models/*.js.
 */

export type User = {
  id: string;
  name: string;
  roomId: string;
  isSpeaking: boolean;
};

export type Channel = {
  id: string;
  name: string;
  members: string[];
  activeSpeaker: string | null;
};

export type Room = {
  id: string;
  ownerId: string;
  admins: string[];
  members: string[];
  pastMembers: string[];
  channels: Record<string, Channel>;
};
