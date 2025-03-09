import { Request, Response } from 'express';
import { generateCombinations, getStoredCombinations } from '../services/combinationService';
import pool from '../config/database';
import { ResultSetHeader } from 'mysql2';

export const generateController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { items, length } = req.body;

    // Validate the input
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Items array is required and cannot be empty'
      });
      return;
    }

    if (!length || typeof length !== 'number' || !Number.isInteger(length) || length <= 0) {
      res.status(400).json({
        success: false,
        message: 'Length must be a positive integer'
      });
      return;
    }

    // Validate that all elements are numbers
    const validItems = items.every(num => typeof num === 'number' && Number.isInteger(num) && num > 0);
    if (!validItems) {
      res.status(400).json({
        success: false,
        message: 'All elements in the items array must be positive integers'
      });
      return;
    }

    // Generate combinations
    const combinations = await generateCombinations(items, length);
    
    // Store the response in the database
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Create a response record
      const [result] = await connection.query<ResultSetHeader>(
        'CREATE TABLE IF NOT EXISTS responses (id INT AUTO_INCREMENT PRIMARY KEY, data JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)'
      );
      
      // Format the response data
      const responseData = {
        id: 1, // This will be replaced with the actual ID
        combination: combinations.map(combo => 
          combo.items.map(item => item.code)
        )
      };
      
      // Insert the response
      const [insertResult] = await connection.query<ResultSetHeader>(
        'INSERT INTO responses (data) VALUES (?)',
        [JSON.stringify(responseData)]
      );
      
      // Update the ID in the response data
      responseData.id = insertResult.insertId;
      
      await connection.commit();
      
      res.status(200).json(responseData);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error in generate controller:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while generating combinations'
    });
  }
}; 