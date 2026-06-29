import api from '../../config/api';

export const getFeePaymentStudents = async (params) => {
  const response = await api.get('/api/v1/fee-payment/students', { params });
  return response.data;
};

export const getStudentTerms = async (studentId, params) => {
  const response = await api.get(`/api/v1/fee-payment/student/${studentId}/terms`, { params });
  return response.data;
};

export const getStudentFees = async (studentId, params) => {
  const response = await api.get(`/api/v1/fee-payment/student/${studentId}/fees`, { params });
  return response.data;
};

export const payFee = async (data) => {
  const response = await api.post('/api/v1/fee-payment/pay', data);
  return response.data;
};

export const getReceipt = async (receiptNo) => {
  const response = await api.get(`/api/v1/fee-payment/receipt/${receiptNo}`);
  return response.data;
};
