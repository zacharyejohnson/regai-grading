import React from 'react';
import Button from '../Common/Button';

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex justify-center">
      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
        {[...Array(totalPages).keys()].map((page) => (
          <Button
            key={page + 1}
            onClick={() => onPageChange(page + 1)}
            variant={currentPage === page + 1 ? 'primary' : 'secondary'}
            className="relative inline-flex items-center px-4 py-2 border text-sm font-medium"
          >
            {page + 1}
          </Button>
        ))}
      </nav>
    </div>
  );
}

export default Pagination;