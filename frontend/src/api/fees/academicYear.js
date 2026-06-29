import api from '../../config/api';

export const getAcademicYears = async () => {
  const response = await api.get('/api/v1/academic-years');
  return response.data;
};

export const createAcademicYear = async (data) => {
  const response = await api.post('/api/v1/academic-years', data);
  return response.data;
};

export const activateAcademicYear = async (id) => {
  const response = await api.put(`/api/v1/academic-years/${id}/activate`);
  return response.data;
};

export const getTerms = async () => {
  const response = await api.get('/api/v1/terms');
  return response.data;
};
