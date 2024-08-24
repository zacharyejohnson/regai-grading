// AssignmentGrid.js
import React from 'react';
import { motion } from 'framer-motion';
import LoadingSpinner from '../LoadingSpinner';
import truncateText from "../utils/truncateText";

const AssignmentGrid = ({ assignments, onSelect, loading }) => {
  if (loading) return <LoadingSpinner />;

  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-20">
        <p>No assignments available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {assignments.map((assignment) => (
        <motion.div
          key={assignment.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer"
          onClick={() => onSelect(assignment)}
        >
          <h2 className="text-xl font-semibold mb-2">{assignment.title}</h2>
          <p className="text-gray-600 text-sm mb-4">{truncateText(assignment.description, 30)}</p>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Created: {new Date(assignment.created_at).toLocaleDateString()}</span>
            <span>{assignment.submissions?.length || 0} submissions</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default AssignmentGrid;