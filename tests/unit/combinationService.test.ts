import { generateValidCombinations } from '../../src/services/combinationService';
import { closeDatabase } from '../../src/config/database';

// Create a mock for the database
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

// Create test data
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
  // Close connections after all tests are completed
  afterAll(async () => {
    await closeDatabase();
  });
  
  describe('generateValidCombinations', () => {
    it('should generate valid combinations of specified length', () => {
      // Generate combinations of length 2
      const combinations = generateValidCombinations(testItems, 2);
      
      // Check that all combinations have the correct length
      combinations.forEach(combo => {
        expect(combo.length).toBe(2);
      });
      
      // Check that there are no elements with the same prefix in each combination
      combinations.forEach(combo => {
        const letters = combo.map(item => item.letter);
        const uniqueLetters = new Set(letters);
        expect(uniqueLetters.size).toBe(combo.length);
      });
      
      // Check that all possible valid combinations are generated
      // For test data [A1, B1, B2, C1] and length 2, there should be combinations:
      // [A1, B1], [A1, B2], [A1, C1], [B1, C1], [B2, C1]
      expect(combinations.length).toBe(5);
      
      // Check for expected combinations
      const expectedCombos = [
        [testItems[0], testItems[1]], // [A1, B1]
        [testItems[0], testItems[2]], // [A1, B2]
        [testItems[0], testItems[3]], // [A1, C1]
        [testItems[1], testItems[3]], // [B1, C1]
        [testItems[2], testItems[3]]  // [B2, C1]
      ];
      
      // Check that each expected combination is present in the result
      expectedCombos.forEach(expectedCombo => {
        const found = combinations.some(combo => 
          combo.length === expectedCombo.length &&
          combo.every((item, index) => item.id === expectedCombo[index].id)
        );
        expect(found).toBe(true);
      });
    });
    
    it('should return empty array for impossible combinations', () => {
      // Create a list of items with only the same prefixes
      const sameLetterItems: Item[] = [
        { id: 1, letter: 'A', value: 1, code: 'A1' },
        { id: 2, letter: 'A', value: 2, code: 'A2' }
      ];
      
      // Request combinations of length 2, which is impossible with our rules
      const combinations = generateValidCombinations(sameLetterItems, 2);
      expect(combinations.length).toBe(0);
    });
    
    it('should generate combinations of length 1 correctly', () => {
      const combinations = generateValidCombinations(testItems, 1);
      
      // There should be a combination for each item
      expect(combinations.length).toBe(testItems.length);
      
      // Check that all items are present
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