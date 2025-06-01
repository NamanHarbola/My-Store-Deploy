import React, { useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const ProductList = () => {
  const { products = [], fetchProducts, axios, currency = "$" } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (fetchProducts) {
      fetchProducts().catch((error) => {
        console.error("Failed to fetch products:", error);
        toast.error("Failed to load products");
      });
    } else {
      console.error("fetchProducts not defined in context");
      toast.error("Internal error: fetchProducts missing");
    }
  }, [fetchProducts]);

  // Delete product handler
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await axios.delete(`/api/product/${id}`);
      if (res.data.success) {
        toast.success("Product deleted");
        fetchProducts();
      } else {
        toast.error(res.data.message || "Failed to delete product");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-6">Product List</h2>

      {products.length === 0 ? (
        <p className="text-gray-600">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((product) => (
            <div key={product._id} className="border rounded p-4 flex flex-col">
              <div className="flex gap-4 mb-4">
                <img
                  src={product.image?.[0] || "/placeholder.png"}
                  alt={product.name || "Product Image"}
                  className="w-28 h-28 object-cover rounded"
                  onError={(e) => { e.target.src = "/placeholder.png"; }}
                />
                <div>
                  <h3 className="font-semibold text-lg">{product.name || "No Name"}</h3>
                  <p className="text-sm text-gray-600 mb-1">{product.category || "No Category"}</p>
                  <p className="mb-1">
                    <span className="line-through text-gray-500 mr-2">
                      {currency} {(product.sellingPrice || 0).toFixed(2)}
                    </span>
                    <span className="text-green-600 font-semibold">
                      {currency} {(product.offerPrice || 0).toFixed(2)}
                    </span>
                  </p>
                  <p className={`font-medium ${product.inStock ? "text-green-600" : "text-red-600"}`}>
                    {product.inStock ? "In Stock" : "Out of Stock"}
                  </p>
                </div>
              </div>

              <div className="mt-auto flex gap-3">
                <button
                  onClick={() => navigate(`/seller/product-edit/${product._id}`)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product._id)}
                  className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;
