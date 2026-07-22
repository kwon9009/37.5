import { create } from "zustand";

const STORAGE_KEY = "37.5-auth";

function readStoredAuth() {
  const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const stored = readStoredAuth();

export const useAuthStore = create((set) => ({
  accessToken: stored?.accessToken ?? null,
  userId: stored?.userId ?? null,
  role: stored?.role ?? null,
  loginId: stored?.loginId ?? null,

  login: ({ accessToken, userId, role, loginId }, keepSignedIn) => {
    const payload = JSON.stringify({ accessToken, userId, role, loginId });
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    (keepSignedIn ? localStorage : sessionStorage).setItem(STORAGE_KEY, payload);
    set({ accessToken, userId, role, loginId });
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    set({ accessToken: null, userId: null, role: null, loginId: null });
  },
}));
