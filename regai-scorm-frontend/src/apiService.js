// apiService.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

const apiService = axios.create({
  baseURL: API_BASE_URL,
});

apiService.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const handleResponse = (response) => response.data;
const handleError = (error) => {
  console.error('API call error:', error);
  throw error;
};

const apiEndpoints = {
  config: {
    getAssignmentId: () => apiService.get('/config/assignment-id').then(handleResponse).catch(handleError),
  },
  assignments: {
    get: (id) => apiService.get(`/assignments/${id}/`).then(handleResponse).catch(handleError),
    getStatus: (id) => apiService.get(`/assignments/${id}/status/`).then(handleResponse).catch(handleError),
    create: (formData) => apiService.post('/assignments/', formData).then(handleResponse).catch(handleError),
  },
  submissions: {
    create: (data) => apiService.post('/submissions/', data).then(handleResponse).catch(handleError),
    getScormData: (id) => apiService.get(`/submissions/${id}/scorm_data/`).then(handleResponse).catch(handleError),
    updateScormData: (id, data) => apiService.post(`/submissions/${id}/update_scorm_data/`, data).then(handleResponse).catch(handleError),
  },
  scormAPI: {
    initialize: (assignmentId, submissionId) => apiService.post('/scorm-api/LMSInitialize/', { assignment_id: assignmentId, submission_id: submissionId }).then(handleResponse).catch(handleError),
    finish: (assignmentId, submissionId) => apiService.post('/scorm-api/LMSFinish/', { assignment_id: assignmentId, submission_id: submissionId }).then(handleResponse).catch(handleError),
    getValue: (assignmentId, submissionId, element) => apiService.post('/scorm-api/LMSGetValue/', { assignment_id: assignmentId, submission_id: submissionId, element }).then(handleResponse).catch(handleError),
    setValue: (assignmentId, submissionId, element, value) => apiService.post('/scorm-api/LMSSetValue/', { assignment_id: assignmentId, submission_id: submissionId, element, value }).then(handleResponse).catch(handleError),
    commit: (assignmentId, submissionId) => apiService.post('/scorm-api/LMSCommit/', { assignment_id: assignmentId, submission_id: submissionId }).then(handleResponse).catch(handleError),
    getLastError: () => apiService.post('/scorm-api/LMSGetLastError/').then(handleResponse).catch(handleError),
    getErrorString: (errorCode) => apiService.post('/scorm-api/LMSGetErrorString/', { error_code: errorCode }).then(handleResponse).catch(handleError),
    getDiagnostic: (errorCode) => apiService.post('/scorm-api/LMSGetDiagnostic/', { error_code: errorCode }).then(handleResponse).catch(handleError),
    getVersion: () => apiService.post('/scorm-api/LMSGetVersion/').then(handleResponse).catch(handleError),
    setStatus: (assignmentId, submissionId, status) => apiService.post('/scorm-api/LMSSetStatus/', { assignment_id: assignmentId, submission_id: submissionId, status }).then(handleResponse).catch(handleError),
    getEntry: (assignmentId, submissionId) => apiService.post('/scorm-api/LMSGetEntry/', { assignment_id: assignmentId, submission_id: submissionId }).then(handleResponse).catch(handleError),
  },
};

export default apiEndpoints;