import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'skillex_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize the database schema
export const initializeDatabase = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    
    // Create the items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        letter VARCHAR(1) NOT NULL,
        value INT NOT NULL,
        code VARCHAR(10) NOT NULL UNIQUE
      )
    `);

    // Create the combinations table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS combinations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create the combination_items table to store items in each combination
    await connection.query(`
      CREATE TABLE IF NOT EXISTS combination_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        combination_id INT,
        item_id INT,
        FOREIGN KEY (combination_id) REFERENCES combinations(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(id)
      )
    `);

    // Seed the initial data if the items table is empty
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM items');
    const count = (rows as any)[0].count;

    if (count === 0) {
      await connection.query(`
        INSERT INTO items (letter, value, code) VALUES 
        ('A', 1, 'A1'),
        ('B', 1, 'B1'),
        ('B', 2, 'B2'),
        ('C', 1, 'C1')
      `);
    }

    connection.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export default pool; 