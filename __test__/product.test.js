const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index.js'); // Adjust the path as necessary
const Product = require('../models/product.model.js');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Product.deleteMany(); // Clean up after each test
});

describe('Product API Endpoints', () => {

  describe('GET /api/products', () => {
    test('should fetch all products with pagination', async () => {
      await Product.create({ name: 'Product 1', price: 100, category: 'Category 1', inStock: true });
      await Product.create({ name: 'Product 2', price: 200, category: 'Category 2', inStock: true });

      const res = await request(app).get('/api/products?page=1&limit=2');

      expect(res.statusCode).toBe(200);
      expect(res.body.products.length).toBe(2);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.totalPages).toBe(1);
      expect(res.body.totalProducts).toBe(2);
    });

    test('should handle pagination correctly', async () => {
      await Product.create({ name: 'Product 1', price: 100, category: 'Category 1', inStock: true });
      await Product.create({ name: 'Product 2', price: 200, category: 'Category 2', inStock: true });
      await Product.create({ name: 'Product 3', price: 300, category: 'Category 3', inStock: true });

      const res = await request(app).get('/api/products?page=1&limit=2');

      expect(res.statusCode).toBe(200);
      expect(res.body.products.length).toBe(2);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.totalPages).toBe(2);
      expect(res.body.totalProducts).toBe(3);
    });
  });

  describe('POST /api/products', () => {
    test('should create a new product with valid data', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({ name: 'Product 1', price: 100, category: 'Category 1', inStock: true });

      expect(res.statusCode).toBe(201);
      expect(res.body.product).toHaveProperty('name', 'Product 1');
      expect(res.body.product).toHaveProperty('price', 100);
    });

    test('should return 400 for invalid data', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({ name: '', price: -100, category: '', inStock: 'not_a_boolean' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Invalid product data');
    });

    test('should return 400 for duplicate product name', async () => {
      await Product.create({ name: 'Product 1', price: 100, category: 'Category 1', inStock: true });

      const res = await request(app)
        .post('/api/products')
        .send({ name: 'Product 1', price: 200, category: 'Category 2', inStock: true });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Product name already exists');
    });
  });

  describe('GET /api/products/:id', () => {
    test('should fetch a product by ID', async () => {
      const product = await Product.create({ name: 'Product 1', price: 100, category: 'Category 1', inStock: true });

      const res = await request(app).get(`/api/products/${product._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.product).toHaveProperty('name', 'Product 1');
    });

    test('should return 400 for invalid ID', async () => {
      const res = await request(app).get('/api/products/invalidid');

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Invalid product ID');
    });

    test('should return 404 for non-existing product', async () => {
      const res = await request(app).get('/api/products/60c72efb4f1a2c001f1b2d0b'); // Example ID

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Product not found');
    });
  });

  describe('PUT /api/products/:id', () => {
    test('should update a product with valid ID', async () => {
      const product = await Product.create({ name: 'Product 1', price: 100, category: 'Category 1', inStock: true });

      const res = await request(app)
        .put(`/api/products/${product._id}`)
        .send({ price: 150 });

      expect(res.statusCode).toBe(200);
      expect(res.body.price).toBe(150);
    });

    test('should return 400 for invalid ID', async () => {
      const res = await request(app)
        .put('/api/products/invalidid')
        .send({ price: 150 });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Invalid product ID');
    });

    test('should return 404 for non-existing product', async () => {
      const res = await request(app)
        .put('/api/products/60c72efb4f1a2c001f1b2d0b') // Example ID
        .send({ price: 150 });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Product not found');
    });
  });

  describe('DELETE /api/products/:id', () => {
    test('should delete a product with valid ID', async () => {
      const product = await Product.create({ name: 'Product 1', price: 100, category: 'Category 1', inStock: true });

      const res = await request(app).delete(`/api/products/${product._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Product deleted successfully');
    });

    test('should return 400 for invalid ID', async () => {
      const res = await request(app).delete('/api/products/invalidid');

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Invalid product ID');
    });

    test('should return 404 for non-existing product', async () => {
      const res = await request(app).delete('/api/products/60c72efb4f1a2c001f1b2d0b'); // Example ID

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Product not found');
    });
  });
});
