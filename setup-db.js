const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  try {
    // Create connection to MySQL server (without database)
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password'
    });

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'skillex_db'}`);
    console.log(`Database ${process.env.DB_NAME || 'skillex_db'} created or already exists`);

    // Close connection
    await connection.end();
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase(); 