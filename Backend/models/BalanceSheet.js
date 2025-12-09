import mongoose from 'mongoose';

const balanceSheetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: { type: Date, required: true },
  currentAssets: { type: Number, required: true },
  currentLiabilities: { type: Number, required: true },
  totalLiabilities: { type: Number, required: true },
  totalEquity: { type: Number, required: true },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('BalanceSheet', balanceSheetSchema);
