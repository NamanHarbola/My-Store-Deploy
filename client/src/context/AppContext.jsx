import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

// Set global axios defaults for your backend URL and credentials
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const currency = import.meta.env.VITE_CURRENCY || "₹";
  const navigate = useNavigate();

  // States
  const [user, setUser] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [showUserLogin, setShowUserLogin] = useState(false);
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [searchQuery, setSearchQuery] = useState({});

  // Fetch Seller Auth Status
  const fetchSeller = async () => {
    try {
      const { data } = await axios.get("/api/seller/is-auth");
      setIsSeller(data.success || false);
    } catch {
      setIsSeller(false);
    }
  };

  // Fetch User Auth Status and Data
  const fetchUser = async () => {
    try {
      const { data } = await axios.get("/api/user/is-auth");
      if (data.success) {
        setUser(data.user);
        setCartItems(data.user.cartItems || {});
      } else {
        setUser(null);
        setCartItems({});
      }
    } catch {
      setUser(null);
      setCartItems({});
    }
  };

  // Fetch All Products
  const fetchProducts = async () => {
    try {
      const { data } = await axios.get("/api/product/");
      if (data.success) {
        setProducts(data.products);
      } else {
        toast.error(data.message || "Failed to load products");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Login User
  const loginUser = async (email, password) => {
    try {
      const { data } = await axios.post("/api/user/login", { email, password });
      if (data.success) {
        setUser(data.user);
        setCartItems(data.user.cartItems || {});
        toast.success("Login successful");
        navigate("/");
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // Logout User
  const logoutUser = async () => {
    try {
      const { data } = await axios.post("/api/user/logout");
      if (data.success) {
        setUser(null);
        setCartItems({});
        toast.success("Logged out successfully");
        navigate("/login");
      } else {
        toast.error(data.message || "Logout failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // Add to Cart
  const addToCart = (itemId) => {
    const updatedCart = { ...cartItems };
    updatedCart[itemId] = (updatedCart[itemId] || 0) + 1;
    setCartItems(updatedCart);
    toast.success("Added to Cart");
  };

  // Update Cart Item Quantity
  const updateCartItem = (itemId, quantity) => {
    const updatedCart = { ...cartItems };
    if (quantity <= 0) {
      delete updatedCart[itemId];
    } else {
      updatedCart[itemId] = quantity;
    }
    setCartItems(updatedCart);
    toast.success("Cart Updated");
  };

  // Remove from Cart
  const removeFromCart = (itemId) => {
    const updatedCart = { ...cartItems };
    if (updatedCart[itemId]) {
      updatedCart[itemId] -= 1;
      if (updatedCart[itemId] <= 0) {
        delete updatedCart[itemId];
      }
      setCartItems(updatedCart);
      toast.success("Removed from Cart");
    }
  };

  // Get Cart Item Count
  const getCartCount = () => {
    return Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
  };

  // Get Cart Total Amount
  const getCartAmount = () => {
    let total = 0;
    for (const itemId in cartItems) {
      const qty = cartItems[itemId];
      const product = products.find((p) => p._id === itemId);
      if (product && typeof product.offerPrice === "number") {
        total += product.offerPrice * qty;
      }
    }
    return Math.round(total * 100) / 100;
  };

  // Sync Cart with backend when cartItems or user changes
  useEffect(() => {
    const syncCart = async () => {
      if (!user) return;
      try {
        const { data } = await axios.post("/api/cart/update", { cartItems });
        if (!data.success) toast.error(data.message || "Failed to update cart");
      } catch (error) {
        toast.error(error.message);
      }
    };
    syncCart();
  }, [cartItems, user]);

  // Initial fetches
  useEffect(() => {
    fetchUser();
    fetchSeller();
    fetchProducts();
  }, []);

  const value = {
    navigate,
    user,
    setUser,
    isSeller,
    setIsSeller,
    showUserLogin,
    setShowUserLogin,
    products,
    currency,
    addToCart,
    updateCartItem,
    removeFromCart,
    cartItems,
    searchQuery,
    setSearchQuery,
    getCartAmount,
    getCartCount,
    loginUser,
    logoutUser,
    axios,
    fetchProducts,
    setCartItems,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
