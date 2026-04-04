import { Room, User } from "./models";

export type RootStackParamList = {
  Entry: { deviceId: string };
  Room: {
    room: Room,
    members: User[]
  };
  Members: {
    room: Room,
    members: User[]
  };
};
