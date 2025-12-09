import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

// Helper: canonical month key YYYY-MM for de-duplication
const canonicalizeMonth = (monthStr, startDate, endDate) => {
  if (!monthStr) return 'unknown';
  if (typeof monthStr === 'string' && monthStr.includes('-')) return monthStr; // already YYYY-MM
  const baseYear = startDate ? new Date(startDate).getFullYear() : (endDate ? new Date(endDate).getFullYear() : new Date().getFullYear());
  const idx = new Date(`${monthStr} 1, ${baseYear}`).getMonth();
  return `${baseYear}-${String(idx + 1).padStart(2, '0')}`;
};

// Helper: de-duplicate budgets by (month, category). If duplicates exist (e.g., '2025-06' and 'June'),
// keep the maximum budgetAmount for that (month, category) to avoid 2x sums.
const dedupeBudgetsByMonthAndCategory = (budgets, startDate, endDate) => {
  const map = new Map();
  for (const b of budgets) {
    const cm = canonicalizeMonth(b.month, startDate, endDate);
    const key = `${cm}|${b.category}`;
    const prev = map.get(key) || 0;
    const val = Math.max(prev, b.budgetAmount || 0);
    map.set(key, val);
  }
  return map;
};

export const getBudgetAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Step 1: Fetch budgets by user, respecting date range if provided
    let budgets;
    if (startDate || endDate) {
      // We need to pick budgets whose month falls within range
      const allBudgets = await Budget.find({ userId: userObjectId });
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      const filtered = allBudgets.filter((b) => {
        let budgetDate;
        if (b.month && typeof b.month === 'string' && b.month.includes('-')) {
          const [y, m] = b.month.split('-');
          budgetDate = new Date(parseInt(y), parseInt(m) - 1, 1);
        } else if (b.month && typeof b.month === 'string') {
          const assumedYear = (start ? start.getFullYear() : new Date().getFullYear());
          budgetDate = new Date(`${b.month} 1, ${assumedYear}`);
        }
        if (!budgetDate) return true;
        const afterStart = start ? budgetDate >= start : true;
        const beforeEnd = end ? budgetDate <= end : true;
        return afterStart && beforeEnd;
      });
      // Deduplicate overlapping month formats
      const dedupedMap = dedupeBudgetsByMonthAndCategory(filtered, startDate, endDate);
      budgets = Array.from(dedupedMap.entries()).map(([key, amount]) => {
        const [monthKey, category] = key.split('|');
        return { month: monthKey, category, budgetAmount: amount };
      });
    } else {
      const allBudgets = await Budget.find({ userId: userObjectId });
      const dedupedMap = dedupeBudgetsByMonthAndCategory(allBudgets, startDate, endDate);
      budgets = Array.from(dedupedMap.entries()).map(([key, amount]) => {
        const [monthKey, category] = key.split('|');
        return { month: monthKey, category, budgetAmount: amount };
      });
    }

    // Step 2: De-duplicate budgets that represent the same month via different formats (e.g., '2025-06' and 'June')
    const dedupByMonthAndCategory = new Map();
    const canonicalizeMonth = (m) => {
      if (!m) return 'unknown';
      if (typeof m === 'string' && m.includes('-')) return m; // already YYYY-MM
      // convert month name to YYYY-MM using startDate/endDate year fallback
      const baseYear = startDate ? new Date(startDate).getFullYear() : (endDate ? new Date(endDate).getFullYear() : new Date().getFullYear());
      const monthIndex = new Date(`${m} 1, ${baseYear}`).getMonth();
      return `${baseYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    };
    budgets.forEach((b) => {
      const cm = canonicalizeMonth(b.month);
      const key = `${cm}|${b.category}`;
      const prev = dedupByMonthAndCategory.get(key) || 0;
      const next = Math.max(prev, b.budgetAmount || 0);
      dedupByMonthAndCategory.set(key, next);
    });

    // Step 3: Group by category from de-duplicated budgets
    const budgetMap = {};
    budgets.forEach((b) => {
      const category = b.category;
      if (!budgetMap[b.category]) {
        budgetMap[b.category] = {
          month: 'range',
          category: category,
          budgeted: 0,
          actual: 0
        };
      }
      budgetMap[category].budgeted += b.budgetAmount;
    });

    // Step 4: Fetch all EXPENSE transactions by category with date filtering
    const transactionQuery = { userId: userObjectId, type: 'expense' };
    if (startDate || endDate) {
      transactionQuery.date = {};
      if (startDate) transactionQuery.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        transactionQuery.date.$lt = end;
      }
    }
    const transactions = await Transaction.find(transactionQuery);

    transactions.forEach((tx) => {
      const cat = tx.category;
      if (budgetMap[cat]) {
        budgetMap[cat].actual += tx.amount;
      }
    });

    // Step 5: Calculate variance
    const analysis = Object.values(budgetMap).map((b) => ({
      month: b.month,
      category: b.category,
      budgeted: b.budgeted,
      actual: b.actual,
      variance: b.budgeted - b.actual
    }));

    res.json({ success: true, analysis });
  } catch (err) {
    console.error('❌ Budget analysis error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch analysis' });
  }
};

// ✅ Get Budget Utilization Percentage
export const getBudgetUtilization = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, category } = req.query;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Build query
    const budgetQuery = { userId: userObjectId };
    const transactionQuery = { userId: userObjectId, type: 'expense' };
    
    if (month) {
      // Handle both month names (like "January") and month keys (like "2024-01")
      if (month.includes('-')) {
        // Month key format (2024-01)
        budgetQuery.month = month;
        const [year, monthNum] = month.split('-');
        if (year && monthNum) {
          transactionQuery.date = {
            $gte: new Date(parseInt(year), parseInt(monthNum) - 1, 1),
            $lt: new Date(parseInt(year), parseInt(monthNum), 1)
          };
        }
      } else {
        // Month name format (January)
        budgetQuery.month = month;
        // For month names, we need to determine the year from the date range or use current year
        const currentYear = new Date().getFullYear();
        const monthIndex = new Date(`${month} 1, ${currentYear}`).getMonth();
        transactionQuery.date = {
          $gte: new Date(currentYear, monthIndex, 1),
          $lt: new Date(currentYear, monthIndex + 1, 1)
        };
      }
    }
    
    if (category) {
      budgetQuery.category = category;
      transactionQuery.category = category;
    }

    // Get budgets and de-duplicate overlapping month formats
    let budgetsRaw = await Budget.find(budgetQuery);
    const dedupedMapUtil = dedupeBudgetsByMonthAndCategory(budgetsRaw);
    const budgets = Array.from(dedupedMapUtil.entries()).map(([key, amount]) => {
      const [monthKey, cat] = key.split('|');
      return { month: monthKey, category: cat, budgetAmount: amount };
    });
    
    // Get actual expenses
    const transactions = await Transaction.find(transactionQuery);

    // Calculate totals
    const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.budgetAmount, 0);
    const totalActual = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    // Calculate utilization percentage
    const utilizationPercentage = totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0;
    const remainingBudget = totalBudgeted - totalActual;
    const isOverBudget = totalActual > totalBudgeted;

    // Category-wise breakdown
    const categoryBreakdown = {};
    
    budgets.forEach(budget => {
      const cat = budget.category;
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = {
          category: cat,
          budgeted: 0,
          actual: 0,
          utilization: 0,
          remaining: 0,
          isOverBudget: false
        };
      }
      categoryBreakdown[cat].budgeted += budget.budgetAmount;
    });

    transactions.forEach(tx => {
      const cat = tx.category;
      if (categoryBreakdown[cat]) {
        categoryBreakdown[cat].actual += tx.amount;
      }
    });

    // Calculate category utilization
    Object.values(categoryBreakdown).forEach(cat => {
      cat.utilization = cat.budgeted > 0 ? (cat.actual / cat.budgeted) * 100 : 0;
      cat.remaining = cat.budgeted - cat.actual;
      cat.isOverBudget = cat.actual > cat.budgeted;
    });

    const result = {
      success: true,
      overall: {
        totalBudgeted,
        totalActual,
        utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
        remainingBudget,
        isOverBudget
      },
      byCategory: Object.values(categoryBreakdown),
      period: month || 'All Time'
    };

    res.json(result);
  } catch (err) {
    console.error('❌ Budget utilization error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to calculate budget utilization' 
    });
  }
};

// ✅ Get Enhanced Budget Analysis with Variance
export const getEnhancedBudgetAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, category, startDate, endDate } = req.query;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Build queries
    const budgetQuery = { userId: userObjectId };
    const transactionQuery = { userId: userObjectId, type: 'expense' };
    
    if (month) {
      // Handle both month names (like "January") and month keys (like "2024-01")
      if (month.includes('-')) {
        // Month key format (2024-01)
        budgetQuery.month = month;
        const [year, monthNum] = month.split('-');
        if (year && monthNum) {
          transactionQuery.date = {
            $gte: new Date(parseInt(year), parseInt(monthNum) - 1, 1),
            $lt: new Date(parseInt(year), parseInt(monthNum), 1)
          };
        }
      } else {
        // Month name format (January)
        budgetQuery.month = month;
        // For month names, we need to determine the year from the date range or use current year
        const currentYear = new Date().getFullYear();
        const monthIndex = new Date(`${month} 1, ${currentYear}`).getMonth();
        transactionQuery.date = {
          $gte: new Date(currentYear, monthIndex, 1),
          $lt: new Date(currentYear, monthIndex + 1, 1)
        };
      }
    } else if (startDate || endDate) {
      // Date range filtering for transactions only
      transactionQuery.date = {};
      if (startDate) transactionQuery.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        transactionQuery.date.$lt = end;
      }
    }
    
    if (category) {
      budgetQuery.category = category;
      transactionQuery.category = category;
    }

    // Get budgets and transactions (with de-duplication of month formats)
    let budgetsRaw = await Budget.find(budgetQuery);
    const dedupedMapEA = dedupeBudgetsByMonthAndCategory(budgetsRaw, startDate, endDate);
    const budgets = Array.from(dedupedMapEA.entries()).map(([key, amount]) => {
      const [monthKey, cat] = key.split('|');
      return { month: monthKey, category: cat, budgetAmount: amount };
    });
    const transactions = await Transaction.find(transactionQuery);

    // Calculate totals
    const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.budgetAmount, 0);
    const totalActual = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    // Calculate variance metrics
    const variance = totalBudgeted - totalActual;
    const variancePercentage = totalBudgeted > 0 ? (variance / totalBudgeted) * 100 : 0;
    const utilizationPercentage = totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0;
    const isOverBudget = totalActual > totalBudgeted;

    // Category-wise breakdown with enhanced metrics
    const categoryBreakdown = {};
    
    budgets.forEach(budget => {
      const cat = budget.category;
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = {
          category: cat,
          budgeted: 0,
          actual: 0,
          variance: 0,
          variancePercentage: 0,
          utilization: 0,
          remaining: 0,
          isOverBudget: false,
          performance: 'On Track'
        };
      }
      categoryBreakdown[cat].budgeted += budget.budgetAmount;
    });

    transactions.forEach(tx => {
      const cat = tx.category;
      if (categoryBreakdown[cat]) {
        categoryBreakdown[cat].actual += tx.amount;
      }
    });

    // Calculate category performance metrics
    Object.values(categoryBreakdown).forEach(cat => {
      cat.variance = cat.budgeted - cat.actual;
      cat.variancePercentage = cat.budgeted > 0 ? (cat.variance / cat.budgeted) * 100 : 0;
      cat.utilization = cat.budgeted > 0 ? (cat.actual / cat.budgeted) * 100 : 0;
      cat.remaining = cat.budgeted - cat.actual;
      cat.isOverBudget = cat.actual > cat.budgeted;
      
      // Performance rating
      if (cat.utilization <= 80) {
        cat.performance = 'Excellent';
      } else if (cat.utilization <= 100) {
        cat.performance = 'On Track';
      } else if (cat.utilization <= 120) {
        cat.performance = 'Warning';
      } else {
        cat.performance = 'Critical';
      }
    });

    // Calculate budget efficiency score
    const efficiencyScore = Math.max(0, 100 - Math.abs(variancePercentage));
    const budgetHealth = efficiencyScore >= 80 ? 'Excellent' : 
                        efficiencyScore >= 60 ? 'Good' : 
                        efficiencyScore >= 40 ? 'Fair' : 'Poor';

    // Get top performing and underperforming categories
    const sortedCategories = Object.values(categoryBreakdown)
      .sort((a, b) => Math.abs(b.variancePercentage) - Math.abs(a.variancePercentage));

    const topPerformers = sortedCategories
      .filter(cat => cat.variance >= 0)
      .slice(0, 3);
    
    const underPerformers = sortedCategories
      .filter(cat => cat.variance < 0)
      .slice(0, 3);

    const result = {
      success: true,
      overall: {
        totalBudgeted: Math.round(totalBudgeted * 100) / 100,
        totalActual: Math.round(totalActual * 100) / 100,
        variance: Math.round(variance * 100) / 100,
        variancePercentage: Math.round(variancePercentage * 100) / 100,
        utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
        remainingBudget: Math.round(Math.max(0, variance) * 100) / 100,
        isOverBudget,
        efficiencyScore: Math.round(efficiencyScore * 100) / 100,
        budgetHealth
      },
      byCategory: Object.values(categoryBreakdown),
      topPerformers,
      underPerformers,
      period: month || (startDate && endDate ? `${startDate} to ${endDate}` : 'All Time'),
      totalCategories: Object.keys(categoryBreakdown).length
    };

    res.json(result);
  } catch (err) {
    console.error('❌ Enhanced budget analysis error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch enhanced budget analysis' 
    });
  }
};

// ✅ Get Budget Performance Metrics
export const getBudgetPerformanceMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { months = 6, startDate, endDate } = req.query;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    let startDateObj, endDateObj;
    
    if (startDate && endDate) {
      // Use provided date range
      startDateObj = new Date(startDate);
      endDateObj = new Date(endDate);
    } else {
      // Use last N months
      endDateObj = new Date();
      startDateObj = new Date();
      startDateObj.setMonth(startDateObj.getMonth() - parseInt(months));
    }

    // Get monthly budget performance
    const monthlyPerformance = [];
    
    // Calculate months between start and end date
    const monthDiff = (endDateObj.getFullYear() - startDateObj.getFullYear()) * 12 + 
                     (endDateObj.getMonth() - startDateObj.getMonth()) + 1;
    
    for (let i = 0; i < monthDiff; i++) {
      const currentDate = new Date(startDateObj);
      currentDate.setMonth(startDateObj.getMonth() + i);
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const monthName = currentDate.toLocaleString('default', { month: 'long' });
      
      // Get budget for this month (try both month key and month name)
      const monthBudgetsRaw = await Budget.find({ 
        userId: userObjectId, 
        $or: [
          { month: monthKey },
          { month: monthName }
        ]
      });
      // De-duplicate budgets by category within the month to avoid double counting
      const perCategoryBudget = new Map();
      for (const b of monthBudgetsRaw) {
        const prev = perCategoryBudget.get(b.category) || 0;
        perCategoryBudget.set(b.category, Math.max(prev, b.budgetAmount || 0));
      }
      
      // Get transactions for this month
      const monthTransactions = await Transaction.find({
        userId: userObjectId,
        type: 'expense',
        date: {
          $gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
          $lt: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
        }
      });

      const totalBudgeted = Array.from(perCategoryBudget.values()).reduce((sum, v) => sum + v, 0);
      const totalActual = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
      const variance = totalBudgeted - totalActual;
      const utilization = totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0;

      // Only add months that have data or are within the last 12 months
      if (totalBudgeted > 0 || totalActual > 0 || i < 12) {
        monthlyPerformance.push({
          month: monthKey,
          monthName: currentDate.toLocaleString('default', { month: 'long' }),
          year: currentDate.getFullYear(),
          budgeted: Math.round(totalBudgeted * 100) / 100,
          actual: Math.round(totalActual * 100) / 100,
          variance: Math.round(variance * 100) / 100,
          utilization: Math.round(utilization * 100) / 100,
          isOverBudget: totalActual > totalBudgeted
        });
      }
    }

    // Calculate performance trends
    const totalBudgeted = monthlyPerformance.reduce((sum, m) => sum + m.budgeted, 0);
    const totalActual = monthlyPerformance.reduce((sum, m) => sum + m.actual, 0);
    const overallVariance = totalBudgeted - totalActual;
    const overallUtilization = totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0;

    // Trend analysis
    const utilizationTrend = monthlyPerformance.map((m, i) => ({
      month: m.month,
      utilization: m.utilization,
      trend: i > 0 ? m.utilization - monthlyPerformance[i-1].utilization : 0
    }));

    const result = {
      success: true,
      period: `${months} months`,
      overall: {
        totalBudgeted: Math.round(totalBudgeted * 100) / 100,
        totalActual: Math.round(totalActual * 100) / 100,
        variance: Math.round(overallVariance * 100) / 100,
        utilization: Math.round(overallUtilization * 100) / 100,
        averageMonthlyBudget: Math.round(totalBudgeted / parseInt(months) * 100) / 100,
        averageMonthlyActual: Math.round(totalActual / parseInt(months) * 100) / 100
      },
      monthlyPerformance,
      utilizationTrend,
      performanceInsights: {
        bestMonth: monthlyPerformance.reduce((best, current) => 
          current.utilization < best.utilization ? current : best
        ),
        worstMonth: monthlyPerformance.reduce((worst, current) => 
          current.utilization > worst.utilization ? current : worst
        ),
        trendDirection: utilizationTrend[utilizationTrend.length - 1]?.trend > 0 ? 'Increasing' : 'Decreasing'
      }
    };

    res.json(result);
  } catch (err) {
    console.error('❌ Budget performance metrics error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch budget performance metrics' 
    });
  }
};
