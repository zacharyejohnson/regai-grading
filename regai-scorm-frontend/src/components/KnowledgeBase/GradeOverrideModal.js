// components/GradeOverrideModal.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XIcon } from '@heroicons/react/solid';
import { updateKnowledgeBaseItem } from '../utils/knowledgeBaseApi';

function GradeOverrideModal({ grade, rubric, onClose, onOverride }) {
  const [overrideScores, setOverrideScores] = useState(grade.content.category_scores);

  const handleScoreChange = (index, newScore) => {
    const updatedScores = [...overrideScores];
    updatedScores[index].score = parseFloat(newScore);
    setOverrideScores(updatedScores);
  };

  const handleOverride = async () => {
    try {
      const updatedGrade = {
        ...grade,
        content: {
          ...grade.content,
          category_scores: overrideScores,
          is_override: true,
        },
      };

      const response = await updateKnowledgeBaseItem('grade', grade.id, updatedGrade);
      onOverride(response);
      onClose();
    } catch (error) {
      console.error('Error overriding grade:', error);
      // Handle error (e.g., show error message to user)
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center"
    >
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Override Grade</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        {overrideScores.map((categoryScore, index) => (
          <div key={index} className="mb-4">
            <label className="block text-sm font-medium text-gray-700">{categoryScore.name}</label>
            <input
              type="number"
              min="0"
              max={rubric.categories.find(c => c.name === categoryScore.name).scoring_levels.length}
              step="0.1"
              value={categoryScore.score}
              onChange={(e) => handleScoreChange(index, e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        ))}
        <div className="mt-6 flex justify-end">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOverride}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            Submit Override
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default GradeOverrideModal;