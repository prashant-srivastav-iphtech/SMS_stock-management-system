import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, Package, Boxes, Users } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const adminItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  { label: "Orders", path: "/orders", icon: <ShoppingCart size={18} /> },
  { label: "Stores", path: "/stores", icon: <Package size={18} /> },
  { label: "Products", path: "/products", icon: <Package size={18} /> },
  { label: "Inventory", path: "/inventory", icon: <Boxes size={18} /> },
  { label: "Customers", path: "/customers", icon: <Users size={18} /> },
];

const customerItems = [
  { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Products", path: "/products", icon: <Package size={18} /> },
  { label: "Orders", path: "/orders", icon: <ShoppingCart size={18} /> },
];

export const Sidebar = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const items = isAdmin ? adminItems : customerItems;

  return (
    <aside className="w-72 min-h-screen bg-slate-950 text-white p-6">
      <div className="mb-10">
        <h2 className="text-3xl font-bold">OMS</h2>
        <p className="mt-2 text-sm text-slate-400">{isAdmin ? "Admin control center" : "Customer workspace"}</p>
      </div>
      <nav className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
              location.pathname === item.path ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};
