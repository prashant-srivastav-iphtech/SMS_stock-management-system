import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import secureApi from "../api/secureApi";

type Store = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

const emptyStoreForm = {
  organizationId: "",
  name: "",
  slug: "",
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

const Stores = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [storeForm, setStoreForm] = useState(emptyStoreForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingStore, setIsSubmittingStore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [storesResponse] = await Promise.all([
      secureApi.get<{ stores: Store[] }>("/api/stores"),
    ]);

    setStores(storesResponse.stores);
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        await loadData();
      } catch (error) {
        setErrorMessage(
          readErrorMessage(error, "Unable to load organizations and stores"),
        );
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [loadData]);

  const handleCreateStore = async (
    event: React.SubmitEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsSubmittingStore(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await secureApi.post("/api/stores", storeForm);
      setStoreForm({
        ...emptyStoreForm,
      });
      setSuccessMessage(
        "Store created successfully. You can now add products under this store.",
      );
      await loadData();
    } catch (error) {
      setErrorMessage(readErrorMessage(error, "Unable to create store"));
    } finally {
      setIsSubmittingStore(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Stores</h1>
        <p className="mt-3 text-slate-500">
          Create stores first, then use the products page to add catalog items
          into each store.
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

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Create Store</h2>
          <p className="mt-2 text-sm text-slate-500">
            After the store is created, products can be linked to it.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleCreateStore}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Store Name
              </span>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                value={storeForm.name}
                onChange={(event) =>
                  setStoreForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Store Slug
              </span>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                value={storeForm.slug}
                onChange={(event) =>
                  setStoreForm((current) => ({
                    ...current,
                    slug: event.target.value,
                  }))
                }
                required
              />
            </label>

            <button
              type="submit"
              disabled={isSubmittingStore}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {isSubmittingStore ? "Creating..." : "Create Store"}
            </button>
          </form>
        </div>
        
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">Stores</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
              {stores.length}
            </span>
          </div>

          {isLoading ? (
            <p className="mt-6 text-sm text-slate-500">Loading stores...</p>
          ) : stores.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              No stores yet. Create one to start adding products.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {stores.map((store) => (
                <article
                  key={store.id}
                  className="rounded-3xl border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {store.name}
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        {store.slug}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        store.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {store.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Stores;
