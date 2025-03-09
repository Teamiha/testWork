import request from 'supertest';
import app from '../../src/index';
import { initializeDatabase, closeDatabase } from '../../src/config/database';

describe('API Endpoints', () => {
  // Setup before running tests
  beforeAll(async () => {
    // Initialize the database
    await initializeDatabase();
  });

  // Closing connections after all tests
  afterAll(async () => {
    // Close database connections
    await closeDatabase();
    // Add a small delay to ensure all connections are closed
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  // Тест для endpoint /generate
  describe('POST /generate', () => {
    it('should generate combinations correctly', async () => {
      const response = await request(app)
        .post('/generate')
        .send({
          items: [1, 2, 1],
          length: 2
        })
        .expect('Content-Type', /json/)
        .expect(200);

      // Check response structure
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('combination');
      expect(Array.isArray(response.body.combination)).toBe(true);
      
      // Check that combinations have the correct length
      response.body.combination.forEach((combo: string[]) => {
        expect(combo.length).toBe(2);
      });
      
      // Check that there are no elements with the same prefix in each combination
      response.body.combination.forEach((combo: string[]) => {
        const prefixes = combo.map(item => item[0]); // Get the first letter of each element
        const uniquePrefixes = new Set(prefixes);
        expect(uniquePrefixes.size).toBe(combo.length); // The number of unique prefixes should match the length of the combination
      });
    });

    it('should return 400 for invalid input - missing items', async () => {
      await request(app)
        .post('/generate')
        .send({
          length: 2
        })
        .expect(400);
    });

    it('should return 400 for invalid input - missing length', async () => {
      await request(app)
        .post('/generate')
        .send({
          items: [1, 2, 1]
        })
        .expect(400);
    });

    it('should return 400 for invalid input - items not an array', async () => {
      await request(app)
        .post('/generate')
        .send({
          items: "not_an_array",
          length: 2
        })
        .expect(400);
    });

    it('should return 400 for invalid input - length not a number', async () => {
      await request(app)
        .post('/generate')
        .send({
          items: [1, 2, 1],
          length: "not_a_number"
        })
        .expect(400);
    });
  });

  // Test for endpoint /health
  describe('GET /health', () => {
    it('should return status ok', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({ status: 'ok' });
    });
  });
}); 