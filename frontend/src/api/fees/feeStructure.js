import api from '../../config/api';

export const getFeeStructures = async (params) => {
  const response = await api.get('/api/v1/fee-structures', { params });
  return response.data;
};

export const createFeeStructure = async (data) => {
  const response = await api.post('/api/v1/fee-structures', data);
  return response.data;
};

export const updateFeeStructure = async (id, data) => {
  const response = await api.put(`/api/v1/fee-structures/${id}`, data);
  return response.data;
};

export const deleteFeeStructure = async (id) => {
  const response = await api.delete(`/api/v1/fee-structures/${id}`);
  return response.data;
};

export const duplicateFeeStructure = async (data) => {
  const response = await api.post('/api/v1/fee-structures/duplicate', data);
  return response.data;
};
