import { useMemo } from "react";
import { useAuthStore } from "../stores/auth.store";

export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrating = useAuthStore((state) => state.isHydrating);
  const isReady = useAuthStore((state) => state.isReady);

  return useMemo(
    () => ({
      user,
      accessToken,
      isHydrating,
      isReady,
      isAuthenticated: Boolean(user && accessToken),
      isAdmin: user?.role === "admin",
      isCustomer: user?.role === "customer",
    }),
    [user, accessToken, isHydrating, isReady],
  );
};
