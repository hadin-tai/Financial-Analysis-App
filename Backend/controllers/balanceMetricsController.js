import BalanceSheet from '../models/BalanceSheet.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';

export const getBalanceMetrics = async (req, res) => {
  try {
    const userId = req.user.id;

    const balances = await BalanceSheet.find({ userId }).sort({ date: 1 });

    const metrics = balances.map((b) => ({
      _id: b._id,
      date: b.date,
      currentAssets: b.currentAssets,
      currentLiabilities: b.currentLiabilities,
      totalLiabilities: b.totalLiabilities,
      totalEquity: b.totalEquity,
      currentRatio: b.currentLiabilities === 0 ? null : b.currentAssets / b.currentLiabilities,
      debtEquityRatio: b.totalEquity === 0 ? null : b.totalLiabilities / b.totalEquity,
      netWorth: b.totalEquity
    }));

    res.json({ success: true, metrics });
  } catch (err) {
    console.error('❌ Balance metrics error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch balance metrics' });
  }
};

// ✅ Get Assets vs Liabilities Comparison Data
export const getAssetsVsLiabilities = async (req, res) => {
  try {
    const userId = req.user.id;
    const mongoose = (await import('mongoose')).default;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { startDate, endDate, groupBy = 'monthly' } = req.query;

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

    // Aggregate balance sheet data by time period
    // We calculate averages for assets/liabilities/ratios (for smoother bars),
    // and also capture the last snapshot in each period to compute net worth as of period-end.
    const balanceData = await BalanceSheet.aggregate([
      { $match: match },
      { $sort: { date: 1 } },
      {
        $group: {
          _id: groupByField,
          // Use last snapshot values for all metrics (matches user expectation)
          currentAssets: { $last: "$currentAssets" },
          currentLiabilities: { $last: "$currentLiabilities" },
          totalLiabilities: { $last: "$totalLiabilities" },
          totalEquity: { $last: "$totalEquity" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1 } }
    ]);

    // Format the data for charts
    const chartData = balanceData.map(item => {
      const period = groupBy === 'weekly' 
        ? `Week ${item._id.week}-${item._id.year}`
        : `${item._id.month}-${item._id.year}`;
      
      const periodNum = groupBy === 'weekly' ? item._id.week : item._id.month;
      const year = item._id.year;

      return {
        period,
        periodNum,
        year,
        // Use last snapshot values for all metrics
        currentAssets: Math.round(item.currentAssets * 100) / 100,
        currentLiabilities: Math.round(item.currentLiabilities * 100) / 100,
        totalLiabilities: Math.round(item.totalLiabilities * 100) / 100,
        totalEquity: Math.round(item.totalEquity * 100) / 100,
        // Net worth based on last snapshot per period
        netWorth: Math.round(((item.currentAssets || 0) - (item.totalLiabilities || 0)) * 100) / 100,
        currentRatio: item.currentLiabilities > 0 
          ? Math.round((item.currentAssets / item.currentLiabilities) * 100) / 100 
          : null,
        debtToEquityRatio: item.totalEquity > 0 
          ? Math.round((item.totalLiabilities / item.totalEquity) * 100) / 100 
          : null,
        recordCount: item.count
      };
    });

    // Calculate summary statistics
    const latest = chartData[chartData.length - 1];
    const summary = {
      latestPeriod: latest?.period || 'No data',
      totalAssets: latest?.currentAssets || 0,
      totalLiabilities: latest?.totalLiabilities || 0,
      netWorth: latest?.netWorth || 0,
      currentRatio: latest?.currentRatio || 0,
      debtToEquityRatio: latest?.debtToEquityRatio || 0
    };

    res.json({ 
      success: true, 
      groupBy,
      summary,
      chartData,
      totalPeriods: chartData.length
    });
  } catch (err) {
    console.error('❌ Assets vs Liabilities error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch assets vs liabilities data' 
    });
  }
};

// ✅ Get Financial Health Score
export const getFinancialHealthScore = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
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

    // Get latest balance sheet data
    const latestBalance = await BalanceSheet.findOne(match).sort({ date: -1 });
    
    // Get transaction data for the period
    const transactionMatch = { userId: userObjectId };
    if (startDate || endDate) {
      transactionMatch.date = {};
      if (startDate) transactionMatch.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        transactionMatch.date.$lt = end;
      }
    }

    const transactions = await Transaction.find(transactionMatch);
    
    // Get budget data for the period
    let budgets;
    if (startDate || endDate) {
      // For budget matching, we need to find budgets that fall within the date range
      // Since budgets are stored by month, we'll get all budgets and filter by date
      const allBudgets = await Budget.find({ userId: userObjectId });
      const filtered = allBudgets.filter(budget => {
        // Try to parse budget month and check if it falls within the date range
        let budgetDate;
        if (budget.month.includes('-')) {
          // Month key format (2025-06)
          const [year, month] = budget.month.split('-');
          budgetDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        } else {
          // Month name format (June) - assume current year
          const currentYear = new Date().getFullYear();
          budgetDate = new Date(`${budget.month} 1, ${currentYear}`);
        }
        return (!startDate || budgetDate >= new Date(startDate)) && 
               (!endDate || budgetDate <= new Date(endDate));
      });
      // Deduplicate overlapping month formats per (month, category) keeping max budgetAmount
      const map = new Map();
      const canonicalizeMonth = (m) => {
        if (!m) return 'unknown';
        if (m.includes('-')) return m;
        const baseYear = startDate ? new Date(startDate).getFullYear() : (endDate ? new Date(endDate).getFullYear() : new Date().getFullYear());
        const idx = new Date(`${m} 1, ${baseYear}`).getMonth();
        return `${baseYear}-${String(idx + 1).padStart(2, '0')}`;
      };
      for (const b of filtered) {
        const key = `${canonicalizeMonth(b.month)}|${b.category}`;
        const prev = map.get(key) || 0;
        map.set(key, Math.max(prev, b.budgetAmount || 0));
      }
      budgets = Array.from(map.entries()).map(([key, amount]) => {
        const [monthKey, category] = key.split('|');
        return { month: monthKey, category, budgetAmount: amount };
      });
    } else {
      const allBudgets = await Budget.find({ userId: userObjectId });
      const map = new Map();
      const canonicalizeMonth = (m) => {
        if (!m) return 'unknown';
        if (m.includes('-')) return m;
        const baseYear = new Date().getFullYear();
        const idx = new Date(`${m} 1, ${baseYear}`).getMonth();
        return `${baseYear}-${String(idx + 1).padStart(2, '0')}`;
      };
      for (const b of allBudgets) {
        const key = `${canonicalizeMonth(b.month)}|${b.category}`;
        const prev = map.get(key) || 0;
        map.set(key, Math.max(prev, b.budgetAmount || 0));
      }
      budgets = Array.from(map.entries()).map(([key, amount]) => {
        const [monthKey, category] = key.split('|');
        return { month: monthKey, category, budgetAmount: amount };
      });
    }

    // Calculate financial ratios and metrics
    let financialMetrics = {};
    
    if (latestBalance) {
      // Balance Sheet Metrics
      const currentRatio = latestBalance.currentLiabilities > 0 
        ? latestBalance.currentAssets / latestBalance.currentLiabilities 
        : 0;
      
      const debtToEquityRatio = latestBalance.totalEquity > 0 
        ? latestBalance.totalLiabilities / latestBalance.totalEquity 
        : 0;
      
      const netWorth = latestBalance.currentAssets - latestBalance.totalLiabilities;
      const workingCapital = latestBalance.currentAssets - latestBalance.currentLiabilities;
      
      financialMetrics = {
        currentRatio: Math.round(currentRatio * 100) / 100,
        debtToEquityRatio: Math.round(debtToEquityRatio * 100) / 100,
        netWorth: Math.round(netWorth * 100) / 100,
        workingCapital: Math.round(workingCapital * 100) / 100,
        totalAssets: latestBalance.currentAssets,
        totalLiabilities: latestBalance.totalLiabilities,
        totalEquity: latestBalance.totalEquity
      };
    }

    // Transaction-based metrics
    const totalIncome = transactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const totalExpense = transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const netIncome = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;
    
    // Budget performance metrics
    const totalBudgeted = budgets.reduce((sum, b) => sum + (b.budgetAmount || 0), 0);
    const budgetUtilization = totalBudgeted > 0 ? (totalExpense / totalBudgeted) * 100 : 0;
    const budgetVariance = totalBudgeted - totalExpense;
    
    // Calculate individual component scores (0-100)
    const scores = {
      // Liquidity Score (Current Ratio)
      liquidity: Math.min(100, Math.max(0, 
        latestBalance ? 
          (latestBalance.currentLiabilities > 0 ? 
            Math.min(100, (latestBalance.currentAssets / latestBalance.currentLiabilities) * 25) : 100) 
          : 50
      )),
      
      // Debt Management Score (Debt-to-Equity)
      debtManagement: Math.min(100, Math.max(0,
        latestBalance ? 
          (latestBalance.totalEquity > 0 ? 
            Math.max(0, 100 - (latestBalance.totalLiabilities / latestBalance.totalEquity) * 100) : 50)
          : 50
      )),
      
      // Savings Score
      savings: Math.min(100, Math.max(0, savingsRate * 2)), // 50% savings = 100 score
      
      // Budget Discipline Score
      budgetDiscipline: Math.min(100, Math.max(0,
        totalBudgeted > 0 ? 
          (totalExpense <= totalBudgeted ? 
            Math.max(0, 100 - budgetUtilization) : 
            Math.max(0, 100 - (budgetUtilization - 100) * 2)
          ) : 50
      )),
      
      // Income Stability Score (based on transaction frequency and amounts)
      incomeStability: transactions.filter(tx => tx.type === 'income').length > 0 ? 
        Math.min(100, Math.max(0, 100 - (Math.abs(netIncome) / Math.max(totalIncome, 1)) * 50)) : 50
    };

    // Calculate weighted composite score
    const weights = {
      liquidity: 0.25,        // 25% weight
      debtManagement: 0.25,   // 25% weight
      savings: 0.20,          // 20% weight
      budgetDiscipline: 0.20, // 20% weight
      incomeStability: 0.10   // 10% weight
    };

    const compositeScore = Object.keys(scores).reduce((total, key) => {
      return total + (scores[key] * weights[key]);
    }, 0);

    // Determine overall financial health grade
    let healthGrade, healthStatus, recommendations;
    
    if (compositeScore >= 90) {
      healthGrade = 'A+';
      healthStatus = 'Excellent';
      recommendations = [
        'Maintain current financial practices',
        'Consider investment opportunities',
        'Continue building emergency fund'
      ];
    } else if (compositeScore >= 80) {
      healthGrade = 'A';
      healthStatus = 'Very Good';
      recommendations = [
        'Focus on increasing savings rate',
        'Optimize budget allocation',
        'Consider debt reduction strategies'
      ];
    } else if (compositeScore >= 70) {
      healthGrade = 'B+';
      healthStatus = 'Good';
      recommendations = [
        'Improve budget discipline',
        'Increase emergency fund',
        'Review debt management'
      ];
    } else if (compositeScore >= 60) {
      healthGrade = 'B';
      healthStatus = 'Fair';
      recommendations = [
        'Reduce unnecessary expenses',
        'Create strict budget plan',
        'Focus on debt reduction'
      ];
    } else if (compositeScore >= 50) {
      healthGrade = 'C';
      healthStatus = 'Needs Improvement';
      recommendations = [
        'Emergency financial review needed',
        'Reduce debt immediately',
        'Seek financial counseling'
      ];
    } else {
      healthGrade = 'D';
      healthStatus = 'Critical';
      recommendations = [
        'Immediate financial intervention required',
        'Contact financial advisor',
        'Consider debt consolidation'
      ];
    }

    const result = {
      success: true,
      overall: {
        compositeScore: Math.round(compositeScore * 100) / 100,
        healthGrade,
        healthStatus,
        recommendations
      },
      componentScores: {
        liquidity: Math.round(scores.liquidity * 100) / 100,
        debtManagement: Math.round(scores.debtManagement * 100) / 100,
        savings: Math.round(scores.savings * 100) / 100,
        budgetDiscipline: Math.round(scores.budgetDiscipline * 100) / 100,
        incomeStability: Math.round(scores.incomeStability * 100) / 100
      },
      financialMetrics,
      transactionMetrics: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpense: Math.round(totalExpense * 100) / 100,
        netIncome: Math.round(netIncome * 100) / 100,
        savingsRate: Math.round(savingsRate * 100) / 100
      },
      budgetMetrics: {
        totalBudgeted: Math.round(totalBudgeted * 100) / 100,
        budgetUtilization: Math.round(budgetUtilization * 100) / 100,
        budgetVariance: Math.round(budgetVariance * 100) / 100
      },
      period: startDate && endDate ? `${startDate} to ${endDate}` : 'All Time',
      lastUpdated: latestBalance?.date || new Date()
    };

    res.json(result);
  } catch (err) {
    console.error('❌ Financial health score error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to calculate financial health score' 
    });
  }
};
