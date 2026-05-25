import { useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import { ArrowUpRight, DollarSign, Package, ShoppingBag, Users } from "lucide-react";
import secureApi from "../api/secureApi";
import { useAuth } from "../hooks/useAuth";

type Product = {
  id: string;
  name: string;
  stock: number;
  reservedStock: number;
  soldStock: number;
  status: string;
};

type Order = {
  id: string;
  total: string | number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  customerId: string;
  customer?: { id: string; email: string; firstName: string; lastName?: string };
  items?: Array<{ id: string; quantity: number; product?: { name: string } }>;
};

const Card = ({ title, value, description, icon }: { title: string; value: string; description: string; icon: ReactNode }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      </div>
      <div className="rounded-2xl bg-slate-950 p-3 text-white">{icon}</div>
    </div>
    <p className="mt-4 text-sm text-slate-500">{description}</p>
  </div>
);

export const Dashboard = () => {
  const { isAdmin, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [orderResponse, productResponse] = await Promise.all([
          secureApi.get<{ orders: Order[] }>(isAdmin ? "/api/orders/admin" : "/api/orders"),
          secureApi.get<{ products: Product[] }>("/api/products"),
        ]);

        setOrders(orderResponse.orders);
        setProducts(productResponse.products);
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? (error.response?.data as { message?: string } | undefined)?.message || "Unable to load dashboard"
          : "Unable to load dashboard";
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isAdmin]);

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const pendingOrders = orders.filter((order) => ["pending", "confirmed", "processing"].includes(order.status)).length;
  const uniqueCustomers = new Set(orders.map((order) => order.customer?.id || order.customerId)).size;
  const totalUnits = products.reduce((sum, product) => sum + product.stock, 0);
  const recentOrders = orders.slice(0, 4);
  const lowStockProducts = products.filter((product) => product.stock <= 10).slice(0, 4);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          {isAdmin ? "Operations Overview" : `Welcome back, ${user?.email}`}
        </h1>
        <p className="mt-3 text-slate-500">
          {isAdmin ? "A live snapshot of orders, revenue, and inventory." : "Your storefront activity, orders, and available catalog in one place."}
        </p>
      </section>

      {errorMessage && (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {errorMessage}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        <Card
          title={isAdmin ? "Revenue" : "Total Spent"}
          value={`$${totalRevenue.toFixed(2)}`}
          description={isAdmin ? "Combined value of tracked orders" : "Total value of your orders"}
          icon={<DollarSign size={20} />}
        />
        <Card
          title="Orders"
          value={String(orders.length)}
          description={isAdmin ? "Orders currently in the system" : "Orders placed from your account"}
          icon={<ShoppingBag size={20} />}
        />
        <Card
          title={isAdmin ? "Customers" : "Pending Orders"}
          value={String(isAdmin ? uniqueCustomers : pendingOrders)}
          description={isAdmin ? "Unique customers with orders" : "Orders still being processed"}
          icon={<Users size={20} />}
        />
        <Card
          title={isAdmin ? "Inventory Units" : "Products"}
          value={String(isAdmin ? totalUnits : products.length)}
          description={isAdmin ? "Total units across active products" : "Products currently visible in the catalog"}
          icon={isAdmin ? <Package size={20} /> : <ArrowUpRight size={20} />}
        />
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{isAdmin ? "Recent orders" : "Your latest orders"}</h2>
          {isLoading ? (
            <p className="mt-6 text-sm text-slate-500">Loading activity...</p>
          ) : recentOrders.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">No orders yet.</p>
          ) : (
            <div className="mt-6 space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-3xl border border-slate-200 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{order.id}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString()} • ${Number(order.total).toFixed(2)}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm capitalize text-emerald-700">{order.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{isAdmin ? "Low stock alerts" : "Catalog snapshot"}</h2>
          {isLoading ? (
            <p className="mt-6 text-sm text-slate-500">Loading product data...</p>
          ) : lowStockProducts.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              {isAdmin ? "No low stock alerts right now." : "Products are available and ready to browse."}
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="rounded-3xl border border-slate-200 p-4 text-slate-700">
                  Stock alert for product <span className="font-semibold text-slate-900">{product.name}</span> with only {product.stock} units left.
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
