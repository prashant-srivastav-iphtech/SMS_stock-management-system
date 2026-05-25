import { useEffect, useState } from "react";
import axios from "axios";
import secureApi from "../api/secureApi";

type Product = {
  id: string;
  sku: string;
  name: string;
  stock: number;
  reservedStock: number;
  soldStock: number;
  returnedStock: number;
  damagedStock: number;
  status: string;
};

export const Inventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await secureApi.get<{ products: Product[] }>("/api/products");
        setProducts(response.products);
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? (error.response?.data as { message?: string } | undefined)?.message || "Unable to load inventory"
          : "Unable to load inventory";
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
        <h1 className="text-2xl font-semibold text-slate-900">Inventory</h1>
        <p className="mt-3 text-slate-500">Track stock health, reserved units, sold volume, and inventory issues.</p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading inventory...</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {products.map((product) => {
              const availableNow = Math.max(product.stock - product.reservedStock, 0);
              const totalTracked = product.stock + product.soldStock + product.damagedStock;

              return (
                <article key={product.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{product.sku}</div>
                      <h2 className="mt-2 text-lg font-semibold text-slate-900">{product.name}</h2>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm capitalize text-slate-700">{product.status}</span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-2xl bg-slate-950 p-4 text-white sm:col-span-2 lg:col-span-1">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-300">Total Tracked</div>
                      <div className="mt-2 text-2xl font-semibold">{totalTracked}</div>
                      <p className="mt-2 text-xs text-slate-300">Current stock plus sold and damaged units.</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-emerald-700">Available</div>
                      <div className="mt-2 text-lg font-semibold text-emerald-900">{availableNow}</div>
                      <p className="mt-2 text-xs text-emerald-700">Ready to sell right now.</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">On Hand</div>
                      <div className="mt-2 text-lg font-semibold text-slate-900">{product.stock}</div>
                      <p className="mt-2 text-xs text-slate-500">Physical stock currently recorded.</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Reserved</div>
                      <div className="mt-2 text-lg font-semibold text-slate-900">{product.reservedStock}</div>
                      <p className="mt-2 text-xs text-slate-500">Held for unpaid or processing orders.</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Sold</div>
                      <div className="mt-2 text-lg font-semibold text-slate-900">{product.soldStock}</div>
                      <p className="mt-2 text-xs text-slate-500">Completed sales after payment success.</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Returned</div>
                      <div className="mt-2 text-lg font-semibold text-slate-900">{product.returnedStock}</div>
                      <p className="mt-2 text-xs text-slate-500">Customer returns tracked for review or restock.</p>
                    </div>
                    <div className="rounded-2xl bg-rose-50 p-4 sm:col-span-2 lg:col-span-1">
                      <div className="text-xs uppercase tracking-[0.18em] text-rose-700">Damaged</div>
                      <div className="mt-2 text-lg font-semibold text-rose-900">{product.damagedStock}</div>
                      <p className="mt-2 text-xs text-rose-700">
                        Increase this when items break, expire, fail QA, or become unsellable.
                      </p>
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
