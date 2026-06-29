import api from '../../config/api';

export const getFeesPendingReport = async (params) => {
  const response = await api.get('/api/v1/reports/fees-pending', { params });
  return response.data;
};

export const getFeesPaymentReport = async (params) => {
  const response = await api.get('/api/v1/reports/fees-payment', { params });
  return response.data;
};

export const getDailyCollectionReport = async (params) => {
  const response = await api.get('/api/v1/reports/fees-collection-daily', { params });
  return response.data;
};

export const getRangeCollectionReport = async (params) => {
  const response = await api.get('/api/v1/reports/fees-collection-range', { params });
  return response.data;
};

export const getScholarshipsReport = async (params) => {
  const response = await api.get('/api/v1/reports/scholarships', { params });
  return response.data;
};
