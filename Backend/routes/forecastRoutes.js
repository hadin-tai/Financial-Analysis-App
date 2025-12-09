import express from 'express';
import {
  getLatestForecast,
  getForecastHistory,
  deleteForecast
} from '../controllers/forecastController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/insightedge/forecast - Get latest forecast for authenticated user
router.get('/insightedge/forecast', authMiddleware, getLatestForecast);

// GET /api/insightedge/forecast/history - Get forecast history
router.get('/insightedge/forecast/history', authMiddleware, getForecastHistory);

// DELETE /api/insightedge/forecast/:id - Delete a forecast
router.delete('/insightedge/forecast/:id', authMiddleware, deleteForecast);

export default router;
