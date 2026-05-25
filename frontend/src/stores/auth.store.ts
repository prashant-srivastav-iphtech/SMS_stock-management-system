import { create } from "zustand";

type AuthState = {
  accessToken: string | null;
  hmacSecret: string | null;
  user: { id: string; email: string; role: string } | null;
  isHydrating: boolean;
  isReady: boolean;
  setUser: (user: AuthState["user"]) => void;
  setAccessToken: (token: string | null) => void;
  setHmacSecret: (secret: string | null) => void;
  setHydrating: (value: boolean) => void;
  setReady: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  hmacSecret: null,
  user: null,
  isHydrating: true,
  isReady: false,
  setUser: (user) => set({ user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setHmacSecret: (hmacSecret) => set({ hmacSecret }),
  setHydrating: (isHydrating) => set({ isHydrating }),
  setReady: (isReady) => set({ isReady }),
}));

export const getAccessToken = () => useAuthStore.getState().accessToken;
export const getHmacSecret = () => useAuthStore.getState().hmacSecret;
export const setAccessToken = (token: string | null) => useAuthStore.getState().setAccessToken(token);
export const setHmacSecret = (secret: string | null) => useAuthStore.getState().setHmacSecret(secret);
