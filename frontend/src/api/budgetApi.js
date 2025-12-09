import axios from './axios';

export const fetchBudgetsPaginated = async (page=1, limit=10) => {
  const token = localStorage.getItem('token');
  const res = await axios.get(`/budgets?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return {
    items: res.data?.items || res.data?.budgets || [],
    page: res.data?.page || page,
    totalPages: res.data?.totalPages || 1,
  };
};

export const updateBudgetById = async (id, payload) => {
  const token = localStorage.getItem('token');
  const res = await axios.put(`/budgets/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const budget = res.data?.budget || null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('budgets:changed'));
    window.dispatchEvent(new Event('app:data:changed'));
  }
  return budget;
};

export const deleteBudgetById = async (id) => {
  const token = localStorage.getItem('token');
  await axios.delete(`/budgets/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('budgets:changed'));
    window.dispatchEvent(new Event('app:data:changed'));
  }
  return true;
};

const filterParams = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
);

export const fetchBudgetVsActualByCategory = async (params = {}) => {
  const token = localStorage.getItem('token');
  const query = new URLSearchParams(filterParams(params)).toString();
  const res = await axios.get(`/budget-analysis/enhanced${query ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data || { success: false, byCategory: [] };
};

export const fetchBudgetPerformanceOverTime = async (params = {}) => {
  const token = localStorage.getItem('token');
  const query = new URLSearchParams(filterParams(params)).toString();
  const res = await axios.get(`/budget-analysis/performance${query ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data || { success: false, monthlyPerformance: [] };
};

export const fetchBudgetAllocationPie = async (params = {}) => {
  // reuse enhanced endpoint and map to allocation
  const data = await fetchBudgetVsActualByCategory(params);
  const allocation = (data?.byCategory || []).map(c => ({
    category: c.category,
    budgeted: c.budgeted,
  }));
  return allocation;
};