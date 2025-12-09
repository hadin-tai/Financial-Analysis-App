import axios from './axios';

export const fetchTransactions = async () => {
  const token = localStorage.getItem('token');
  const res = await axios.get('/transactions', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data?.transactions || [];
};

export const fetchTransactionSummary = async (params = {}) => {
  const token = localStorage.getItem('token');
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
  );
  const query = new URLSearchParams(filtered).toString();
  const res = await axios.get(`/summary${query ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data?.summary || {
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    upcomingPayments: 0,
    topCategory: null,
  };
};

// Expense distribution by category (for Pie chart)
export const fetchExpenseDistribution = async (params = {}) => {
  const token = localStorage.getItem('token');
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
  );
  const query = new URLSearchParams(filtered).toString();
  const res = await axios.get(`/summary/expense-distribution${query ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data || { success: false, chartData: [] };
};

// Cash flow trends over time (income vs expense and net)
export const fetchCashFlowTrends = async (params = {}) => {
  const token = localStorage.getItem('token');
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
  );
  const query = new URLSearchParams(filtered).toString();
  const res = await axios.get(`/cashflow${query ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data || { success: false, cashFlowTrends: [], period: 'monthly' };
};

export const fetchTransactionsPaginated = async (page=1, limit=10) => {
  const token = localStorage.getItem('token');
  const res = await axios.get(`/transactions?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return {
    items: res.data?.transactions || [],
    page: res.data?.page || page,
    totalPages: res.data?.totalPages || 1,
  };
};

export const deleteTransactionById = async (id) => {
  const token = localStorage.getItem('token');
  await axios.delete(`/transaction/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('transactions:changed'));
    window.dispatchEvent(new Event('app:data:changed'));
  }
};

export const updateTransactionById = async (id, payload) => {
  const token = localStorage.getItem('token');
  const res = await axios.put(`/transaction/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const tx = res.data?.data?.transaction || null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('transactions:changed'));
    window.dispatchEvent(new Event('app:data:changed'));
  }
  return tx;
};