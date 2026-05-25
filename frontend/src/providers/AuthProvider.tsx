import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "../stores/auth.store";
import secureApi from "../api/secureApi";

type Props = { children: ReactNode };

export const AuthProvider = ({ children }: Props) => {
  const setUser = useAuthStore((state) => state.setUser);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setHmacSecret = useAuthStore((state) => state.setHmacSecret);
  const setHydrating = useAuthStore((state) => state.setHydrating);
  const setReady = useAuthStore((state) => state.setReady);

  useEffect(() => {
    const restore = async () => {
      setHydrating(true);
      try {
        const response = await secureApi.post<{ accessToken: string }>("/api/auth/refresh");
        setAccessToken(response.accessToken);
        const me = await secureApi.get<{ user: { id: string; email: string; role: string } }>("/api/auth/me");
        setUser(me.user);
      } catch {
        setAccessToken(null);
        setHmacSecret(null);
        setUser(null);
      } finally {
        setHydrating(false);
        setReady(true);
      }
    };

    restore();

    const handler = () => {
      setAccessToken(null);
      setHmacSecret(null);
      setUser(null);
      setHydrating(false);
      setReady(true);
    };

    window.addEventListener("auth:unauthorized", handler);
    return () => window.removeEventListener("auth:unauthorized", handler);
  }, [setAccessToken, setHmacSecret, setHydrating, setReady, setUser]);

  return <>{children}</>;
};
