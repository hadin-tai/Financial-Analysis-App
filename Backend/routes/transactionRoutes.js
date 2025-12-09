import express from 'express';
import {
  uploadFile,
  addTransaction,
  updateTransaction,
  deleteTransaction
} from '../controllers/transactionController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Upload: supports CSV, JSON, Excel
router.post('/upload', authMiddleware, uploadFile);

// ✅ Manual entry (used in Upload.jsx)
router.post('/add-transaction', authMiddleware, addTransaction);

// ✅ Get all transactions with filters + pagination
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      startDate,
      endDate,
      type,
      category,
      paymentMethod,
      status,
      page = 1,
      limit = 10
    } = req.query;

    const Transaction = (await import('../models/Transaction.js')).default;

    // Dynamic query builder
    const query = { userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (type) query.type = type;
    if (category) query.category = category;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (status) query.status = status;

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      totalCount: total,
      transactions,
    });
  } catch (err) {
    console.error('❌ Transaction fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
});

// ✅ Update a transaction by ID
router.put('/transaction/:id', authMiddleware, updateTransaction);

// ✅ Delete a transaction by ID
router.delete('/transaction/:id', authMiddleware, deleteTransaction);

export default router;
