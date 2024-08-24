import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import LogoutButton from "../Auth/LogoutButton";

function Header() {
  const { theme, toggleTheme } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in (e.g., by checking for a token in localStorage)
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    // Implement logout logic here
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/login');
  };

  return (
    <header className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6 md:justify-start md:space-x-10">
          <div className="flex justify-start lg:w-0 lg:flex-1">
            <Link to="/">
              <span className="sr-only">REGAI</span>
              <img
                className="h-8 w-auto sm:h-10"
                src="/images/logo-no-background.png"
                alt="REGAI Logo"
              />
            </Link>
          </div>
          <nav className="hidden md:flex space-x-10">
            <Link to="/" className={`text-base font-medium ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
              Dashboard
            </Link>
            <Link to="/knowledge-base" className={`text-base font-medium ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
              Knowledge Base
            </Link>
          </nav>
          <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
            {isLoggedIn ? (
              <>
                <LogoutButton></LogoutButton>
                <button onClick={toggleTheme} className="ml-8 text-base font-medium text-gray-500 hover:text-gray-900">
                  {theme === 'dark' ? '☀️' : '🌙'}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={`whitespace-nowrap text-base font-medium ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                  Sign in
                </Link>
                <Link to="/signup" className="ml-8 whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;