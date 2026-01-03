import express from 'express';
import axios from 'axios';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import BalanceSheet from '../models/BalanceSheet.js'; // Assuming this model exists

const router = express.Router();

// Sync User Data
// Sync User Data
router.post('/sync-user-data', async (req, res) => {
  try {
    // console.log("hii")
    const { userId } = req.body;
    // console.log(userId)

    const transactions = await Transaction.find({ userId });
    const budgets = await Budget.find({ userId });
    const balanceSheets = await BalanceSheet.find({ userId });

    await axios.post(`${process.env.BACKEND_URL}/sync-user-data`, {
      user_id: userId,
      transactions,
      budgets,
      balance_sheets: balanceSheets
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error syncing data:', error.message);
    res.status(500).json({ error: 'Failed to sync data' });
  }
});

// Chat Proxy
router.post('/chatbot', async (req, res) => {
  try {
    const { user_id, session_id, message } = req.body;
    console.log("called")

    const response = await axios.post(`${process.env.BACKEND_URL}/chat`, {
      user_id,
      session_id,
      message
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error in chatbot proxy:', error.message);
    res.status(500).json({ error: 'Chatbot service unavailable' });
  }
});

export default router;
