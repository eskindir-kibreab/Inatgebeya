import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [userCarts, setUserCarts] = useState(() => {
    const savedCarts = localStorage.getItem("userCarts");
    const parsed = savedCarts ? JSON.parse(savedCarts) : {};

    // Auto-cleanup: Filter out items with missing IDs (legacy bug)
    Object.keys(parsed).forEach(uid => {
      if (Array.isArray(parsed[uid])) {
        parsed[uid] = parsed[uid].filter(item => item && (item.id || item.product_id));
      }
    });

    return parsed;
  });

  // Get current user's cart
  const cartItems = user ? (userCarts[user.id] || []) : [];

  // Save carts to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("userCarts", JSON.stringify(userCarts));
  }, [userCarts]);

  // Handle guest cart migration after login
  useEffect(() => {
    const guestCart = localStorage.getItem("guestCart");
    if (isAuthenticated && guestCart) {
      const guestItems = JSON.parse(guestCart);
      if (guestItems.length > 0) {
        setUserCarts(prev => ({
          ...prev,
          [user.id]: [...(prev[user.id] || []), ...guestItems]
        }));
        localStorage.removeItem("guestCart");
        toast.success("Your cart items have been saved!");
      }
    }
  }, [isAuthenticated, user?.id]);

  const addToCart = (product, quantity = 1, size = null, sizeId = null, maxStock = null) => {
    if (!isAuthenticated) {
      // Save intended action and redirect to login
      localStorage.setItem("redirectAfterLogin", window.location.pathname);
      navigate("/login");
      toast.error("Please login to add items to cart");
      return false;
    }

    // Determine max available stock
    const availableStock = maxStock !== null ? maxStock : (product.stock || 0);

    if (availableStock <= 0) {
      toast.error("This item is currently out of stock");
      return false;
    }

    setUserCarts(prev => {
      const userCart = [...(prev[user.id] || [])];
      const existingItemIndex = userCart.findIndex(
        item => item.id === (product.product_id || product.id) && item.size === size
      );

      if (existingItemIndex > -1) {
        // Update quantity if item already exists
        const currentQty = userCart[existingItemIndex].quantity;
        const newQuantity = currentQty + quantity;

        if (newQuantity > availableStock) {
          userCart[existingItemIndex].quantity = availableStock;
          toast.error(`Only ${availableStock} items available in stock. Capped your cart at maximum.`);
        } else if (newQuantity > 10) {
          userCart[existingItemIndex].quantity = 10;
          toast.error(`Maximum limit of 10 reached for ${product.product_name}`);
        } else {
          userCart[existingItemIndex].quantity = newQuantity;
          toast.success(`Updated ${product.product_name} quantity`);
        }
      } else {
        // Add new item to cart
        // Validate quantity against stock
        let initialQuantity = quantity;
        if (initialQuantity > availableStock) {
          initialQuantity = availableStock;
          toast.error(`Only ${availableStock} items available. Added maximum to cart.`);
        } else if (initialQuantity > 10) {
          initialQuantity = 10;
          toast.error(`Capped at maximum of 10 items`);
        } else {
          toast.success(`Added ${product.product_name} to cart`);
        }

        const newItem = {
          id: product.product_id || product.id,
          name: product.product_name,
          price: product.price,
          image: product.main_image,
          quantity: initialQuantity,
          size,
          size_id: sizeId,
          shop_id: product.shop_id,
          maxStock: availableStock // Store for cart page validation
        };

        userCart.push(newItem);
      }

      return {
        ...prev,
        [user.id]: userCart
      };
    });
    return true;
  };

  const removeFromCart = (itemId, size = null) => {
    if (!isAuthenticated) return;

    setUserCarts(prev => {
      const updatedCart = (prev[user.id] || []).filter(
        item => !(item.id === itemId && item.size === size)
      );
      return {
        ...prev,
        [user.id]: updatedCart
      };
    });
    toast.success("Item removed from cart");
  };

  const updateQuantity = (itemId, quantity, size = null) => {
    if (!isAuthenticated) return;

    const currentCart = userCarts[user.id] || [];
    const item = currentCart.find(i => i.id === itemId && i.size === size);

    if (!item) return;

    if (quantity < 1) {
      removeFromCart(itemId, size);
      return;
    }

    // Validate against stock
    if (quantity > item.maxStock) {
      toast.error(`Only ${item.maxStock} items available in stock`);
      return;
    }

    if (quantity > 10) {
      toast.error("Maximum limit of 10 items reached");
      return;
    }

    setUserCarts(prev => ({
      ...prev,
      [user.id]: (prev[user.id] || []).map(item =>
        item.id === itemId && item.size === size ? { ...item, quantity } : item
      )
    }));
  };

  const clearCart = () => {
    if (!isAuthenticated) return;

    setUserCarts(prev => ({
      ...prev,
      [user.id]: []
    }));
    toast.success("Cart cleared");
  };

  const getCartCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const getItemsByShop = () => {
    const itemsByShop = {};
    cartItems.forEach((item) => {
      if (!itemsByShop[item.shop_id]) {
        itemsByShop[item.shop_id] = [];
      }
      itemsByShop[item.shop_id].push(item);
    });
    return itemsByShop;
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartCount,
    getCartTotal,
    getItemsByShop,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
