import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  addBudget,
  getBudgets,
  uploadBudget,
  updateBudget,
  deleteBudget
} from '../controllers/budgetController.js';

const router = express.Router();

// POST: Add budget manually
router.post('/', authMiddleware, addBudget);

// POST: Upload via file
router.post('/upload', authMiddleware, uploadBudget);

// GET: All budgets (with filters + pagination)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, category, page = 1, limit = 10 } = req.query;

    const Budget = (await import('../models/Budget.js')).default;

    const query = { userId };
    if (month) query.month = month;
    if (category) query.category = category;

    const total = await Budget.countDocuments(query);
    const budgets = await Budget.find(query)
      .sort({ month: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      budgets
    });
  } catch (err) {
    console.error('❌ Budget fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch budgets' });
  }
});

// PUT: Update budget record
router.put('/:id', authMiddleware, updateBudget);

// DELETE: Delete budget record
router.delete('/:id', authMiddleware, deleteBudget);

export default router;
