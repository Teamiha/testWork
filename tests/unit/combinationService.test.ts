import { generateValidCombinations } from '../../src/services/combinationService';
import { closeDatabase } from '../../src/config/database';

// Создаем мок для базы данных
jest.mock('../../src/config/database', () => {
  const mockPool = {
    end: jest.fn().mockResolvedValue(undefined)
  };
  
  return {
    __esModule: true,
    default: mockPool,
    closeDatabase: jest.fn().mockImplementation(async () => {
      await mockPool.end();
    }),
    initializeDatabase: jest.fn().mockResolvedValue(undefined)
  };
});

// Создаем тестовые данные
interface Item {
  id: number;
  letter: string;
  value: number;
  code: string;
}

const testItems: Item[] = [
  { id: 1, letter: 'A', value: 1, code: 'A1' },
  { id: 2, letter: 'B', value: 1, code: 'B1' },
  { id: 3, letter: 'B', value: 2, code: 'B2' },
  { id: 4, letter: 'C', value: 1, code: 'C1' }
];

describe('Combination Service', () => {
  // Закрываем соединения после завершения всех тестов
  afterAll(async () => {
    await closeDatabase();
  });
  
  describe('generateValidCombinations', () => {
    it('should generate valid combinations of specified length', () => {
      // Генерируем комбинации длиной 2
      const combinations = generateValidCombinations(testItems, 2);
      
      // Проверяем, что все комбинации имеют правильную длину
      combinations.forEach(combo => {
        expect(combo.length).toBe(2);
      });
      
      // Проверяем, что в каждой комбинации нет элементов с одинаковым префиксом
      combinations.forEach(combo => {
        const letters = combo.map(item => item.letter);
        const uniqueLetters = new Set(letters);
        expect(uniqueLetters.size).toBe(combo.length);
      });
      
      // Проверяем, что все возможные валидные комбинации сгенерированы
      // Для тестовых данных [A1, B1, B2, C1] и длины 2 должны быть комбинации:
      // [A1, B1], [A1, B2], [A1, C1], [B1, C1], [B2, C1]
      expect(combinations.length).toBe(5);
      
      // Проверяем наличие ожидаемых комбинаций
      const expectedCombos = [
        [testItems[0], testItems[1]], // [A1, B1]
        [testItems[0], testItems[2]], // [A1, B2]
        [testItems[0], testItems[3]], // [A1, C1]
        [testItems[1], testItems[3]], // [B1, C1]
        [testItems[2], testItems[3]]  // [B2, C1]
      ];
      
      // Проверяем что каждая ожидаемая комбинация присутствует в результате
      expectedCombos.forEach(expectedCombo => {
        const found = combinations.some(combo => 
          combo.length === expectedCombo.length &&
          combo.every((item, index) => item.id === expectedCombo[index].id)
        );
        expect(found).toBe(true);
      });
    });
    
    it('should return empty array for impossible combinations', () => {
      // Создаем список элементов только с одинаковыми префиксами
      const sameLetterItems: Item[] = [
        { id: 1, letter: 'A', value: 1, code: 'A1' },
        { id: 2, letter: 'A', value: 2, code: 'A2' }
      ];
      
      // Запрашиваем комбинации длиной 2, что невозможно с нашими правилами
      const combinations = generateValidCombinations(sameLetterItems, 2);
      expect(combinations.length).toBe(0);
    });
    
    it('should generate combinations of length 1 correctly', () => {
      const combinations = generateValidCombinations(testItems, 1);
      
      // Для каждого элемента должна быть своя комбинация
      expect(combinations.length).toBe(testItems.length);
      
      // Проверяем, что все элементы присутствуют
      testItems.forEach(item => {
        const found = combinations.some(combo => 
          combo.length === 1 && combo[0].id === item.id
        );
        expect(found).toBe(true);
      });
    });
    
    it('should handle empty input array', () => {
      const combinations = generateValidCombinations([], 2);
      expect(combinations.length).toBe(0);
    });
  });
}); 