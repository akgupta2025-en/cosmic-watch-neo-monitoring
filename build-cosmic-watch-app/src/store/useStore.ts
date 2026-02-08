import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email?: string;
  role: 'researcher' | 'enthusiast';
}

interface AppState {
  user: User | null;
  token: string | null;
  watchlist: string[]; // Asteroid IDs
  unit: 'km' | 'mi';
  login: (user: User) => void;
  logout: () => void;
  setToken: (token: string | null) => void;
  toggleWatchlist: (id: string) => void;
  setUnit: (unit: 'km' | 'mi') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      watchlist: [],
      unit: 'km',
      login: (user) => set({ user }),
      logout: () => set({ user: null, token: null, watchlist: [] }),
      setToken: (token) => set({ token }),
      toggleWatchlist: (id) =>
        set((state) => ({
          watchlist: state.watchlist.includes(id)
            ? state.watchlist.filter((wId) => wId !== id)
            : [...state.watchlist, id],
        })),
      setUnit: (unit) => set({ unit }),
    }),
    {
      name: 'cosmic-watch-storage',
    }
  )
);
