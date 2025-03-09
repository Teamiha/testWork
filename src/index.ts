import express from 'express';
import dotenv from 'dotenv';
import combinationRoutes from './routes/combinationRoutes';
import { initializeDatabase, closeDatabase } from './config/database';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', combinationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start the server only if this file is run directly, not if it's imported
if (require.main === module) {
  let server: any = null;
  
  const startServer = async () => {
    try {
      // Initialize the database
      await initializeDatabase();
      
      // Start the Express server
      server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };

  // Обработка сигналов завершения для корректного закрытия соединений
  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received');
    if (server) {
      server.close(async () => {
        console.log('Server closed');
        await closeDatabase();
        process.exit(0);
      });
    } else {
      await closeDatabase();
      process.exit(0);
    }
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT signal received');
    if (server) {
      server.close(async () => {
        console.log('Server closed');
        await closeDatabase();
        process.exit(0);
      });
    } else {
      await closeDatabase();
      process.exit(0);
    }
  });

  startServer();
}

// Экспорт app для тестирования
export default app; 