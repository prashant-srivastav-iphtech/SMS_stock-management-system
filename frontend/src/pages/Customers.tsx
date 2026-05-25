import { useEffect, useState } from "react";
import axios from "axios";
import secureApi from "../api/secureApi";

type CustomerOrder = {
  id: string;
  total: string | number;
  customerId: string;
  createdAt: string;
  customer?: {
    id: string;
    email: string;
    firstName: string;
    lastName?: string;
    role: string;
  };
};

type CustomerSummary = {
  id: string;
  name: string;
  email: string;
  orders: number;
  totalSpent: number;
  lastOrderAt: string;
};

export const Customers = () => {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await secureApi.get<{ orders: CustomerOrder[] }>("/api/orders/admin");
        const grouped = new Map<string, CustomerSummary>();

        for (const order of response.orders) {
          const id = order.customer?.id || order.customerId;
          const existing = grouped.get(id);
          const name = [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(" ").trim() || "Unknown customer";
          const email = order.customer?.email || "No email";

          if (!existing) {
            grouped.set(id, {
              id,
              name,
              email,
              orders: 1,
              totalSpent: Number(order.total),
              lastOrderAt: order.createdAt,
            });
            continue;
          }

          existing.orders += 1;
          existing.totalSpent += Number(order.total);
          if (new Date(order.createdAt).getTime() > new Date(existing.lastOrderAt).getTime()) {
            existing.lastOrderAt = order.createdAt;
          }
        }

        setCustomers(Array.from(grouped.values()).sort((a, b) => b.totalSpent - a.totalSpent));
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? (error.response?.data as { message?: string } | undefined)?.message || "Unable to load customers"
          : "Unable to load customers";
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
        <p className="mt-3 text-slate-500">Review who is buying, how often they order, and their total spend.</p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Customer Activity</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{customers.length} customers</span>
        </div>

        {errorMessage && <p className="mt-4 text-sm text-red-600">{errorMessage}</p>}

        {isLoading ? (
          <p className="mt-6 text-sm text-slate-500">Loading customer insights...</p>
        ) : customers.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">No customer order data yet.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {customers.map((customer) => (
              <article key={customer.id} className="rounded-3xl border border-slate-200 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{customer.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{customer.email}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Orders</div>
                      <div className="mt-2 text-lg font-semibold text-slate-900">{customer.orders}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Spent</div>
                      <div className="mt-2 text-lg font-semibold text-slate-900">${customer.totalSpent.toFixed(2)}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Last Order</div>
                      <div className="mt-2 text-sm font-semibold text-slate-900">{new Date(customer.lastOrderAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
