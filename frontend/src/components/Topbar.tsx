import { LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import secureApi from "../api/secureApi";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";

export const Topbar = () => {
  const { user, isAdmin } = useAuth();
  const setUser = useAuthStore((state) => state.setUser);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setHmacSecret = useAuthStore((state) => state.setHmacSecret);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await secureApi.post("/api/auth/logout");
    } finally {
      setUser(null);
      setAccessToken(null);
      setHmacSecret(null);
      navigate("/login");
    }
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{isAdmin ? "Admin Dashboard" : "Customer Dashboard"}</h1>
        <p className="text-sm text-slate-500">{isAdmin ? "Manage catalog, inventory, and orders" : "Browse products and track your orders"}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm font-medium text-slate-800">{user?.email}</div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{user?.role}</div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </div>
  );
};
