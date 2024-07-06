import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="bg-white shadow">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="w-full py-6 flex items-center justify-between border-b border-indigo-500 lg:border-none">
          <div className="flex items-center">
            <Link to="/">
              <span className="sr-only">REGAI</span>
              <img className="h-10 w-auto" src="/logo.png" alt="REGAI Logo" />
            </Link>
            <div className="ml-10 space-x-8">
              <Link to="/" className="text-base font-medium text-gray-500 hover:text-gray-900">
                Dashboard
              </Link>
              <Link to="/knowledge-base" className="text-base font-medium text-gray-500 hover:text-gray-900">
                Knowledge Base
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;