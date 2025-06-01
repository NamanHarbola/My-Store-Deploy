import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const EditProduct = () => {
  const { id } = useParams();
  const { axios, fetchProducts, currency } = useAppContext();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [oldImages, setOldImages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`/api/product/${id}`);
        if (data.success) {
          const product = data.product;
          setName(product.name);
          setCategory(product.category);
          setPrice(product.price ?? "");
          setOfferPrice(product.offerPrice ?? "");
          setOldImages(product.image || []);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.message);
      }
    };

    fetchProduct();
  }, [id, axios]);

  useEffect(() => {
    if (!images || images.length === 0) {
      setImagePreviews([]);
      return;
    }

    const newPreviews = images.map((file) => URL.createObjectURL(file));
    setImagePreviews(newPreviews);

    return () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const removeNewImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append(
        "productData",
        JSON.stringify({
          name,
          category,
          price: Number(price),
          offerPrice: Number(offerPrice),
        })
      );

      images.forEach((file) => formData.append("images", file));

      const { data } = await axios.put(`/api/product/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (data.success) {
        toast.success(data.message);
        fetchProducts();
        navigate("/seller/product-list");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Edit Product</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        <label className="flex flex-col">
          <span className="mb-1 font-medium">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            required
            className="border px-2 py-1 rounded"
          />
        </label>

        <label className="flex flex-col">
          <span className="mb-1 font-medium">Category</span>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            type="text"
            required
            className="border px-2 py-1 rounded"
          />
        </label>

        <label className="flex flex-col">
          <span className="mb-1 font-medium">Price ({currency})</span>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="number"
            min="0"
            step="0.01"
            required
            className="border px-2 py-1 rounded"
          />
        </label>

        <label className="flex flex-col">
          <span className="mb-1 font-medium">Offer Price ({currency})</span>
          <input
            value={offerPrice}
            onChange={(e) => setOfferPrice(e.target.value)}
            type="number"
            min="0"
            step="0.01"
            required
            className="border px-2 py-1 rounded"
          />
        </label>

        {/* Existing Images */}
        <label className="flex flex-col">
          <span className="mb-1 font-medium">Current Images</span>
          <div className="flex space-x-2 overflow-x-auto">
            {oldImages.length === 0 && (
              <p className="text-gray-500">No images available</p>
            )}
            {oldImages.map((imgUrl, idx) => (
              <img
                key={idx}
                src={imgUrl}
                alt={`Old product ${idx}`}
                className="w-20 h-20 object-cover rounded"
              />
            ))}
          </div>
        </label>

        {/* New Image Previews */}
        {imagePreviews.length > 0 && (
          <label className="flex flex-col">
            <span className="mb-1 font-medium">New Image Previews</span>
            <div className="flex space-x-2 overflow-x-auto">
              {imagePreviews.map((src, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={src}
                    alt={`New preview ${idx}`}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(idx)}
                    className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    title="Remove image"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </label>
        )}

        <label className="flex flex-col">
          <span className="mb-1 font-medium">Upload New Images (optional)</span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? "Updating..." : "Update Product"}
        </button>
      </form>
    </div>
  );
};

export default EditProduct;
  