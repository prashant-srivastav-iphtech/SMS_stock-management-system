// context/ModalContext.tsx
import { useState, type ReactNode } from "react";
import { ModalContext } from "./ModalContext";

export interface ModalContextType {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  productId?: string;
  handleProductId: (id: string) => void;
}

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [productId, setProductId] = useState("");

  const openModal = () => setProductId("");
  const closeModal = () => setProductId("");
  const handleProductId = (id: string) => {
    setProductId(id);
  };

  const open = productId ? true : false;

  return (
    <ModalContext.Provider
      value={{
        isOpen: open,
        openModal,
        closeModal,
        productId,
        handleProductId,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};
