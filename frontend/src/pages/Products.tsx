import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import secureApi from "../api/secureApi";
import { useAuth } from "../hooks/useAuth";

type Product = {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  price: string | number;
  stock: number;
  reservedStock: number;
  soldStock: number;
  damagedStock: number;
  status: string;
  store?: { id: string; name: string; slug: string };
  category?: { id: string; name: string } | null;
};

type Store = {
  id: string;
  name: string;
  slug: string;
};

type CheckoutItem = {
  productId: string;
  quantity: number;
};

const emptyForm = {
  storeId: "",
  name: "",
  description: "",
  price: "",
  stock: "",
};

const readErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const responsePayload = error.response?.data as
    | { message?: string }
    | undefined;
  return responsePayload?.message || fallback;
};

export const Products = () => {
  const { isAdmin, isCustomer } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const loadProducts = async (pageNum: number = 1) => {
    const data = await secureApi.get<{
      products: Product[];
      total: number;
      totalPages: number;
      page: number;
    }>(`/api/products?page=${pageNum}&limit=10`);
    setProducts(data.products);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setPage(data.page);
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        await loadProducts(page);

        if (isAdmin) {
          const storeResponse = await secureApi.get<{ stores: Store[] }>(
            "/api/stores",
          );
          setStores(storeResponse.stores);
          setForm((current) => ({
            ...current,
            storeId: current.storeId || storeResponse.stores[0]?.id || "",
          }));
        }
      } catch (error) {
        setErrorMessage(readErrorMessage(error, "Unable to load products"));
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isAdmin, page]);

  const handleCreateProduct = async (
    event: React.SubmitEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await secureApi.post("/api/products", {
        storeId: form.storeId,
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        stock: Number(form.stock),
      });

      setForm({
        ...emptyForm,
        storeId: stores[0]?.id || "",
      });
      setSuccessMessage("Product created successfully.");
      setPage(1);
      await loadProducts(1);
    } catch (error) {
      setErrorMessage(readErrorMessage(error, "Unable to create product"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuantityChange = (productId: string, nextQuantity: number) => {
    setCart((current) => {
      if (nextQuantity <= 0) {
        const next = { ...current };
        delete next[productId];
        return next;
      }

      return {
        ...current,
        [productId]: nextQuantity,
      };
    });
  };

  const cartItems = useMemo(() => {
    const items: Array<Product & { quantity: number }> = [];

    for (const product of products) {
      const quantity = cart[product.id];
      if (quantity && quantity > 0) {
        items.push({ ...product, quantity });
      }
    }

    return items;
  }, [cart, products]);

  const cartSubtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0,
      ),
    [cartItems],
  );

  const handleCheckout = async () => {
    const items: CheckoutItem[] = cartItems.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
    }));

    if (items.length === 0) {
      setErrorMessage("Add at least one product before checkout.");
      return;
    }

    setIsCheckingOut(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const origin = window.location.origin;
      const response = await secureApi.post<{ checkoutUrl: string }>(
        "/api/orders/checkout",
        {
          items,
          successUrl: `${origin}/orders?payment=success`,
          cancelUrl: `${origin}/products?payment=cancelled`,
        },
      );

      window.location.assign(response.checkoutUrl);
    } catch (error) {
      setErrorMessage(
        readErrorMessage(error, "Unable to start Stripe checkout"),
      );
      setIsCheckingOut(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentState = params.get("payment");

    function fun() {
      setErrorMessage(
        "Stripe checkout was cancelled. Your cart is still available.",
      );
    }

    if (paymentState === "cancelled") {
      fun();
    }
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          {isAdmin ? "Product Management" : "Product Catalog"}
        </h1>
        <p className="mt-3 text-slate-500">
          {isAdmin
            ? "Create products and review live catalog inventory."
            : "Choose products, create your order, and continue to Stripe for payment."}
        </p>
      </section>

      {(errorMessage || successMessage) && (
        <section
          className={`rounded-3xl border p-4 text-sm shadow-sm ${
            errorMessage
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {errorMessage || successMessage}
        </section>
      )}

      {isAdmin && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Create Product
          </h2>
          {stores.length === 0 && !isLoading ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
              Create a store first before adding products.
              <Link
                className="ml-2 font-semibold text-amber-900 underline"
                to="/stores"
              >
                Go to Stores
              </Link>
            </div>
          ) : (
            <form
              className="mt-6 grid gap-4 md:grid-cols-2"
              onSubmit={handleCreateProduct}
            >
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Store
                </span>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                  value={form.storeId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      storeId: event.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select a store</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Product Name
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Price
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                  value={form.price}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      price: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Stock
                </span>
                <input
                  type="number"
                  min="0"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                  value={form.stock}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      stock: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Description
                </span>
                <textarea
                  className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Product"}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      <div
        className={`grid gap-6 ${isCustomer ? "xl:grid-cols-[1.7fr_1fr]" : ""}`}
      >
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {isAdmin ? "Catalog Inventory" : "Available Products"}
            </h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
              {total} total products
            </span>
          </div>

          {isLoading ? (
            <p className="mt-6 text-sm text-slate-500">Loading products...</p>
          ) : (
            <>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {products.map((product) => {
                  // const availableQuantity = Math.max(product.stock - product.reservedStock, 0);
                  const selectedQuantity = cart[product.id] || 0;

                  const availableNow = Math.max(
                    product.stock - product.reservedStock,
                    0,
                  );
                  const totalTracked =
                    product.stock + product.soldStock + product.damagedStock;

                  return (
                    <article
                      key={product.id}
                      className="rounded-3xl border border-slate-200 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            {product.sku}
                          </div>
                          <h3 className="mt-2 text-lg font-semibold text-slate-900">
                            {product.name}
                          </h3>
                          <p className="mt-2 text-sm text-slate-500">
                            {product.description || "No description provided."}
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                          {product.status}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            Price
                          </div>
                          <div className="mt-2 text-lg font-semibold text-slate-900">
                            ${Number(product.price).toFixed(2)}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            Store
                          </div>
                          <div className="mt-2 text-lg font-semibold text-slate-900">
                            {product.store?.name || "Unknown store"}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            Total Tracked
                          </div>
                          <div className="mt-2 text-lg font-semibold text-slate-900">
                            {totalTracked}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            Stock
                          </div>
                          <div className="mt-2 text-lg font-semibold text-slate-900">
                            {product.stock}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            Available
                          </div>
                          <div className="mt-2 text-lg font-semibold text-slate-900">
                            {availableNow}
                          </div>
                        </div>
                      </div>

                      {isCustomer && (
                        <div className="mt-5 rounded-3xl bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">
                                Add to order
                              </div>
                              <div className="text-sm text-slate-500">
                                Choose quantity before Stripe checkout.
                              </div>
                            </div>
                            <input
                              type="number"
                              min="0"
                              max={availableNow}
                              value={selectedQuantity}
                              onChange={(event) =>
                                handleQuantityChange(
                                  product.id,
                                  Number(event.target.value),
                                )
                              }
                              className="w-24 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                              disabled={availableNow === 0}
                            />
                          </div>
                          {availableNow === 0 && (
                            <p className="mt-3 text-sm text-amber-700">
                              This product is currently out of available stock.
                            </p>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              <>
                {" "}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between gap-4">
                    <div className="text-sm text-slate-600">
                      Page {page} of {totalPages} ({total} total products)
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            </>
          )}
        </section>

        {isCustomer && (
          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Order Summary
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Your order will be created first, then paid securely through
              Stripe.
            </p>

            {cartItems.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">
                Choose products and quantities to start your order.
              </p>
            ) : (
              <div className="mt-6 space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {item.name}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {item.quantity} x ${Number(item.price).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        ${(Number(item.price) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Items</span>
                    <span>{cartItems.length}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-lg font-semibold text-slate-900">
                    <span>Total</span>
                    <span>${cartSubtotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {isCheckingOut
                    ? "Redirecting to Stripe..."
                    : "Checkout with Stripe"}
                </button>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
};
