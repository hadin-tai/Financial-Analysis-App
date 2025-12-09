import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { 
  addBalance, 
  updateBalance, 
  deleteBalance,
  uploadBalanceSheet
} from '../controllers/balanceController.js';

const router = express.Router();

// POST: Add balance record
router.post('/', authMiddleware, addBalance);

// POST: Upload balance sheet via file (CSV, JSON, Excel)
router.post('/upload', authMiddleware, uploadBalanceSheet);

// GET: All balances (with filters + pagination)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    const BalanceSheet = (await import('../models/BalanceSheet.js')).default;

    const query = { userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const total = await BalanceSheet.countDocuments(query);
    const balances = await BalanceSheet.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      balances
    });
  } catch (err) {
    console.error('❌ Balance sheet fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch balances' });
  }
});

// PUT: Update balance record
router.put('/:id', authMiddleware, updateBalance);

// DELETE: Delete balance record
router.delete('/:id', authMiddleware, deleteBalance);

export default router;
