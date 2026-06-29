import api from '../../config/api';

export const getScholarships = async () => {
  const response = await api.get('/api/v1/scholarships');
  return response.data;
};

export const createScholarship = async (data) => {
  const response = await api.post('/api/v1/scholarships', data);
  return response.data;
};

export const getScholarshipPostings = async (params) => {
  const response = await api.get('/api/v1/scholarship-postings', { params });
  return response.data;
};

export const createScholarshipPosting = async (data) => {
  const response = await api.post('/api/v1/scholarship-postings', data);
  return response.data;
};
