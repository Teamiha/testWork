import express from 'express';
import { generateController } from '../controllers/combinationController';

const router = express.Router();

// POST /generate - Generate combinations
router.post('/generate', generateController);

export default router; 