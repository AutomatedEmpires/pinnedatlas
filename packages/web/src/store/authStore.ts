import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

const storedToken = localStorage.getItem('whc_token');
const storedUser = (() => {
  try {
    const s = localStorage.getItem('whc_user');
    return s ? (JSON.parse(s) as User) : null;
  } catch {
    return null;
  }
})();

export const useAuthStore = create<AuthState>((set) => ({
  user: storedUser,
  token: storedToken,
  login: (user, token) => {
    localStorage.setItem('whc_token', token);
    localStorage.setItem('whc_user', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('whc_token');
    localStorage.removeItem('whc_user');
    set({ user: null, token: null });
  },
  setUser: (user) => {
    localStorage.setItem('whc_user', JSON.stringify(user));
    set({ user });
  },
}));
