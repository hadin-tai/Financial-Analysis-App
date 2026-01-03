import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js'; // ✅ NEW
import balanceRoutes from './routes/balanceRoutes.js'; // ✅ If not already
import transactionTrendsRoutes from './routes/transactionTrendsRoutes.js';
import summaryRoutes from './routes/summaryRoutes.js';
import balanceMetricsRoutes from './routes/balanceMetricsRoutes.js';
import budgetAnalysisRoutes from './routes/budgetAnalysisRoutes.js';
import forecastRoutes from './routes/forecastRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "*", // later you can restrict to Netlify URL
  credentials: true
}));

// app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
  res.send('Hello World!');
});
// ✅ Route registrations
app.use('/api', authRoutes);
app.use('/api', transactionRoutes);
app.use('/api', messageRoutes);
app.use('/api/budgets', budgetRoutes);        // ✅ Make sure this is added
app.use('/api/balances', balanceRoutes);      // ✅ Add this too if testing balances
app.use('/api', transactionTrendsRoutes); // ✅ NEW
app.use('/api/summary', summaryRoutes);
app.use('/api/balance-metrics', balanceMetricsRoutes);
app.use('/api/budget-analysis', budgetAnalysisRoutes);
app.use('/api', forecastRoutes);             // ✅ AI Forecasts
app.use('/api', chatbotRoutes);

// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

