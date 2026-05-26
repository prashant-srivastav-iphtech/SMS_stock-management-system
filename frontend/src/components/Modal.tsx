/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useModal } from "../providers/ModalContext";
import secureApi from "../api/secureApi";

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  reservedStock: number;
  soldStock: number;
  returnedStock: number;
  damagedStock: number;
  status: "draft" | "active" | "inactive" | "out_of_stock";
}

const Modal = () => {
  const { isOpen, closeModal, productId } = useModal();

  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response: any = await secureApi.get(`/api/products/${productId}`);
        setProduct(response.product);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="text-2xl font-bold">Product Details</h2>

            {product && (
              <p className="text-sm text-gray-500">SKU: {product.sku}</p>
            )}
          </div>

          <button
            onClick={closeModal}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <p className="text-gray-500">Loading product...</p>
            </div>
          )}

          {!loading && product && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">{product.name}</h1>

                <p className="mt-2 text-gray-600">
                  {product.description || "No description available"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Card label="Price" value={`₹${product.price}`} />

                <Card label="Stock" value={product.stock} />

                <Card label="Sold" value={product.soldStock} />

                <Card label="Status" value={product.status} />
              </div>

              <div>
                <h3 className="mb-4 text-lg font-semibold">
                  Inventory Details
                </h3>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <Card label="Reserved" value={product.reservedStock} />

                  <Card label="Returned" value={product.returnedStock} />

                  <Card label="Damaged" value={product.damagedStock} />

                  <Card
                    label="Available"
                    value={product.stock - product.reservedStock}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;

interface CardProps {
  label: string;
  value: string | number;
}

const Card = ({ label, value }: CardProps) => {
  return (
    <div className="rounded-xl border bg-gray-50 p-4">
      <p className="text-sm text-gray-500">{label}</p>

      <h3 className="mt-1 text-xl font-bold">{value}</h3>
    </div>
  );
};
