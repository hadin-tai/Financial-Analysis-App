import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { 
  getMonthlyTrends, 
  getCashFlowTrends,
  getTrends,
  getWeeklyIncomeTrends,
  getWeeklyExpenseTrends
} from '../controllers/transactionTrendsController.js';

const router = express.Router();

// GET: Monthly expense trends
router.get('/monthly', authMiddleware, getMonthlyTrends);

// GET: Cash flow trends (monthly/weekly)
router.get('/cashflow', authMiddleware, getCashFlowTrends);

// GET: Comprehensive trends (monthly/weekly)
router.get('/', authMiddleware, getTrends);

// GET: Weekly income trends
router.get('/weekly/income', authMiddleware, getWeeklyIncomeTrends);

// GET: Weekly expense trends
router.get('/weekly/expense', authMiddleware, getWeeklyExpenseTrends);

export default router;
