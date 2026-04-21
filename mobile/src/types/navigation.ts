/**
 * Navigation type definitions.
 *
 * Screen params are `undefined` because all shared data (room, members,
 * deviceId) now lives in the Zustand store — no more prop drilling.
 */

export type RootStackParamList = {
  Entry: undefined;
  Room: undefined;
  Admin: undefined;
  Members: undefined;
  MicTester: undefined;
};
