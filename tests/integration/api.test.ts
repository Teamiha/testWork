import request from 'supertest';
import app from '../../src/index';
import { initializeDatabase, closeDatabase } from '../../src/config/database';

describe('API Endpoints', () => {
  // Настройка перед запуском тестов
  beforeAll(async () => {
    // Инициализировать базу данных
    await initializeDatabase();
  });

  // Закрытие соединений после всех тестов
  afterAll(async () => {
    // Закрываем соединения с базой данных
    await closeDatabase();
    // Добавляем небольшую задержку, чтобы убедиться, что все соединения закрыты
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

      // Проверка структуры ответа
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('combination');
      expect(Array.isArray(response.body.combination)).toBe(true);
      
      // Проверка, что комбинации имеют правильную длину
      response.body.combination.forEach((combo: string[]) => {
        expect(combo.length).toBe(2);
      });
      
      // Проверка, что в каждой комбинации нет элементов с одинаковым префиксом
      response.body.combination.forEach((combo: string[]) => {
        const prefixes = combo.map(item => item[0]); // Получаем первую букву каждого элемента
        const uniquePrefixes = new Set(prefixes);
        expect(uniquePrefixes.size).toBe(combo.length); // Количество уникальных префиксов должно совпадать с длиной комбинации
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

  // Тест для endpoint /health
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