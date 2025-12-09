import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { 
  getBudgetAnalysis, 
  getBudgetUtilization,
  getEnhancedBudgetAnalysis,
  getBudgetPerformanceMetrics
} from '../controllers/budgetAnalysisController.js';

const router = express.Router();

// GET: Budget vs Actual analysis
router.get('/', authMiddleware, getBudgetAnalysis);

// GET: Budget utilization percentage
router.get('/utilization', authMiddleware, getBudgetUtilization);

// GET: Enhanced budget analysis with variance
router.get('/enhanced', authMiddleware, getEnhancedBudgetAnalysis);

// GET: Budget performance metrics over time
router.get('/performance', authMiddleware, getBudgetPerformanceMetrics);

export default router;
