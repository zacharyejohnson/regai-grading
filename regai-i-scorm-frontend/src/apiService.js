import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
const ASSIGNMENT_ID = process.env.REACT_APP_ASSIGNMENT_ID || '1'; // Default to '1' if not set

const apiService = axios.create({
  baseURL: API_BASE_URL,
});

const handleResponse = (response) => response.data;
const handleError = (error) => {
  console.error('API call error:', error);
  throw error;
};

const apiEndpoints = {
  scormAssignment: {
    get: () => apiService.get(`/scorm/assignments/${ASSIGNMENT_ID}/`).then(handleResponse).catch(handleError),
    submit: (data) => apiService.post(`/scorm/assignments/${ASSIGNMENT_ID}/submit/`, data).then(handleResponse).catch(handleError),
    getScormData: () => apiService.get(`/scorm/assignments/${ASSIGNMENT_ID}/scorm_data/`).then(handleResponse).catch(handleError),
    updateScormData: (data) => apiService.post(`/scorm/assignments/${ASSIGNMENT_ID}/scorm_data/`, data).then(handleResponse).catch(handleError),
  },
};

export default apiEndpoints;