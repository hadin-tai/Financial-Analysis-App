import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

export const getTransactionSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Include all transactions (Completed + Pending). Apply date filter if provided
    const baseMatch = { userId: userObjectId };
    const dateCond = {};
    if (startDate || endDate) {
      dateCond.date = {};
      if (startDate) dateCond.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        dateCond.date.$lt = end;
      }
    }

    // Total Income (Completed)
    const totalIncome = await Transaction.aggregate([
      { $match: { ...baseMatch, ...dateCond, type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Total Expense (Completed)
    const totalExpense = await Transaction.aggregate([
      { $match: { ...baseMatch, ...dateCond, type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Upcoming Payments
    const today = new Date();
    const upcomingPayments = await Transaction.countDocuments({
      userId: userObjectId,
      status: 'Pending',
      dueDate: { $gte: today }
    });

    // Most Spent Category (Top Expense Category)
    const topCategoryData = await Transaction.aggregate([
      { $match: { ...baseMatch, ...dateCond, type: 'expense' } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: 1 }
    ]);

    const incomeValue = totalIncome[0]?.total || 0;
    const expenseValue = totalExpense[0]?.total || 0;
    const summary = {
      totalIncome: Math.round(incomeValue * 100) / 100,
      totalExpense: Math.round(expenseValue * 100) / 100,
      netProfit: Math.round((incomeValue - expenseValue) * 100) / 100,
      upcomingPayments,
      topCategory: topCategoryData[0]?._id || null
    };

    res.json({ success: true, summary });
  } catch (err) {
    console.error('❌ Summary fetch error:', err);
    res.status(500).json({ success: false, message: 'Summary fetch failed' });
  }
};

// ✅ Get Category-wise Income Distribution
export const getIncomeDistribution = async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { startDate, endDate, limit = 10 } = req.query;

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

    // Get income by category
    const incomeByCategory = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$category',
          totalIncome: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      },
      { $sort: { totalIncome: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Calculate total income for percentage calculation
    const totalIncome = incomeByCategory.reduce((sum, cat) => sum + cat.totalIncome, 0);

    // Format data for pie chart
    const chartData = incomeByCategory.map(category => ({
      category: category._id,
      totalIncome: Math.round(category.totalIncome * 100) / 100,
      transactionCount: category.transactionCount,
      averageAmount: Math.round(category.averageAmount * 100) / 100,
      percentage: totalIncome > 0 ? Math.round((category.totalIncome / totalIncome) * 100 * 100) / 100 : 0
    }));

    // Get top income categories
    const topCategories = chartData.slice(0, 5);
    const otherCategories = chartData.slice(5);
    
    // Group other categories if they exist
    let finalData = [...topCategories];
    if (otherCategories.length > 0) {
      const otherTotal = otherCategories.reduce((sum, cat) => sum + cat.totalIncome, 0);
      const otherCount = otherCategories.reduce((sum, cat) => sum + cat.transactionCount, 0);
      finalData.push({
        category: 'Others',
        totalIncome: Math.round(otherTotal * 100) / 100,
        transactionCount: otherCount,
        averageAmount: otherCount > 0 ? Math.round(otherTotal / otherCount * 100) / 100 : 0,
        percentage: Math.round((otherTotal / totalIncome) * 100 * 100) / 100
      });
    }

    const result = {
      success: true,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalCategories: incomeByCategory.length,
      topCategories: topCategories,
      chartData: finalData,
      period: startDate && endDate ? `${startDate} to ${endDate}` : 'All Time'
    };

    res.json(result);
  } catch (err) {
    console.error('❌ Income distribution error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch income distribution' 
    });
  }
};

// ✅ Get Category-wise Expense Distribution
export const getExpenseDistribution = async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { startDate, endDate, limit = 10 } = req.query;

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

    // Get expenses by category
    const expenseByCategory = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$category',
          totalExpense: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      },
      { $sort: { totalExpense: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Calculate total expenses for percentage calculation
    const totalExpense = expenseByCategory.reduce((sum, cat) => sum + cat.totalExpense, 0);

    // Format data for pie chart
    const chartData = expenseByCategory.map(category => ({
      category: category._id,
      totalExpense: Math.round(category.totalExpense * 100) / 100,
      transactionCount: category.transactionCount,
      averageAmount: Math.round(category.averageAmount * 100) / 100,
      percentage: totalExpense > 0 ? Math.round((category.totalExpense / totalExpense) * 100 * 100) / 100 : 0
    }));

    // Get top expense categories
    const topCategories = chartData.slice(0, 5);
    const otherCategories = chartData.slice(5);
    
    // Group other categories if they exist
    let finalData = [...topCategories];
    if (otherCategories.length > 0) {
      const otherTotal = otherCategories.reduce((sum, cat) => sum + cat.totalExpense, 0);
      const otherCount = otherCategories.reduce((sum, cat) => sum + cat.transactionCount, 0);
      finalData.push({
        category: 'Others',
        totalExpense: Math.round(otherTotal * 100) / 100,
        transactionCount: otherCount,
        averageAmount: otherCount > 0 ? Math.round(otherTotal / otherCount * 100) / 100 : 0,
        percentage: Math.round((otherTotal / totalExpense) * 100 * 100) / 100
      });
    }

    const result = {
      success: true,
      totalExpense: Math.round(totalExpense * 100) / 100,
      totalCategories: expenseByCategory.length,
      topCategories: topCategories,
      chartData: finalData,
      period: startDate && endDate ? `${startDate} to ${endDate}` : 'All Time'
    };

    res.json(result);
  } catch (err) {
    console.error('❌ Expense distribution error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch expense distribution' 
    });
  }
};

// ✅ Get Payment Method Analysis
export const getPaymentMethodAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, type, limit = 10 } = req.query;

    // Ensure ObjectId match for aggregation
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
    if (type) match.type = type; // 'income' or 'expense'

    // Get transactions by payment method
    const transactionsByMethod = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          averageAmount: { $avg: '$amount' },
          incomeAmount: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
            }
          },
          expenseAmount: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
            }
          }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Calculate totals for percentage calculation
    const totalAmount = transactionsByMethod.reduce((sum, method) => sum + method.totalAmount, 0);
    const totalTransactions = transactionsByMethod.reduce((sum, method) => sum + method.transactionCount, 0);

    // Format data for charts
    const chartData = transactionsByMethod.map(method => ({
      paymentMethod: method._id,
      totalAmount: Math.round(method.totalAmount * 100) / 100,
      transactionCount: method.transactionCount,
      averageAmount: Math.round(method.averageAmount * 100) / 100,
      incomeAmount: Math.round(method.incomeAmount * 100) / 100,
      expenseAmount: Math.round(method.expenseAmount * 100) / 100,
      percentageOfTotal: totalAmount > 0 ? Math.round((method.totalAmount / totalAmount) * 100 * 100) / 100 : 0,
      percentageOfTransactions: totalTransactions > 0 ? Math.round((method.transactionCount / totalTransactions) * 100 * 100) / 100 : 0
    }));

    // Get top payment methods
    const topMethods = chartData.slice(0, 5);
    const otherMethods = chartData.slice(5);
    
    // Group other methods if they exist
    let finalData = [...topMethods];
    if (otherMethods.length > 0) {
      const otherTotal = otherMethods.reduce((sum, method) => sum + method.totalAmount, 0);
      const otherCount = otherMethods.reduce((sum, method) => sum + method.transactionCount, 0);
      const otherIncome = otherMethods.reduce((sum, method) => sum + method.incomeAmount, 0);
      const otherExpense = otherMethods.reduce((sum, method) => sum + method.expenseAmount, 0);
      
      finalData.push({
        paymentMethod: 'Others',
        totalAmount: Math.round(otherTotal * 100) / 100,
        transactionCount: otherCount,
        averageAmount: otherCount > 0 ? Math.round(otherTotal / otherCount * 100) / 100 : 0,
        incomeAmount: Math.round(otherIncome * 100) / 100,
        expenseAmount: Math.round(otherExpense * 100) / 100,
        percentageOfTotal: Math.round((otherTotal / totalAmount) * 100 * 100) / 100,
        percentageOfTransactions: Math.round((otherCount / totalTransactions) * 100 * 100) / 100
      });
    }

    // Calculate summary statistics
    const summary = {
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalTransactions,
      uniquePaymentMethods: transactionsByMethod.length,
      mostUsedMethod: topMethods[0]?.paymentMethod || 'None',
      highestAmountMethod: topMethods[0]?.paymentMethod || 'None'
    };

    const result = {
      success: true,
      summary,
      topMethods: topMethods,
      chartData: finalData,
      period: startDate && endDate ? `${startDate} to ${endDate}` : 'All Time',
      transactionType: type || 'All'
    };

    res.json(result);
  } catch (err) {
    console.error('❌ Payment method analysis error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payment method analysis' 
    });
  }
};

// ✅ Get Payment Method Trends Over Time
export const getPaymentMethodTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, groupBy = 'monthly', paymentMethod } = req.query;

    // Ensure ObjectId match for aggregation
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
    if (paymentMethod) match.paymentMethod = paymentMethod;

    let groupByField;
    if (groupBy === 'weekly') {
      groupByField = { 
        week: { $week: "$date" }, 
        year: { $year: "$date" } 
      };
    } else {
      groupByField = { 
        month: { $month: "$date" }, 
        year: { $year: "$date" } 
      };
    }

    // Aggregate payment method data by time period
    const trendsData = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            ...groupByField,
            paymentMethod: '$paymentMethod'
          },
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          incomeAmount: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
            }
          },
          expenseAmount: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
            }
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1 } }
    ]);

    // Format data for time series charts
    const chartData = trendsData.map(item => {
      const period = groupBy === 'weekly' 
        ? `Week ${item._id.week}-${item._id.year}`
        : `${item._id.month}-${item._id.year}`;
      
      const periodNum = groupBy === 'weekly' ? item._id.week : item._id.month;
      const year = item._id.year;

      return {
        period,
        periodNum,
        year,
        paymentMethod: item._id.paymentMethod,
        totalAmount: Math.round(item.totalAmount * 100) / 100,
        transactionCount: item.transactionCount,
        incomeAmount: Math.round(item.incomeAmount * 100) / 100,
        expenseAmount: Math.round(item.expenseAmount * 100) / 100
      };
    });

    const result = {
      success: true,
      groupBy,
      paymentMethod: paymentMethod || 'All',
      chartData,
      totalPeriods: new Set(chartData.map(item => `${item.periodNum}-${item.year}`)).size,
      period: startDate && endDate ? `${startDate} to ${endDate}` : 'All Time'
    };

    res.json(result);
  } catch (err) {
    console.error('❌ Payment method trends error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payment method trends' 
    });
  }
};
