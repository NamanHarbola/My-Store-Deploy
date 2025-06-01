import { useEffect, useState, useMemo } from "react";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import toast from "react-hot-toast";
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://my-store-deploy.onrender.com",
  withCredentials: true,
});

const Cart = () => {
  const {
    products,
    currency,
    cartItems,
    removeFromCart,
    getCartCount,
    updateCartItem,
    navigate,
    getCartAmount,
    user,
    setCartItems,
  } = useAppContext();

  const [cartArray, setCartArray] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [showAddress, setShowAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentOption, setPaymentOption] = useState("COD");
  const [orderAmounts, setOrderAmounts] = useState({
    subtotal: 0,
    tax: 0,
    totalAmount: 0,
  });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Build cart array from cartItems and products
  useEffect(() => {
    if (!products.length || !cartItems) {
      setCartArray([]);
      return;
    }
    const tempArray = [];
    for (const key in cartItems) {
      const product = products.find((item) => item._id === key);
      if (product) {
        tempArray.push({ ...product, quantity: cartItems[key] });
      }
    }
    setCartArray(tempArray);
  }, [products, cartItems]);

  // Fetch user addresses
  const getUserAddress = async () => {
    try {
      const { data } = await axiosInstance.get("/api/address/get");
      if (data.success) {
        setAddresses(data.addresses);
        if (data.addresses.length > 0) {
          setSelectedAddress(data.addresses[0]);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (user) getUserAddress();
  }, [user]);

  // Calculate amounts whenever cart or payment option changes
  useEffect(() => {
    const subtotal = cartArray.reduce(
      (acc, item) => acc + item.offerPrice * item.quantity,
      0
    );
    const tax = paymentOption === "RAZORPAY" ? +(subtotal * 0.0211).toFixed(2) : 0;
    const totalAmount = +(subtotal + tax).toFixed(2);
    setOrderAmounts({ subtotal, tax, totalAmount });
  }, [cartArray, paymentOption]);

  const placeOrder = async () => {
    if (isPlacingOrder) return; // Prevent duplicate clicks
    if (!selectedAddress) return toast.error("Please select an address");

    if (cartArray.length === 0) return toast.error("Cart is empty");

    const items = cartArray.map((item) => ({
      product: item._id,
      quantity: item.quantity,
    }));

    // Prepare payload with full address object (adjust if backend expects differently)
    const orderPayload = {
      userId: user._id,
      items,
      address: selectedAddress, 
      amount: orderAmounts.totalAmount, // Optional, backend should verify again
      paymentType: paymentOption,
    };

    setIsPlacingOrder(true);

    try {
      if (paymentOption === "COD") {
        const { data } = await axiosInstance.post("/api/order/cod", orderPayload);
        if (data.success) {
          toast.success(data.message);
          setCartItems({});
          navigate("/my-orders");
        } else {
          toast.error(data.message);
        }
      } else if (paymentOption === "RAZORPAY") {
        // Initiate Razorpay order
        const { data } = await axiosInstance.post("/api/order/razorpay", orderPayload);

        if (data.success) {
          // Create Razorpay options
          const options = {
            key: data.key || import.meta.env.VITE_RAZORPAY_KEY,
            amount: data.amount, // Amount in paise
            currency: data.currency,
            order_id: data.razorpayOrderId,
            name: "GreenCart",
            description: "Purchase Order",
            handler: async function (response) {
              try {
                const verifyRes = await axiosInstance.post("/api/payment/verify", {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });

                if (verifyRes.data.success) {
                  toast.success("Payment Verified & Order Placed!");
                  setCartItems({});
                  navigate("/my-orders");
                } else {
                  toast.error("Payment verification failed.");
                }
              } catch (err) {
                toast.error("Verification error");
              }
              setIsPlacingOrder(false);
            },
            prefill: {
              email: user.email,
              name: user.name,
              contact: user.phone || "",
            },
            theme: {
              color: "#3399cc",
            },
          };

          const rzp = new window.Razorpay(options);

          rzp.on("payment.failed", (response) => {
            toast.error(`Payment failed: ${response.error.description}`);
            setIsPlacingOrder(false);
          });

          rzp.open();
        } else {
          toast.error(data.message);
          setIsPlacingOrder(false);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
      setIsPlacingOrder(false);
    }
  };

  if (!getCartCount()) {
    return (
      <div className="mt-16 text-center text-gray-500">
        <p>Your cart is empty</p>
        <button
          onClick={() => navigate("/products")}
          className="text-primary mt-4 underline"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row mt-16">
      {/* Cart Section */}
      <div className="flex-1 max-w-4xl">
        <h1 className="text-3xl font-medium mb-6">
          Shopping Cart{" "}
          <span className="text-sm text-primary">{getCartCount()} Items</span>
        </h1>

        <div className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 text-base font-medium pb-3">
          <p className="text-left">Product Details</p>
          <p className="text-center">Subtotal</p>
          <p className="text-center">Action</p>
        </div>

        {cartArray.map((product) => (
          <div
            key={product._id}
            className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 items-center text-sm md:text-base font-medium pt-3"
          >
            <div className="flex items-center md:gap-6 gap-3">
              <div
                onClick={() => {
                  navigate(
                    `/products/${product.category.toLowerCase()}/${product._id}`
                  );
                  window.scrollTo(0, 0);
                }}
                className="cursor-pointer w-24 h-24 flex items-center justify-center border border-gray-300 rounded"
              >
                <img
                  className="max-w-full h-full object-cover"
                  src={product.image[0]}
                  alt={product.name}
                />
              </div>
              <div>
                <p className="hidden md:block font-semibold">{product.name}</p>
                <div className="font-normal text-gray-500/70">
                  <p>
                    Weight: <span>{product.weight || "N/A"}</span>
                  </p>
                  <div className="flex items-center">
                    <p>Qty:</p>
                    <select
                      onChange={(e) =>
                        updateCartItem(product._id, Number(e.target.value))
                      }
                      value={cartItems[product._id]}
                      className="outline-none"
                    >
                      {Array(
                        cartItems[product._id] > 9
                          ? cartItems[product._id]
                          : 9
                      )
                        .fill("")
                        .map((_, idx) => (
                          <option key={idx} value={idx + 1}>
                            {idx + 1}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center">
              {currency}
              {(product.offerPrice * product.quantity).toFixed(2)}
            </p>
            <button
              onClick={() => removeFromCart(product._id)}
              className="cursor-pointer mx-auto"
              aria-label={`Remove ${product.name} from cart`}
            >
              <img
                src={assets.remove_icon}
                alt="remove"
                className="inline-block w-6 h-6"
              />
            </button>
          </div>
        ))}

        <button
          onClick={() => {
            navigate("/products");
            window.scrollTo(0, 0);
          }}
          className="group cursor-pointer flex items-center mt-8 gap-2 text-primary font-medium"
        >
          <img
            className="group-hover:-translate-x-1 transition"
            src={assets.arrow_right_icon_colored}
            alt="arrow"
          />
          Continue Shopping
        </button>
      </div>

      {/* Order Summary */}
      <div className="max-w-[360px] w-full bg-gray-100/40 p-5 max-md:mt-16 border border-gray-300/70">
        <h2 className="text-xl md:text-xl font-medium">Order Summary</h2>
        <hr className="border-gray-300 my-5" />

        <div className="mb-6">
          <p className="text-sm font-medium uppercase">Delivery Address</p>
          <div className="relative flex justify-between items-center border border-gray-300 rounded-md p-2 mt-1">
            <p className="text-gray-600">
              {selectedAddress
                ? `${selectedAddress.street}, ${selectedAddress.city} - ${selectedAddress.zip}`
                : "No Address Selected"}
            </p>
            <button
              onClick={() => setShowAddress(!showAddress)}
              className="bg-primary rounded-md px-3 py-1 text-white"
            >
              {showAddress ? "Hide" : "Change"}
            </button>
          </div>

          {showAddress && (
            <div className="max-h-44 overflow-y-auto mt-2 border border-gray-300 rounded-md p-2">
              {addresses.length > 0 ? (
                addresses.map((address) => (
                  <div
                    key={address._id}
                    className={`p-2 cursor-pointer rounded-md ${
                      selectedAddress?._id === address._id
                        ? "bg-primary text-white"
                        : "hover:bg-gray-300"
                    }`}
                    onClick={() => {
                      setSelectedAddress(address);
                      setShowAddress(false);
                    }}
                  >
                    <p>{`${address.street}, ${address.city} - ${address.zip}`}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">
                  No saved addresses. Please add one in your profile.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium uppercase">Payment Options</p>
          <select
            value={paymentOption}
            onChange={(e) => setPaymentOption(e.target.value)}
            className="w-full p-2 rounded border border-gray-300 mt-1"
          >
            <option value="COD">Cash on Delivery (COD)</option>
            <option value="RAZORPAY">Online Payment (Razorpay)</option>
          </select>
        </div>

        <div className="mb-6 text-sm">
          <p>
            Subtotal: <span className="float-right">{currency}{orderAmounts.subtotal.toFixed(2)}</span>
          </p>
          <p>
            Tax (2.11%): <span className="float-right">{currency}{orderAmounts.tax.toFixed(2)}</span>
          </p>
          <hr className="my-2" />
          <p className="font-semibold text-lg">
            Total: <span className="float-right">{currency}{orderAmounts.totalAmount.toFixed(2)}</span>
          </p>
        </div>

        <button
          disabled={isPlacingOrder}
          onClick={placeOrder}
          className={`w-full py-2 rounded text-white font-semibold ${
            isPlacingOrder ? "bg-gray-400 cursor-not-allowed" : "bg-primary hover:bg-primary-dark"
          }`}
        >
          {isPlacingOrder ? "Processing..." : "Place Order"}
        </button>
      </div>
    </div>
  );
};

export default Cart;
