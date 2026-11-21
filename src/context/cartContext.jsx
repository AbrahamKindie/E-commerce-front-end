
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuth } from "./AuthContext";
import cartService from "../services/cartService";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestId = useRef(0);

  // USER, ADMIN, and SUPER_ADMIN can shop.
  const canShop = ["USER", "ADMIN", "SUPER_ADMIN"].includes(
    user?.role
  );

  // ==========================================
  // REFRESH CART
  // ==========================================

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated || !canShop) {
      requestId.current += 1;
      setCart(null);
      setLoading(false);
      setError("");
      return null;
    }

    const currentRequest = ++requestId.current;

    try {
      setLoading(true);
      setError("");

      const data = await cartService.getCart();

      if (currentRequest === requestId.current) {
        setCart(data);
      }

      return data;
    } catch (err) {
      if (currentRequest === requestId.current) {
        setError(
          err.response?.data?.message ||
            "Unable to load your cart."
        );
      }

      return null;
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }, [isAuthenticated, canShop]);

  // ==========================================
  // LOAD CART AFTER LOGIN / CLEAR ON LOGOUT
  // ==========================================

  useEffect(() => {
    if (isAuthenticated && canShop) {
      refreshCart();
    } else {
      requestId.current += 1;
      setCart(null);
      setError("");
      setLoading(false);
    }
  }, [isAuthenticated, canShop, refreshCart]);

  // ==========================================
  // ADD TO CART
  // ==========================================

  const addToCart = async (productId, quantity = 1) => {
    try {
      setError("");

      const updatedCart = await cartService.addToCart(
        productId,
        quantity
      );

      setCart(updatedCart);

      return updatedCart;
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to add product to cart."
      );

      throw err;
    }
  };

  // ==========================================
  // UPDATE CART ITEM
  // ==========================================

  const updateCartItem = async (itemId, quantity) => {
    try {
      setError("");

      const updatedCart = await cartService.updateCartItem(
        itemId,
        quantity
      );

      setCart(updatedCart);

      return updatedCart;
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update cart item."
      );

      throw err;
    }
  };

  // ==========================================
  // REMOVE CART ITEM
  // ==========================================

  const removeCartItem = async (itemId) => {
    try {
      setError("");

      const updatedCart = await cartService.removeCartItem(itemId);

      setCart(updatedCart);

      return updatedCart;
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to remove cart item."
      );

      throw err;
    }
  };

  // ==========================================
  // CLEAR CART
  // ==========================================

  const clearCart = async () => {
    try {
      setError("");

      const updatedCart = await cartService.clearCart();

      setCart(updatedCart);

      return updatedCart;
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to clear cart."
      );

      throw err;
    }
  };

  // ==========================================
  // CART ITEM COUNT
  // ==========================================

  const cartItemCount =
    cart?.totalItems ??
    cart?.items?.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    ) ??
    0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        canShop,
        cartItemCount,
        refreshCart,
        addToCart,
        updateCartItem,
        removeCartItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// ==========================================
// USE CART
// ==========================================

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
};
