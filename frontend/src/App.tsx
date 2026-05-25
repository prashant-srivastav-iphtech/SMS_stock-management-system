import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./providers/AuthProvider";
import { useAuth } from "./hooks/useAuth";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { Dashboard } from "./pages/Dashboard";
import { Orders } from "./pages/Orders";
import { Products } from "./pages/Products";
import { Inventory } from "./pages/Inventory";
import { Customers } from "./pages/Customers";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import Stores from "./pages/Stores";

const FullScreenLoader = () => (
  <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
    <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 text-center shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">Restoring your session</h1>
      <p className="mt-2 text-sm text-slate-500">Please wait while we reconnect you to your workspace.</p>
    </div>
  </main>
);

const RoleGuard = ({ allow, children }: { allow: Array<"admin" | "customer">; children: ReactNode }) => {
  const auth = useAuth();

  if (!auth.user) {
    return <Navigate to="/login" replace />;
  }

  if (!allow.includes(auth.user.role as "admin" | "customer")) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AuthenticatedLayout = () => {
  const auth = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex-1">
        <Topbar />
        <main className="p-6">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/products" element={<Products />} />
            <Route
              path="/inventory"
              element={
                <RoleGuard allow={["admin"]}>
                  <Inventory />
                </RoleGuard>
              }
            />
            <Route
              path="/stores"
              element={
                <RoleGuard allow={["admin"]}>
                  <Stores />
                </RoleGuard>
              }
            />
            <Route
              path="/customers"
              element={
                <RoleGuard allow={["admin"]}>
                  <Customers />
                </RoleGuard>
              }
            />
            <Route
              path="*"
              element={
                <Navigate
                  to={auth.isAdmin ? "/dashboard" : "/products"}
                  replace
                />
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const PublicLayout = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

const AppShell = () => {
  const auth = useAuth();
  if (!auth.isReady || auth.isHydrating) {
    return <FullScreenLoader />;
  }
  return auth.isAuthenticated ? <AuthenticatedLayout /> : <PublicLayout />;
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
