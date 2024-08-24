// components/Grading/CritiqueDisplay.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XIcon } from '@heroicons/react/solid';

function CritiqueDisplay({ critique, onUpdate, onClose }) {
  console.log("Critique in CritiqueDisplay:", critique);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCritique, setEditedCritique] = useState(critique);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdate(editedCritique);
    setIsEditing(false);
  };

  const handleChange = (e) => {
    setEditedCritique({ ...editedCritique, overall_assessment: e.target.value });
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
          <h2 className="text-2xl font-bold">AI Critique</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        {isEditing ? (
          <div>
            <textarea
              value={editedCritique.overall_assessment}
              onChange={handleChange}
              className="w-full p-2 border rounded h-40"
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
            <p className="text-gray-700">{critique.overall_assessment}</p>
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

export default CritiqueDisplay;