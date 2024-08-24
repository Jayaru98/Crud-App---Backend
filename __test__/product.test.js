const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../index.js"); 
const Product = require("../models/product.model.js");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Check if Mongoose is already connected
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase(); // Ensure the database is cleaned up
  await mongoose.connection.close(); // Close the Mongoose connection
  await mongoServer.stop(); // Stop the in-memory MongoDB server
});

afterEach(async () => {
  await Product.deleteMany(); // Clean up after each test
});

describe("Product API Endpoints", () => {
  describe("GET /api/products", () => {
    test("should fetch products without limit and page provided", async () => {
      let productsCount = 20;

      for (let i = 1; i <= productsCount; i++) {
        await Product.create({
          name: `Product ${i}`,
          price: i * productsCount,
          category: `Category ${i}`,
          inStock: true,
        });
      }

      const res = await request(app).get("/api/products");

      expect(res.statusCode).toBe(200);
      expect(res.body.products.length).toBe(10);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.totalPages).toBe(Math.ceil(productsCount / 10));
      expect(res.body.totalProducts).toBe(productsCount);
    }, 10000);

    test("should handle pagination correctly with limit and page provided", async () => {
      let productsCount = 20;

      for (let i = 1; i <= productsCount; i++) {
        await Product.create({
          name: `Product ${i}`,
          price: i * productsCount,
          category: `Category ${i}`,
          inStock: true,
        });
      }

      const res = await request(app).get("/api/products?page=2&limit=5");

      expect(res.statusCode).toBe(200);
      expect(res.body.products.length).toBe(5);
      expect(res.body.currentPage).toBe(2);
      expect(res.body.totalPages).toBe(Math.ceil(productsCount / 5));
      expect(res.body.totalProducts).toBe(productsCount);
    }, 10000);
  });

  describe("POST /api/products", () => {
    test("should create a new product with valid data", async () => {
      const res = await request(app).post("/api/products").send({
        name: "Product 1",
        price: 100,
        category: "Category 1",
        inStock: true,
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.product).toHaveProperty("name", "Product 1");
      expect(res.body.product).toHaveProperty("price", 100);
      expect(res.body.product).toHaveProperty("category", "Category 1");
      expect(res.body.product).toHaveProperty("inStock", true);
    });

    test("should return 400 for invalid name", async () => {
      const res = await request(app).post("/api/products").send({
        name: "",
        price: 100,
        category: "Category 1",
        inStock: true,
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Invalid product name");
    });

    test("should return 400 for invalid price", async () => {
      const res = await request(app).post("/api/products").send({
        name: "Product 1",
        price: -100,
        category: "Category 1",
        inStock: true,
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Invalid price");
    });

    test("should return 400 for invalid category", async () => {
      const res = await request(app).post("/api/products").send({
        name: "Product 1",
        price: 100,
        category: "",
        inStock: true,
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Invalid category");
    });

    test("should return 400 for invalid stock status", async () => {
      const res = await request(app).post("/api/products").send({
        name: "Product 1",
        price: 100,
        category: "Category 1",
        inStock: "not_a_boolean",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Invalid stock status");
    });

    test("should return 400 for duplicate product name", async () => {
      await Product.create({
        name: "Product 1",
        price: 100,
        category: "Category 1",
        inStock: true,
      });

      const res = await request(app).post("/api/products").send({
        name: "Product 1",
        price: 200,
        category: "Category 2",
        inStock: false,
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Product name already exists");
    });
  });

  describe("PUT /api/products/:id", () => {
    let product;

    beforeAll(async () => {
      // Create a product to be used in tests
      product = await Product.create({
        name: "Test Product",
        price: 100,
        category: "Test Category",
        inStock: true,
      });
    });

    test("should update the product successfully", async () => {
      const updatedProduct = {
        name: "Updated Product",
        price: 150,
        category: "Updated Category",
        inStock: false,
      };

      const response = await request(app)
        .put(`/api/products/${product._id}`)
        .send(updatedProduct)
        .expect(200);

      // Validate the response body

      expect(response.body).toHaveProperty("_id", product._id.toString());
      expect(response.body).toHaveProperty("name", updatedProduct.name);
      expect(response.body).toHaveProperty("price", updatedProduct.price);
      expect(response.body).toHaveProperty("category", updatedProduct.category);
      expect(response.body).toHaveProperty("inStock", updatedProduct.inStock);
    });

    test("should return 400 for invalid product ID", async () => {
      const response = await request(app)
        .put(`/api/products/invalid-id`)
        .send({
          name: "Updated Product",
          price: 150,
          category: "Updated Category",
          inStock: false,
        })
        .expect(400);

      expect(response.body).toHaveProperty("message", "Invalid product ID");
    });

    test("should return 400 for invalid product name", async () => {
      const response = await request(app)
        .put(`/api/products/${product._id}`)
        .send({
          name: 12345, // Invalid name
          price: 150,
          category: "Updated Category",
          inStock: false,
        })
        .expect(400);

      expect(response.body).toHaveProperty("message", "Invalid product name");
    });

    test("should return 400 for invalid price", async () => {
      const response = await request(app)
        .put(`/api/products/${product._id}`)
        .send({
          name: "Updated Product",
          price: -10, // Invalid price
          category: "Updated Category",
          inStock: false,
        })
        .expect(400);

      expect(response.body).toHaveProperty("message", "Invalid price");
    });

    test("should return 400 for invalid category", async () => {
      const response = await request(app)
        .put(`/api/products/${product._id}`)
        .send({
          name: "Updated Product",
          price: 150,
          category: 12345, // Invalid category
          inStock: false,
        })
        .expect(400);

      expect(response.body).toHaveProperty("message", "Invalid category");
    });

    test("should return 400 for invalid inStock status", async () => {
      const response = await request(app)
        .put(`/api/products/${product._id}`)
        .send({
          name: "Updated Product",
          price: 150,
          category: "Updated Category",
          inStock: "yes", // Invalid inStock status
        })
        .expect(400);

      expect(response.body).toHaveProperty("message", "Invalid stock status");
    });

    test("should return 404 for non-existent product", async () => {
      const nonExistentId = new mongoose.Types.ObjectId(); // Generate a valid ObjectId that does not exist in the database
      const response = await request(app)
        .put(`/api/products/${nonExistentId}`)
        .send({
          name: "Updated Product",
          price: 150,
          category: "Updated Category",
          inStock: false,
        })
        .expect(404);

      expect(response.body).toHaveProperty("message", "Product not found");
    });
  });
  describe("DELETE /api/products/:id", () => {
    let product;

    beforeAll(async () => {
      // Create a product to be used in tests
      product = await Product.create({
        name: "Product to Delete",
        price: 100,
        category: "Category",
        inStock: true,
      });
    });

    test("should delete the product successfully", async () => {
      const response = await request(app)
        .delete(`/api/products/${product._id}`)
        .expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "Product deleted successfully"
      );

      // Verify that the product is no longer in the database
      const deletedProduct = await Product.findById(product._id);
      expect(deletedProduct).toBeNull();
    });

    test("should return 400 for invalid product ID", async () => {
      const invalidId = "invalid-id";
      const response = await request(app)
        .delete(`/api/products/${invalidId}`)
        .expect(400);

      expect(response.body).toHaveProperty("message", "Invalid product ID");
    });

    test("should return 404 for non-existent product", async () => {
      const nonExistentId = new mongoose.Types.ObjectId(); // Generate a valid ObjectId that does not exist in the database
      const response = await request(app)
        .delete(`/api/products/${nonExistentId}`)
        .expect(404);

      expect(response.body).toHaveProperty("message", "Product not found");
    });

    test("should handle server error gracefully", async () => {
      jest.spyOn(Product, "findByIdAndDelete").mockImplementation(() => {
        throw new Error("Database error");
      });

      const response = await request(app)
        .delete(`/api/products/${product._id}`)
        .expect(500);

      expect(response.body).toHaveProperty("message", "Database error");
    });
  });
});
