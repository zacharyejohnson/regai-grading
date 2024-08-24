import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-white shadow">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="w-full py-6 flex items-center justify-between border-b border-indigo-500 lg:border-none">
          <div className="flex items-center">
            <Link to="/">
              <span className="sr-only">Your Company</span>
              <img
                className="h-10 w-auto"
                src="/assets/logo-no-background.png"
                alt="Your Company Logo"
              />
            </Link>
          </div>
          <div className="ml-10 space-x-4">
            <Link
              to="/how-it-works"
              className="inline-block bg-indigo-500 py-2 px-4 border border-transparent rounded-md text-base font-medium text-white hover:bg-opacity-75"
            >
              How It Works
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;