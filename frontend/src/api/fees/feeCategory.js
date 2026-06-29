import api from '../../config/api';

export const getFeeCategories = async () => {
  const response = await api.get('/api/v1/fee-categories');
  return response.data;
};

export const createFeeCategory = async (data) => {
  const response = await api.post('/api/v1/fee-categories', data);
  return response.data;
};

export const updateFeeCategory = async (id, data) => {
  const response = await api.put(`/api/v1/fee-categories/${id}`, data);
  return response.data;
};

export const deleteFeeCategory = async (id) => {
  const response = await api.delete(`/api/v1/fee-categories/${id}`);
  return response.data;
};
