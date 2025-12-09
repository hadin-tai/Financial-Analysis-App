import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { 
  getTransactionSummary, 
  getIncomeDistribution, 
  getExpenseDistribution,
  getPaymentMethodAnalysis,
  getPaymentMethodTrends
} from '../controllers/transactionSummaryController.js';

const router = express.Router();

// GET: Transaction summary
router.get('/', authMiddleware, getTransactionSummary);

// GET: Income distribution by category
router.get('/income-distribution', authMiddleware, getIncomeDistribution);

// GET: Expense distribution by category
router.get('/expense-distribution', authMiddleware, getExpenseDistribution);

// GET: Payment method analysis
router.get('/payment-methods', authMiddleware, getPaymentMethodAnalysis);

// GET: Payment method trends over time
router.get('/payment-method-trends', authMiddleware, getPaymentMethodTrends);

export default router;
