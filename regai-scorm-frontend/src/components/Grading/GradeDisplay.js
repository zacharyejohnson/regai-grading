// components/Grading/GradeDisplay.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XIcon } from '@heroicons/react/solid';

function GradeDisplay({ grade, onUpdate, onClose }) {
  console.log("Grade in GradeDisplay:", grade);
  const [isEditing, setIsEditing] = useState(false);
  const [editedGrade, setEditedGrade] = useState(grade);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdate(editedGrade);
    setIsEditing(false);
  };

  const handleChange = (e) => {
    setEditedGrade({ ...editedGrade, overall_score: parseFloat(e.target.value) });
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
          <h2 className="text-2xl font-bold">Grade</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        {isEditing ? (
          <div>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={editedGrade.overall_score}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Save
            </motion.button>
          </div>
        ) : (
          <div>
            <p className="text-4xl font-bold text-blue-600">{(grade.overall_score * 100).toFixed(2)}%</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEdit}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Edit
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default GradeDisplay;