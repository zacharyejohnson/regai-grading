import React from 'react';
import { motion } from 'framer-motion';

const GradeDisplay = ({ categoryScores, onClose }) => {
  const calculateOverallScore = () => {
    if (!categoryScores || categoryScores.length === 0) return 0;
    const totalScore = categoryScores.reduce((sum, category) => sum + (parseFloat(category.score) || 0), 0);
    return (totalScore / categoryScores.length).toFixed(2);
  };

  const overallScore = calculateOverallScore();
  const percentageScore = (overallScore * 100 / 6).toFixed(2);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-hidden h-full w-full flex justify-center items-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Your Grade</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6 bg-indigo-100 p-4 rounded-lg text-center">
          <div className="text-5xl font-bold text-indigo-600">{percentageScore}%</div>
          <div className="text-indigo-700 mt-1">Overall Score: {overallScore}/6</div>
        </div>

        {categoryScores.map((category, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
            <div className="mb-2">
              <span className="block text-sm font-medium text-gray-700">Score: {category.score}/6</span>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-1">Justification:</span>
              <p className="text-gray-600 whitespace-pre-wrap">{category.justification}</p>
            </div>
          </div>
        ))}

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GradeDisplay;