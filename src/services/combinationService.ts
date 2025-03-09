import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Define interfaces for our data structures
interface Item {
  id: number;
  letter: string;
  value: number;
  code: string;
}

interface Combination {
  id: number;
  items: Item[];
}

export const generateCombinations = async (numbers: number[], length: number): Promise<Combination[]> => {
  try {
    const connection = await pool.getConnection();
    
    try {
      // Start a transaction
      await connection.beginTransaction();
      
      // Get all available items
      const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM items');
      const items = rows as Item[];
      
      // Filter items based on the input numbers
      const filteredItems: Item[] = [];
      numbers.forEach(num => {
        const matchingItems = items.filter(item => item.value === num);
        filteredItems.push(...matchingItems);
      });
      
      // Generate all possible valid combinations of the specified length
      const validCombinations = generateValidCombinations(filteredItems, length);
      
      // Store the combinations in the database
      const storedCombinations: Combination[] = [];
      
      for (const combo of validCombinations) {
        // Create a new combination record
        const [result] = await connection.query<ResultSetHeader>(
          'INSERT INTO combinations () VALUES ()'
        );
        const combinationId = result.insertId;
        
        // Store each item in the combination
        for (const item of combo) {
          await connection.query(
            'INSERT INTO combination_items (combination_id, item_id) VALUES (?, ?)',
            [combinationId, item.id]
          );
        }
        
        storedCombinations.push({
          id: combinationId,
          items: combo
        });
      }
      
      // Commit the transaction
      await connection.commit();
      
      return storedCombinations;
    } catch (error) {
      // Rollback in case of error
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error generating combinations:', error);
    throw error;
  }
};

// Helper function to generate valid combinations
// Экспортируем функцию для тестирования
export const generateValidCombinations = (items: Item[], targetLength: number): Item[][] => {
  const result: Item[][] = [];
  
  // Function to check if a combination is valid
  const isValidCombination = (combo: Item[]): boolean => {
    const letters = new Set<string>();
    for (const item of combo) {
      if (letters.has(item.letter)) {
        return false;
      }
      letters.add(item.letter);
    }
    return true;
  };
  
  // Generate all combinations recursively
  const backtrack = (start: number, currentCombo: Item[]) => {
    // If we've reached the target length and the combination is valid, add it to the result
    if (currentCombo.length === targetLength && isValidCombination(currentCombo)) {
      result.push([...currentCombo]);
      return;
    }
    
    // If we've exceeded the target length, stop
    if (currentCombo.length > targetLength) {
      return;
    }
    
    // Try adding each remaining item to the combination
    for (let i = start; i < items.length; i++) {
      // Skip if this would create an invalid combination
      if (currentCombo.some(item => item.letter === items[i].letter)) {
        continue;
      }
      
      currentCombo.push(items[i]);
      backtrack(i + 1, currentCombo);
      currentCombo.pop();
    }
  };
  
  backtrack(0, []);
  
  return result;
};

// Function to get stored combinations
export const getStoredCombinations = async (): Promise<Combination[]> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT c.id as combination_id, i.id, i.letter, i.value, i.code 
      FROM combinations c
      JOIN combination_items ci ON c.id = ci.combination_id
      JOIN items i ON ci.item_id = i.id
      ORDER BY c.id, i.letter
    `);
    
    // Group items by combination
    const combinationsMap = new Map<number, Combination>();
    
    for (const row of rows) {
      const combinationId = row.combination_id;
      const item = {
        id: row.id,
        letter: row.letter,
        value: row.value,
        code: row.code
      };
      
      if (!combinationsMap.has(combinationId)) {
        combinationsMap.set(combinationId, {
          id: combinationId,
          items: []
        });
      }
      
      combinationsMap.get(combinationId)!.items.push(item);
    }
    
    return Array.from(combinationsMap.values());
  } catch (error) {
    console.error('Error retrieving combinations:', error);
    throw error;
  }
}; 