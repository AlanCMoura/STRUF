"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartLine = {
  variantId: number;
  productId: number;
  productName: string;
  sku: string;
  color: string;
  size: string;
  unitPrice: number;
  quantity: number;
};

type AddCartLineInput = Omit<CartLine, "quantity"> & {
  quantity?: number;
};

type CartContextValue = {
  items: CartLine[];
  isHydrated: boolean;
  itemCount: number;
  subtotal: number;
  addItem: (item: AddCartLineInput) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  removeItem: (variantId: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_STORAGE_KEY = "struf_store_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        if (Array.isArray(parsed)) {
          setItems(
            parsed.filter(
              (item) =>
                item &&
                typeof item.variantId === "number" &&
                typeof item.quantity === "number"
            )
          );
        }
      }
    } catch {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, isHydrated]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    return {
      items,
      isHydrated,
      itemCount,
      subtotal,
      addItem(input) {
        const nextQty = Math.max(1, input.quantity ?? 1);
        setItems((prev) => {
          const index = prev.findIndex((item) => item.variantId === input.variantId);
          if (index === -1) {
            return [...prev, { ...input, quantity: nextQty }];
          }
          const next = [...prev];
          next[index] = {
            ...next[index],
            quantity: next[index].quantity + nextQty,
          };
          return next;
        });
      },
      updateQuantity(variantId, quantity) {
        setItems((prev) => {
          if (quantity <= 0) {
            return prev.filter((item) => item.variantId !== variantId);
          }
          return prev.map((item) =>
            item.variantId === variantId ? { ...item, quantity } : item
          );
        });
      },
      removeItem(variantId) {
        setItems((prev) => prev.filter((item) => item.variantId !== variantId));
      },
      clearCart() {
        setItems([]);
      },
    };
  }, [items, isHydrated]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
