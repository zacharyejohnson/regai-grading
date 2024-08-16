import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const fetchAssignment = async (assignmentId) => {
  try {
    const response = await api.get(`/assignments/${assignmentId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching assignment:', error);
    throw error;
  }
};

export const submitAssignment = async (assignmentId, submissionData) => {
  try {
    const response = await api.post(`/submissions/`, {
      assignment: assignmentId,
      ...submissionData
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting assignment:', error);
    throw error;
  }
};

export const updateScormData = async (submissionId, scormData) => {
  try {
    const response = await api.post(`/submissions/${submissionId}/update_scorm_data/`, scormData);
    return response.data;
  } catch (error) {
    console.error('Error updating SCORM data:', error);
    throw error;
  }
};

export default api;