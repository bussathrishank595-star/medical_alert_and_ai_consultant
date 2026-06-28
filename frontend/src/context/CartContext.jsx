import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CART_STORAGE_KEY = "medialert_cart";
const CartContext = createContext(null);

const loadCart = () => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (medicine, quantity = 1) => {
    const normalizedQuantity = Math.max(Number(quantity) || 1, 1);

    setItems((current) => {
      const existing = current.find((item) => item.medicineId === medicine._id);
      const stockLimit = Math.max(Number(medicine.stock) || 1, 1);

      if (existing) {
        return current.map((item) =>
          item.medicineId === medicine._id
            ? {
                ...item,
                quantity: Math.min(item.quantity + normalizedQuantity, stockLimit)
              }
            : item
        );
      }

      return [
        ...current,
        {
          medicineId: medicine._id,
          name: medicine.name,
          category: medicine.category,
          image: medicine.image,
          price: Number(medicine.price) || 0,
          quantity: Math.min(normalizedQuantity, stockLimit),
          stock: stockLimit
        }
      ];
    });
  };

  const updateQuantity = (medicineId, quantity) => {
    const normalizedQuantity = Number(quantity) || 0;

    setItems((current) =>
      current
        .map((item) => {
          if (item.medicineId !== medicineId) {
            return item;
          }

          return {
            ...item,
            quantity: Math.min(Math.max(normalizedQuantity, 0), item.stock || normalizedQuantity)
          };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (medicineId) => {
    setItems((current) => current.filter((item) => item.medicineId !== medicineId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const value = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      items,
      count,
      subtotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
