import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import secureApi from "../api/secureApi";
import { useAuth } from "../hooks/useAuth";

type Order = {
  id: string;
  customerId: string;
  total: string | number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  store?: { id: string; name: string; slug: string };
  customer?: { id: string; email: string; firstName: string; lastName?: string; role: string };
  items?: Array<{
    id: string;
    quantity: number;
    price: string | number;
    product?: { id: string; name: string; sku: string };
  }>;
};

const orderStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const paymentStatuses = ["pending", "paid", "failed", "refunded"];

export const Orders = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [draftStatuses, setDraftStatuses] = useState<Record<string, { status: string; paymentStatus: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    const response = await secureApi.get<{ orders: Order[] }>(isAdmin ? "/api/orders/admin" : "/api/orders");
    setOrders(response.orders);
    setDraftStatuses(
      Object.fromEntries(
        response.orders.map((order) => [
          order.id,
          { status: order.status, paymentStatus: order.paymentStatus },
        ]),
      ),
    );
  },[isAdmin]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        await loadOrders();
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? (error.response?.data as { message?: string } | undefined)
              ?.message || "Unable to load orders"
          : "Unable to load orders";
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isAdmin, loadOrders]);

  const handleStatusChange = async (orderId: string, status: string, paymentStatus: string) => {
    setUpdatingOrderId(orderId);
    setErrorMessage(null);

    try {
      await secureApi.patch(`/api/orders/${orderId}/status`, { status, paymentStatus });
      await loadOrders();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string } | undefined)?.message || "Unable to update order"
        : "Unable to update order";
      setErrorMessage(message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const paymentState = new URLSearchParams(location.search).get("payment");

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">{isAdmin ? "Order Operations" : "My Orders"}</h1>
        <p className="mt-3 text-slate-500">
          {isAdmin ? "Update the lifecycle of each incoming order." : "Track payment and fulfillment status for your purchases."}
        </p>
      </section>

      {!isAdmin && paymentState === "success" && (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 shadow-sm">
          Stripe payment completed. Your order is now being processed and inventory has been updated.
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">{isAdmin ? "All Orders" : "Order History"}</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{orders.length} orders</span>
        </div>

        {errorMessage && <p className="mt-4 text-sm text-red-600">{errorMessage}</p>}

        {isLoading ? (
          <p className="mt-6 text-sm text-slate-500">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">No orders found yet.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => {
              const draft = draftStatuses[order.id] || { status: order.status, paymentStatus: order.paymentStatus };

              return (
              <article key={order.id} className="rounded-3xl border border-slate-200 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Order ID</div>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">{order.id}</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {new Date(order.createdAt).toLocaleString()} • {order.store?.name || "Unknown store"}
                    </p>
                    {isAdmin && order.customer && (
                      <p className="mt-2 text-sm text-slate-600">
                        Customer: {order.customer.firstName} {order.customer.lastName} ({order.customer.email})
                      </p>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Total</div>
                      <div className="mt-2 text-lg font-semibold text-slate-900">${Number(order.total).toFixed(2)}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Status</div>
                      <div className="mt-2 text-lg font-semibold capitalize text-slate-900">{order.status}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Payment</div>
                      <div className="mt-2 text-lg font-semibold capitalize text-slate-900">{order.paymentStatus}</div>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="mt-5 grid gap-4 rounded-3xl bg-slate-50 p-4 md:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Order Status</span>
                      <select
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                        value={draft.status}
                        disabled={updatingOrderId === order.id}
                        onChange={(event) => {
                          const status = event.target.value;
                          setDraftStatuses((current) => ({
                            ...current,
                            [order.id]: {
                              status,
                              paymentStatus: draft.paymentStatus,
                            },
                          }));
                          handleStatusChange(order.id, status, draft.paymentStatus);
                        }}
                      >
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Payment Status</span>
                      <select
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                        value={draft.paymentStatus}
                        disabled={updatingOrderId === order.id}
                        onChange={(event) => {
                          const paymentStatus = event.target.value;
                          setDraftStatuses((current) => ({
                            ...current,
                            [order.id]: {
                              status: draft.status,
                              paymentStatus,
                            },
                          }));
                          handleStatusChange(order.id, draft.status, paymentStatus);
                        }}
                      >
                        {paymentStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}

                <div className="mt-5">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Items</h4>
                  <div className="mt-3 space-y-3">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                        <div>
                          <div className="font-medium text-slate-900">{item.product?.name || "Unknown product"}</div>
                          <div className="text-sm text-slate-500">
                            SKU: {item.product?.sku || "N/A"} • Quantity: {item.quantity}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-slate-900">${Number(item.price).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
