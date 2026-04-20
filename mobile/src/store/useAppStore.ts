/**
 * useAppStore — Global Zustand store for the AURA app.
 *
 * Holds all shared state that multiple screens need access to:
 *   - Identity: deviceId + displayName (set once at app start)
 *   - Session:  socket, room, members (change during a session)
 *
 * Members are stored in a Map<string, User> for O(1) lookups by ID.
 * Use `membersArray` selector when you need to iterate/render a list.
 */

import { create } from 'zustand';
import type { Socket } from 'socket.io-client';
import type { Room, User } from '../types/models';

export type AppNoticeTone = 'info' | 'success' | 'warning' | 'error';

export type AppNotice = {
  tone: AppNoticeTone;
  title: string;
  message: string;
};

/* ────────────────────────────────────────────
 * Store shape
 * ──────────────────────────────────────────── */

interface AppState {
  // ── Identity (set once, rarely changes) ──
  deviceId: string | null;
  displayName: string | null;

  // ── Session (changes in real-time) ──
  socket: Socket | null;
  room: Room | null;
  members: Map<string, User>;          // keyed by user.id for O(1) lookups
  notice: AppNotice | null;

  // ── Actions ──
  setIdentity: (deviceId: string, displayName: string | null) => void;
  setDisplayName: (displayName: string) => void;
  setSocket: (socket: Socket) => void;
  setRoom: (room: Room | null) => void;
  setMembers: (users: User[]) => void;  // accepts an array, stores as Map
  updateMember: (user: User) => void;   // update a single member in-place
  clearSession: () => void;             // called on leave room / disconnect
  setNotice: (notice: AppNotice | null) => void;
}

/* ────────────────────────────────────────────
 * Store implementation
 * ──────────────────────────────────────────── */

const useAppStore = create<AppState>((set) => ({
  // ── Initial state ──
  deviceId: null,
  displayName: null,
  socket: null,
  room: null,
  members: new Map(),
  notice: null,

  // ── Actions ──
  setIdentity: (deviceId, displayName) =>
    set({ deviceId, displayName }),

  setDisplayName: (displayName) =>
    set({ displayName }),

  setSocket: (socket) =>
    set({ socket }),

  setRoom: (room) =>
    set({ room }),

  setMembers: (users) =>
    set({ members: new Map(users.map(u => [u.id, u])) }),

  updateMember: (user) =>
    set((state) => {
      const updated = new Map(state.members);
      updated.set(user.id, user);
      return { members: updated };
    }),

  clearSession: () =>
    set({ room: null, members: new Map(), notice: null }),

  setNotice: (notice) =>
    set({ notice }),
}));

/* ────────────────────────────────────────────
 * Convenience selectors
 *
 * Use these in components for clean, targeted subscriptions.
 * Each selector only triggers a re-render when its specific
 * slice of state changes.
 * ──────────────────────────────────────────── */

/** The current user's User object (O(1) lookup). */
export const useCurrentUser = (): User | undefined => {
  const deviceId = useAppStore((s) => s.deviceId);
  const members = useAppStore((s) => s.members);
  return deviceId ? members.get(deviceId) : undefined;
};

/** Get a member by ID (O(1) lookup). */
export const useMemberById = (id: string | null | undefined): User | undefined => {
  const members = useAppStore((s) => s.members);
  return id ? members.get(id) : undefined;
};

/** All members as an array (for rendering lists). */
export const useMembersArray = (): User[] => {
  const members = useAppStore((s) => s.members);
  return Array.from(members.values());
};

export default useAppStore;
