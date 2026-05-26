import { useCallback, useEffect, useMemo, useState, type JSX } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import {
  Package,
  Clock3,
  CheckCircle2,
  Truck,
  XCircle,
  CreditCard,
  ShoppingBag,
  Search,
  RefreshCcw,
  CalendarDays,
  Store,
  User,
  BadgeDollarSign,
} from "lucide-react";

import secureApi from "../api/secureApi";
import { useAuth } from "../hooks/useAuth";

type Order = {
  id: string;
  customerId: string;
  total: string | number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  store?: {
    id: string;
    name: string;
    slug: string;
  };
  customer?: {
    id: string;
    email: string;
    firstName: string;
    lastName?: string;
    role: string;
  };
  items?: Array<{
    id: string;
    quantity: number;
    price: string | number;
    product?: {
      id: string;
      name: string;
      sku: string;
    };
  }>;
};

const orderStatuses = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const paymentStatuses = ["pending", "paid", "failed", "refunded"];

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border border-blue-200",
  processing: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  shipped: "bg-purple-50 text-purple-700 border border-purple-200",
  delivered: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border border-red-200",

  paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  failed: "bg-red-50 text-red-700 border border-red-200",
  refunded: "bg-slate-100 text-slate-700 border border-slate-200",
};

const statusIcons: Record<string, JSX.Element> = {
  pending: <Clock3 size={14} />,
  confirmed: <CheckCircle2 size={14} />,
  processing: <RefreshCcw size={14} />,
  shipped: <Truck size={14} />,
  delivered: <Package size={14} />,
  cancelled: <XCircle size={14} />,
};

export const Orders = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");

  const [draftStatuses, setDraftStatuses] = useState<
    Record<
      string,
      {
        status: string;
        paymentStatus: string;
      }
    >
  >({});

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    const response = await secureApi.get<{
      orders: Order[];
    }>(isAdmin ? "/api/orders/admin" : "/api/orders");

    setOrders(response.orders);

    setDraftStatuses(
      Object.fromEntries(
        response.orders.map((order) => [
          order.id,
          {
            status: order.status,
            paymentStatus: order.paymentStatus,
          },
        ]),
      ),
    );
  }, [isAdmin]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        await loadOrders();
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? (
              error.response?.data as {
                message?: string;
              }
            )?.message || "Unable to load orders"
          : "Unable to load orders";

        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [loadOrders]);

  const handleStatusChange = async (
    orderId: string,
    status: string,
    paymentStatus: string,
  ) => {
    setUpdatingOrderId(orderId);

    try {
      await secureApi.patch(`/api/orders/${orderId}/status`, {
        status,
        paymentStatus,
      });

      await loadOrders();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (
            error.response?.data as {
              message?: string;
            }
          )?.message || "Unable to update order"
        : "Unable to update order";

      setErrorMessage(message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const query = search.toLowerCase();

      return (
        order.id.toLowerCase().includes(query) ||
        order.customer?.email?.toLowerCase().includes(query) ||
        order.store?.name?.toLowerCase().includes(query)
      );
    });
  }, [orders, search]);

  const totalRevenue = useMemo(() => {
    return orders.reduce((acc, order) => acc + Number(order.total || 0), 0);
  }, [orders]);

  const paymentState = new URLSearchParams(location.search).get("payment");

  return (
    <div className="space-y-6">
      {/* HERO */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-2xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm backdrop-blur">
              <ShoppingBag size={16} />
              {isAdmin ? "Order Operations Center" : "Customer Order History"}
            </div>

            <h1 className="text-4xl font-black tracking-tight">
              {isAdmin ? "Manage Every Order Seamlessly" : "Track Your Orders"}
            </h1>

            <p className="mt-4 text-slate-300">
              {isAdmin
                ? "Monitor order lifecycle, payment states, shipping progression, and customer activity in real-time."
                : "Review payments, shipments, and order progress across all purchases."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:min-w-[360px]">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <div className="text-sm text-slate-300">Total Orders</div>

              <div className="mt-2 text-3xl font-black">{orders.length}</div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <div className="text-sm text-slate-300">Revenue</div>

              <div className="mt-2 text-3xl font-black">
                $
                {totalRevenue.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {!isAdmin && paymentState === "success" && (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} />
            Stripe payment completed successfully. Your order is now processing.
          </div>
        </section>
      )}

      {/* SEARCH */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ID, customer email, or store..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-slate-400"
          />
        </div>
      </section>

      {/* ORDERS */}
      <section className="space-y-5">
        {errorMessage && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-600">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <RefreshCcw className="mx-auto mb-4 animate-spin" />
            <p className="text-slate-500">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <Package size={44} className="mx-auto text-slate-300" />

            <h3 className="mt-4 text-lg font-semibold">No Orders Found</h3>

            <p className="mt-2 text-sm text-slate-500">
              Orders will appear here once customers start purchasing.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const draft = draftStatuses[order.id] || {
              status: order.status,
              paymentStatus: order.paymentStatus,
            };

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm transition hover:shadow-xl"
              >
                {/* HEADER */}
                <div className="border-b border-slate-100 p-6">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-2xl font-bold text-slate-900">
                          #{order.id.slice(0, 8)}
                        </h3>

                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            statusStyles[order.status]
                          }`}
                        >
                          {statusIcons[order.status]}
                          {order.status}
                        </span>

                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            statusStyles[order.paymentStatus]
                          }`}
                        >
                          <CreditCard size={14} />
                          {order.paymentStatus}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <CalendarDays size={16} />
                          {new Date(order.createdAt).toLocaleString()}
                        </div>

                        <div className="flex items-center gap-2">
                          <Store size={16} />
                          {order.store?.name || "Unknown Store"}
                        </div>

                        {order.customer && (
                          <div className="flex items-center gap-2">
                            <User size={16} />
                            {order.customer.email}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-3xl bg-slate-950 px-6 py-5 text-white">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <BadgeDollarSign size={16} />
                        Order Total
                      </div>

                      <div className="mt-2 text-3xl font-black">
                        ${Number(order.total).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ITEMS */}
                <div className="p-6">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    <Package size={16} />
                    Order Items
                  </div>

                  <div className="space-y-3">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">
                            {item.product?.name}
                          </div>

                          <div className="mt-1 text-sm text-slate-500">
                            SKU: {item.product?.sku} • Qty: {item.quantity}
                          </div>
                        </div>

                        <div className="text-lg font-bold text-slate-900">
                          ${Number(item.price).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ADMIN ACTIONS */}
                  {isAdmin && (
                    <div className="mt-6 grid gap-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Order Status
                        </label>

                        <select
                          disabled={updatingOrderId === order.id}
                          value={draft.status}
                          onChange={(e) => {
                            const status = e.target.value;

                            setDraftStatuses((current) => ({
                              ...current,
                              [order.id]: {
                                status,
                                paymentStatus: draft.paymentStatus,
                              },
                            }));

                            handleStatusChange(
                              order.id,
                              status,
                              draft.paymentStatus,
                            );
                          }}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                        >
                          {orderStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Payment Status
                        </label>

                        <select
                          disabled={updatingOrderId === order.id}
                          value={draft.paymentStatus}
                          onChange={(e) => {
                            const paymentStatus = e.target.value;

                            setDraftStatuses((current) => ({
                              ...current,
                              [order.id]: {
                                status: draft.status,
                                paymentStatus,
                              },
                            }));

                            handleStatusChange(
                              order.id,
                              draft.status,
                              paymentStatus,
                            );
                          }}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                        >
                          {paymentStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};
