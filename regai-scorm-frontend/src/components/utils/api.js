// utils/api.js
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';  // Changed this line

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

api.interceptors.request.use(
  async (config) => {
    let token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decodedToken.exp < currentTime) {
          // Token has expired, try to refresh
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, { refresh: refreshToken });
            localStorage.setItem('token', response.data.access);
            token = response.data.access;
          } catch (error) {
            // Refresh failed, redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(error);
          }
        }
        config.headers['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Error decoding token:', error);
        // Invalid token, clear it and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If we receive a 401 response, clear the token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;