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
    return savedCarts ? JSON.parse(savedCarts) : {};
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

  const addToCart = (product, quantity = 1, size = null) => {
    if (!isAuthenticated) {
      // Save intended action and redirect to login
      localStorage.setItem("redirectAfterLogin", window.location.pathname);
      navigate("/login");
      toast.error("Please login to add items to cart");
      return false;
    }

    setUserCarts(prev => {
      const userCart = [...(prev[user.id] || [])];
      const existingItemIndex = userCart.findIndex(
        item => item.id === product.id && item.size === size
      );

      if (existingItemIndex > -1) {
        // Update quantity if item already exists
        userCart[existingItemIndex].quantity += quantity;
        toast.success(`Updated ${product.product_name} quantity`);
      } else {
        // Add new item to cart
        const newItem = {
          id: product.id,
          name: product.product_name,
          price: product.price,
          image: product.main_image,
          quantity,
          size,
          shop_id: product.shop_id,
        };
        userCart.push(newItem);
        toast.success(`Added ${product.product_name} to cart`);
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
    
    if (quantity < 1) {
      removeFromCart(itemId, size);
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
