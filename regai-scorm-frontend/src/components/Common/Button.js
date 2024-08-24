import React from 'react';

function Button({ children, onClick, type = 'button', variant = 'primary', fullWidth = false, className = '', disabled = false }) {
  const baseClasses = 'font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out';
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-300 hover:bg-gray-400 text-gray-800',
    danger: 'bg-red-500 hover:bg-red-700 text-white',
  };
  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${disabledClass} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button;