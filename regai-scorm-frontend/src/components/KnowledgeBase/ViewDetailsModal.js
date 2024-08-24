// ViewDetailsModal.js
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, PencilIcon, CheckIcon } from '@heroicons/react/solid';
import RubricEditModal from "../Rubric/RubricEditModal";
import GradeDisplay from "../Grading/GradeDisplay";
import CritiqueDisplay from "../Grading/CritiqueDisplay";
import RubricDisplay from "../Rubric/RubricDisplay";

function ViewDetailsModal({ item, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = (updatedItem) => {
    onUpdate(updatedItem);
    setIsEditing(false);
  };

  const renderContent = () => {
    switch (item.item_type) {
      case 'rubric':
        return (
          <RubricEditModal
            rubric={item.content}
            onSave={(updatedRubric) => handleSave({ ...item, content: updatedRubric })}
            onClose={() => setIsEditing(false)}
          /> );
      case 'grade':
        return <GradeDisplay grade={item.content} />;
      case 'critique':
        return <CritiqueDisplay critique={item.content} />;
      default:
        return <p>Unknown item type</p>;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1)} Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition duration-150 ease-in-out"
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="mb-4 bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600"><span className="font-semibold">ID:</span> {item.id}</p>
            <p className="text-sm text-gray-600"><span className="font-semibold">Created:</span> {new Date(item.created_at).toLocaleString()}</p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Status:</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                item.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {item.status}
              </span>
            </p>
          </div>
          {renderContent()}
          <div className="mt-6 flex justify-end space-x-4">
            {!isEditing && item.item_type === 'rubric' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEdit}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center transition duration-150 ease-in-out"
              >
                <PencilIcon className="h-5 w-5 mr-2" />
                Edit Rubric
              </motion.button>
            )}
            {item.status === 'pending' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onUpdate({ ...item, status: 'approved' })}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center transition duration-150 ease-in-out"
              >
                <CheckIcon className="h-5 w-5 mr-2" />
                Approve
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ViewDetailsModal;