import Transaction from '../models/Transaction.js';

export const getMonthlyTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, category } = req.query;

    // Cast userId to ObjectId for aggregation consistency
    const mongoose = (await import('mongoose')).default;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const match = { userId: userObjectId, type: 'expense' };

    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        match.date.$lt = end;
      }
    }

    if (category) match.category = category;

    const data = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: { month: { $month: "$date" }, year: { $year: "$date" } },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const result = data.map(item => ({
      month: `${item._id.month}-${item._id.year}`,
      total: item.total
    }));

    res.json({ success: true, trends: result });
  } catch (err) {
    console.error('❌ Monthly trends error:', err);
    res.status(500).json({ success: false, message: 'Failed to compute monthly trends' });
  }
};

// ✅ Get Cash Flow Trends (Monthly/Weekly)
export const getCashFlowTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const mongoose = (await import('mongoose')).default;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { period = 'monthly', startDate, endDate } = req.query;

    const match = { userId: userObjectId };
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        match.date.$lt = end;
      }
    }

    let groupBy;
    let dateFormat;

    if (period === 'weekly') {
      groupBy = { 
        week: { $week: "$date" }, 
        year: { $year: "$date" } 
      };
      dateFormat = { $concat: ["Week ", { $toString: "$_id.week" }, " - ", { $toString: "$_id.year" }] };
    } else {
      groupBy = { 
        month: { $month: "$date" }, 
        year: { $year: "$date" } 
      };
      dateFormat = { $concat: [{ $toString: "$_id.month" }, "-", { $toString: "$_id.year" }] };
    }

    // Get income trends
    const incomeTrends = await Transaction.aggregate([
      { $match: { ...match, type: 'income' } },
      { $group: { _id: groupBy, total: { $sum: "$amount" } } },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1 } }
    ]);

    // Get expense trends
    const expenseTrends = await Transaction.aggregate([
      { $match: { ...match, type: 'expense' } },
      { $group: { _id: groupBy, total: { $sum: "$amount" } } },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1 } }
    ]);

    // Combine and calculate net cash flow
    const allPeriods = new Set();
    
    incomeTrends.forEach(item => {
      const key = period === 'weekly' ? `${item._id.week}-${item._id.year}` : `${item._id.month}-${item._id.year}`;
      allPeriods.add(key);
    });
    
    expenseTrends.forEach(item => {
      const key = period === 'weekly' ? `${item._id.week}-${item._id.year}` : `${item._id.month}-${item._id.year}`;
      allPeriods.add(key);
    });

    const cashFlowData = Array.from(allPeriods).map(periodKey => {
      const [periodNum, year] = periodKey.split('-');
      
      const income = incomeTrends.find(item => {
        const itemKey = period === 'weekly' ? `${item._id.week}-${item._id.year}` : `${item._id.month}-${item._id.year}`;
        return itemKey === periodKey;
      })?.total || 0;

      const expense = expenseTrends.find(item => {
        const itemKey = period === 'weekly' ? `${item._id.week}-${item._id.year}` : `${item._id.month}-${item._id.year}`;
        return itemKey === periodKey;
      })?.total || 0;

      return {
        period: period === 'weekly' ? `Week ${periodNum}-${year}` : `${periodNum}-${year}`,
        income,
        expense,
        netCashFlow: income - expense,
        periodNum: parseInt(periodNum),
        year: parseInt(year)
      };
    }).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.periodNum - b.periodNum;
    });

    res.json({ 
      success: true, 
      period,
      cashFlowTrends: cashFlowData 
    });
  } catch (err) {
    console.error('❌ Cash flow trends error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to compute cash flow trends' 
    });
  }
};

// ✅ Get Comprehensive Trends (Monthly/Weekly)
export const getTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, category, groupBy = 'monthly' } = req.query;

    const mongoose = (await import('mongoose')).default;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const match = { userId: userObjectId };
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        match.date.$lt = end;
      }
    }
    if (category) match.category = category;

    let groupByField;
    let periodLabel;

    if (groupBy === 'weekly') {
      groupByField = { 
        week: { $week: "$date" }, 
        year: { $year: "$date" } 
      };
      periodLabel = 'week';
    } else {
      groupByField = { 
        month: { $month: "$date" }, 
        year: { $year: "$date" } 
      };
      periodLabel = 'month';
    }

    // Get income trends
    const incomeTrends = await Transaction.aggregate([
      { $match: { ...match, type: 'income' } },
      {
        $group: {
          _id: groupByField,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          average: { $avg: '$amount' }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1 } }
    ]);

    // Get expense trends
    const expenseTrends = await Transaction.aggregate([
      { $match: { ...match, type: 'expense' } },
      {
        $group: {
          _id: groupByField,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          average: { $avg: '$amount' }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1 } }
    ]);

    // Combine all periods
    const allPeriods = new Set();
    
    incomeTrends.forEach(item => {
      const key = groupBy === 'weekly' ? `${item._id.week}-${item._id.year}` : `${item._id.month}-${item._id.year}`;
      allPeriods.add(key);
    });
    
    expenseTrends.forEach(item => {
      const key = groupBy === 'weekly' ? `${item._id.week}-${item._id.year}` : `${item._id.month}-${item._id.year}`;
      allPeriods.add(key);
    });

    // Create comprehensive trends data
    const trendsData = Array.from(allPeriods).map(periodKey => {
      const [periodNum, year] = periodKey.split('-');
      
      const income = incomeTrends.find(item => {
        const itemKey = groupBy === 'weekly' ? `${item._id.week}-${item._id.year}` : `${item._id.month}-${item._id.year}`;
        return itemKey === periodKey;
      });

      const expense = expenseTrends.find(item => {
        const itemKey = groupBy === 'weekly' ? `${item._id.week}-${item._id.year}` : `${item._id.month}-${item._id.year}`;
        return itemKey === periodKey;
      });

      return {
        period: groupBy === 'weekly' ? `Week ${periodNum}-${year}` : `${periodNum}-${year}`,
        periodNum: parseInt(periodNum),
        year: parseInt(year),
        income: {
          total: income?.total || 0,
          count: income?.count || 0,
          average: income?.average || 0
        },
        expense: {
          total: expense?.total || 0,
          count: expense?.count || 0,
          average: expense?.average || 0
        },
        netAmount: (income?.total || 0) - (expense?.total || 0),
        profitMargin: (income?.total || 0) > 0 ? 
          Math.round(((income.total - (expense?.total || 0)) / income.total * 100) * 100) / 100 : 0
      };
    }).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.periodNum - b.periodNum;
    });

    // Calculate summary statistics
    const totalIncome = trendsData.reduce((sum, period) => sum + period.income.total, 0);
    const totalExpense = trendsData.reduce((sum, period) => sum + period.expense.total, 0);
    const totalNet = trendsData.reduce((sum, period) => sum + period.netAmount, 0);

    const summary = {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      totalNet: Math.round(totalNet * 100) / 100,
      averageIncome: trendsData.length > 0 ? Math.round(totalIncome / trendsData.length * 100) / 100 : 0,
      averageExpense: trendsData.length > 0 ? Math.round(totalExpense / trendsData.length * 100) / 100 : 0,
      totalPeriods: trendsData.length,
      groupBy
    };

    res.json({ 
      success: true, 
      groupBy,
      summary,
      trends: trendsData,
      period: startDate && endDate ? `${startDate} to ${endDate}` : 'All Time'
    });
  } catch (err) {
    console.error('❌ Comprehensive trends error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to compute trends' 
    });
  }
};

// ✅ Get Weekly Income Trends
export const getWeeklyIncomeTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, category } = req.query;

    const mongoose = (await import('mongoose')).default;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const match = { userId: userObjectId, type: 'income' };
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        match.date.$lt = end;
      }
    }
    if (category) match.category = category;

    const data = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: { week: { $week: "$date" }, year: { $year: "$date" } },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          average: { $avg: "$amount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } }
    ]);

    const result = data.map(item => ({
      week: `Week ${item._id.week}-${item._id.year}`,
      weekNum: item._id.week,
      year: item._id.year,
      total: Math.round(item.total * 100) / 100,
      count: item.count,
      average: Math.round(item.average * 100) / 100
    }));

    res.json({ success: true, trends: result, groupBy: 'weekly' });
  } catch (err) {
    console.error('❌ Weekly income trends error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to compute weekly income trends' 
    });
  }
};

// ✅ Get Weekly Expense Trends
export const getWeeklyExpenseTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, category } = req.query;

    const mongoose = (await import('mongoose')).default;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const match = { userId: userObjectId, type: 'expense' };
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        match.date.$lt = end;
      }
    }
    if (category) match.category = category;

    const data = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: { week: { $week: "$date" }, year: { $year: "$date" } },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          average: { $avg: "$amount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } }
    ]);

    const result = data.map(item => ({
      week: `Week ${item._id.week}-${item._id.year}`,
      weekNum: item._id.week,
      year: item._id.year,
      total: Math.round(item.total * 100) / 100,
      count: item.count,
      average: Math.round(item.average * 100) / 100
    }));

    res.json({ success: true, trends: result, groupBy: 'weekly' });
  } catch (err) {
    console.error('❌ Weekly expense trends error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to compute weekly expense trends' 
    });
  }
};
