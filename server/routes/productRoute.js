  import express from "express";
  import { upload } from "../configs/multer.js";
  import authSeller from "../middlewares/authSeller.js";
  import {
    addProduct,
    updateProduct,
    productById,
    productList,
    changeStock,
    deleteProduct,
  } from "../controllers/productController.js";

  const productRouter = express.Router();

  // Add a product - POST /api/product/
  productRouter.post("/", authSeller, upload.array("images"), addProduct);

  // Get all products - GET /api/product/
  productRouter.get("/", productList);

  // Get a product by ID - GET /api/product/:id
  productRouter.get("/:id", productById);

  // Update a product - PUT /api/product/:id
  productRouter.put("/:id", authSeller, upload.array("images"), updateProduct);

  // Change stock - POST /api/product/stock
  productRouter.post("/stock", authSeller, changeStock);

  // Delete a product - DELETE /api/product/:id
  productRouter.delete("/:id", authSeller, deleteProduct);

  export default productRouter;
