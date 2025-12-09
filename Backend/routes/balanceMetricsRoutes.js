import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { 
  getBalanceMetrics, 
  getAssetsVsLiabilities,
  getFinancialHealthScore
} from '../controllers/balanceMetricsController.js';

const router = express.Router();

// GET: Balance sheet metrics
router.get('/', authMiddleware, getBalanceMetrics);

// GET: Assets vs Liabilities comparison data
router.get('/comparison', authMiddleware, getAssetsVsLiabilities);

// GET: Financial health score
router.get('/health-score', authMiddleware, getFinancialHealthScore);

export default router;
