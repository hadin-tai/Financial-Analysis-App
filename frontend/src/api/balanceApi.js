import axios from './axios';

export const fetchBalancesPaginated = async (page=1, limit=10) => {
  const token = localStorage.getItem('token');
  const res = await axios.get(`/balances?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return {
    items: res.data?.items || res.data?.balances || [],
    page: res.data?.page || page,
    totalPages: res.data?.totalPages || 1,
  };
};

export const updateBalanceById = async (id, payload) => {
  const token = localStorage.getItem('token');
  const res = await axios.put(`/balances/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const bal = res.data?.balance || null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('balances:changed'));
    window.dispatchEvent(new Event('app:data:changed'));
  }
  return bal;
};

export const deleteBalanceById = async (id) => {
  const token = localStorage.getItem('token');
  await axios.delete(`/balances/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('balances:changed'));
    window.dispatchEvent(new Event('app:data:changed'));
  }
  return true;
};

export const fetchFinancialHealth = async (params = {}) => {
  const token = localStorage.getItem('token');
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
  );
  const query = new URLSearchParams(filtered).toString();
  const res = await axios.get(`/balance-metrics/health-score${query ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const fetchAssetsVsLiabilities = async (params = {}) => {
  const token = localStorage.getItem('token');
  const filtered = Object.fromEntries(
    Object.entries({ groupBy: 'monthly', ...params }).filter(([, v]) => v !== null && v !== undefined && v !== '')
  );
  const query = new URLSearchParams(filtered).toString();
  const res = await axios.get(`/balance-metrics/comparison${query ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data || { success: false, chartData: [], summary: {} };
};