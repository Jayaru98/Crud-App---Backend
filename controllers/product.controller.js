const Product = require("../models/product.model.js");
const mongoose = require("mongoose");

const getProducts = async (req, res) => {
  try {
    // Extract page and limit from query parameters, with default values
    const { page = 1, limit = 10 } = req.query;

    // Convert page and limit to integers
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    // Calculate the skip value
    const skip = (pageNumber - 1) * limitNumber;

    // Fetch products with pagination
    const products = await Product.find({}).skip(skip).limit(limitNumber);

    // Get the total count of products for pagination info
    const totalProducts = await Product.countDocuments();

    // Send response with paginated products and pagination info
    res.status(200).json({
      products,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalProducts / limitNumber),
      totalProducts,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Oops! Something went wrong",
      error: error.message
     });
  }
};


const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, price, category, inStock } = req.body;

    // Validate inputs
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: "Invalid product name" });
    }
    if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ message: "Invalid price" });
    }
    if (!category || typeof category !== 'string') {
      return res.status(400).json({ message: "Invalid category" });
    }
    if (typeof inStock !== 'boolean') {
      return res.status(400).json({ message: "Invalid stock status" });
    }

    // Check for duplicate product name
    const existingProduct = await Product.findOne({ name });
    if (existingProduct) {
      return res.status(400).json({ message: "Product name already exists" });
    }

    // Create the new product
    const product = await Product.create({
      name,
      price,
      category,
      inStock,
    });

    // Respond with the created product
    res.status(201).json({ product });
  } catch (error) {
    res.status(500).json({ 
      message: "Oops! Something went wrong",
      error: error.message
     });
  }
};



const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Validate updated inputs
    const { name, price, category, inStock } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: "Invalid product name" });
    }
    if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ message: "Invalid price" });
    }
    if (!category || typeof category !== 'string') {
      return res.status(400).json({ message: "Invalid category" });
    }
    if (typeof inStock !== 'boolean') {
      return res.status(400).json({ message: "Invalid stock status" });
    }

    // Update the product
    const product = await Product.findByIdAndUpdate(id, req.body, { new: true });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Respond with the updated product
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Delete the product
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
};

