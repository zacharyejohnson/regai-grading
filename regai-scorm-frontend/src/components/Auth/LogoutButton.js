// components/Auth/LogoutButton.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout/', { refresh_token: refreshToken });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  return (
    <button onClick={handleLogout} className="text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
      Logout
    </button>
  );
};

export default LogoutButton;