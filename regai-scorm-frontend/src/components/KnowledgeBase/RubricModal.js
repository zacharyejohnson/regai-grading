import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/solid';

const RubricModal = ({ rubric, onClose, onUpdate }) => {
  const [editedRubric, setEditedRubric] = useState(rubric.content);
  const [editingCell, setEditingCell] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (modalRef.current) {
      const height = window.innerHeight * 0.9;
      modalRef.current.style.maxHeight = `${height}px`;
    }
  }, []);

  const handleSave = () => {
  onUpdate({
    ...rubric,
    content: editedRubric,
    human_approved: true
  });
  onClose();
};

  const handleCategoryChange = (index, field, value) => {
    const newCategories = [...editedRubric.categories];
    newCategories[index] = { ...newCategories[index], [field]: value };
    setEditedRubric({ ...editedRubric, categories: newCategories });
  };

  const handleLevelChange = (categoryIndex, levelIndex, field, value) => {
    const newCategories = [...editedRubric.categories];
    newCategories[categoryIndex].scoring_levels[levelIndex] = {
      ...newCategories[categoryIndex].scoring_levels[levelIndex],
      [field]: value
    };
    setEditedRubric({ ...editedRubric, categories: newCategories });
  };

  const addCategory = () => {
    const newCategories = [
      ...editedRubric.categories,
      {
        name: 'New Category',
        weight: 0,
        scoring_levels: editedRubric.categories[0]?.scoring_levels?.map((_, index) => ({
          level: index + 1,
          score: index + 1,
          description: ''
        })) || [],
      },
    ];
    setEditedRubric({ ...editedRubric, categories: newCategories });
  };

  const addScoringLevel = () => {
    const newCategories = editedRubric.categories.map(category => ({
      ...category,
      scoring_levels: [
        ...(category.scoring_levels || []),
        { level: (category.scoring_levels?.length || 0) + 1, score: (category.scoring_levels?.length || 0) + 1, description: '' }
      ],
    }));
    setEditedRubric({ ...editedRubric, categories: newCategories });
  };

  const removeCategory = (index) => {
    const newCategories = editedRubric.categories.filter((_, i) => i !== index);
    setEditedRubric({ ...editedRubric, categories: newCategories });
  };

  const removeScoringLevel = (index) => {
    const newCategories = editedRubric.categories.map(category => ({
      ...category,
      scoring_levels: category.scoring_levels.filter((_, i) => i !== index),
    }));
    setEditedRubric({ ...editedRubric, categories: newCategories });
  };

  const truncateText = (text, maxWords) => {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  const EditCellModal = ({ value, onSave, onClose }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white p-6 rounded-lg shadow-xl w-1/2"
        onClick={(e) => e.stopPropagation()}
      >
        <textarea
          ref={textareaRef}
          className="w-full h-40 p-2 border rounded focus:ring-2 focus:ring-blue-500"
          value={value}
          onChange={(e) => onSave(e.target.value)}
        />
        <div className="flex justify-end mt-4">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200"
            onClick={onClose}
          >
            Save & Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        ref={modalRef}
        className="bg-white p-8 rounded-lg shadow-xl w-full max-w-6xl overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Edit Rubric</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition duration-200">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Rubric Title</label>
          <input
            type="text"
            value={editedRubric.title}
            onChange={(e) => setEditedRubric({ ...editedRubric, title: e.target.value })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-sm font-semibold text-gray-700">Category</th>
                <th className="border px-4 py-2 text-sm font-semibold text-gray-700">Weight</th>
                {editedRubric.categories[0]?.scoring_levels.map((_, index) => (
                  <th key={index} className="border px-4 py-2 text-sm font-semibold text-gray-700">Level {index + 1}</th>
                ))}
                <th className="border px-4 py-2">
                  <button onClick={addScoringLevel} className="text-green-500 hover:text-green-700 transition duration-200">
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {editedRubric.categories.map((category, categoryIndex) => (
                <tr key={categoryIndex} className="hover:bg-gray-50 transition duration-200">
                  <td className="border px-4 py-2">
                    <input
                      type="text"
                      value={category.name}
                      onChange={(e) => handleCategoryChange(categoryIndex, 'name', e.target.value)}
                      className="w-full border-none focus:outline-none text-sm"
                    />
                  </td>
                  <td className="border px-4 py-2">
                    <input
                      type="number"
                      value={category.weight}
                      onChange={(e) => handleCategoryChange(categoryIndex, 'weight', parseInt(e.target.value) || 0)}
                      className="w-full border-none focus:outline-none text-sm"
                    />
                  </td>
                  {category.scoring_levels.map((level, levelIndex) => (
                    <td
                      key={levelIndex}
                      className="border px-4 py-2 relative cursor-pointer transition-colors duration-200 ease-in-out hover:bg-blue-50"
                      onClick={() => setEditingCell({ categoryIndex, levelIndex })}
                    >
                      <div className="text-sm">
                        {truncateText(level.description, 50)}
                      </div>
                      <PencilIcon className="h-4 w-4 text-blue-500 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition duration-200" />
                    </td>
                  ))}
                  <td className="border px-4 py-2">
                    <button onClick={() => removeCategory(categoryIndex)} className="text-red-500 hover:text-red-700 transition duration-200">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addCategory}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded inline-flex items-center transition duration-200"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Category
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Save Rubric
          </motion.button>
        </div>
      </motion.div>
      <AnimatePresence>
        {editingCell && (
          <EditCellModal
            value={editedRubric.categories[editingCell.categoryIndex].scoring_levels[editingCell.levelIndex].description}
            onSave={(value) => {
              handleLevelChange(editingCell.categoryIndex, editingCell.levelIndex, 'description', value);
              setEditingCell(null);
            }}
            onClose={() => setEditingCell(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RubricModal;