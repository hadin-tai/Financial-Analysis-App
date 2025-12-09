import mongoose from 'mongoose';

const forecastSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  forecast_period: {
    type: String,
    default: '30_days'
  },
  income_forecast: [{
    date: String,
    predicted_value: Number,
    lower_bound: Number,
    upper_bound: Number
  }],
  expense_forecast: [{
    date: String,
    predicted_value: Number,
    lower_bound: Number,
    upper_bound: Number
  }],
  net_profit_forecast: [{
    date: String,
    predicted_value: Number,
    lower_bound: Number,
    upper_bound: Number
  }],
  total_projected_income: Number,
  total_projected_expense: Number,
  total_projected_profit: Number,
  generated_at: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Forecast', forecastSchema);
