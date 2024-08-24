import React, {useEffect, useState} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, PlusIcon, TrashIcon, PencilIcon, CheckIcon } from '@heroicons/react/solid';

const RubricEditModal = ({ rubric, onSave, onClose }) => {
  const [editedRubric, setEditedRubric] = useState(rubric);

  useEffect(() => {
    console.log("Initial rubric:", rubric);
  }, [rubric]);
  const handleCategoryChange = (index, field, value) => {
    const newCategories = [...editedRubric.content.categories];
    newCategories[index] = {
      ...newCategories[index],
      [field]: field === 'weight' ? parseFloat(value) : value
    };
    const newRubric = {
      ...editedRubric,
      content: { ...editedRubric.content, categories: newCategories }
    };
    setEditedRubric(newRubric);
    console.log("Updated rubric after category change:", newRubric);
};

  const handleLevelChange = (categoryIndex, levelIndex, field, value) => {
    const newCategories = [...editedRubric.content.categories];
    newCategories[categoryIndex].scoring_levels[levelIndex] = {
      ...newCategories[categoryIndex].scoring_levels[levelIndex],
      [field]: field === 'score' ? parseFloat(value) : value
    };
    setEditedRubric({
      ...editedRubric,
      content: { ...editedRubric.content, categories: newCategories }
    });
  };

  const addCategory = () => {
    const newCategory = {
      name: 'New Category',
      weight: 0,
      scoring_levels: editedRubric.content.categories[0]?.scoring_levels.map((_, index) => ({
        level: index + 1,
        score: index + 1,
        description: ''
      })) || []
    };
    setEditedRubric({
      ...editedRubric,
      content: {
        ...editedRubric.content,
        categories: [...editedRubric.content.categories, newCategory]
      }
    });
  };

  const removeCategory = (index) => {
    const newCategories = editedRubric.content.categories.filter((_, i) => i !== index);
    setEditedRubric({
      ...editedRubric,
      content: { ...editedRubric.content, categories: newCategories }
    });
  };

  const addScoringLevel = () => {
    const newLevel = (editedRubric.content.categories[0]?.scoring_levels.length || 0) + 1;
    const newCategories = editedRubric.content.categories.map(category => ({
      ...category,
      scoring_levels: [
        ...category.scoring_levels,
        { level: newLevel, score: newLevel, description: '' }
      ]
    }));
    setEditedRubric({
      ...editedRubric,
      content: { ...editedRubric.content, categories: newCategories }
    });
  };

  const removeScoringLevel = (levelIndex) => {
    const newCategories = editedRubric.content.categories.map(category => ({
      ...category,
      scoring_levels: category.scoring_levels.filter((_, i) => i !== levelIndex)
    }));
    setEditedRubric({
      ...editedRubric,
      content: { ...editedRubric.content, categories: newCategories }
    });
  };

  const handleSave = () => {
    console.log("Saving rubric:", editedRubric);
    onSave(editedRubric);
    onClose();
  };
  const EditableCell = ({ value, onChange, multiline = false, type = 'text' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleEdit = () => {
    setIsEditing(true);
    setTempValue(value);
  };

  const handleSave = () => {
    const finalValue = type === 'number' ? parseFloat(tempValue) : tempValue;
    onChange(finalValue);
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    if (type === 'number') {
      if (newValue === '' || !isNaN(newValue)) {
        setTempValue(newValue);
      }
    } else {
      setTempValue(newValue);
    }
  };

  return (
    <div className="relative h-full w-full group">
      {isEditing ? (
        <>
          {multiline ? (
            <textarea
              value={tempValue}
              onChange={handleChange}
              className="w-full h-full p-2 border rounded resize-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <input
              type={type}
              value={tempValue}
              onChange={handleChange}
              className="w-full h-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          )}
          <button
            onClick={handleSave}
            className="absolute top-1 right-1 text-green-500 hover:text-green-700"
          >
            <CheckIcon className="h-5 w-5" />
          </button>
        </>
      ) : (
        <>
          <div className="h-full p-2 overflow-auto">{value}</div>
          <button
            onClick={handleEdit}
            className="absolute top-1 right-1 text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
};

  const maxLevels = Math.max(...(editedRubric.content.categories?.map(cat => cat.scoring_levels.length) || [0]), 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-xl w-11/12 max-w-7xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-3xl font-bold text-gray-800">Edit Rubric</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
              <XIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-grow overflow-auto p-6">
            <div className="mb-6">
              <EditableCell
                value={editedRubric.content.title}
                onChange={(value) => setEditedRubric(prevRubric => ({
                  ...prevRubric,
                  content: { ...prevRubric.content, title: value }
                }))}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 w-1/4">Category</th>
                    <th className="border px-4 py-2 w-1/12">Weight</th>
                    {[...Array(maxLevels)].map((_, index) => (
                      <th key={index} className="border px-4 py-2">
                        Level {index + 1}
                        {index === maxLevels - 1 && (
                          <button
                            onClick={() => removeScoringLevel(index)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4 inline" />
                          </button>
                        )}
                      </th>
                    ))}
                    <th className="border px-4 py-2 w-1/12">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {editedRubric.content.categories?.map((category, categoryIndex) => (
                    <tr key={categoryIndex}>
                      <td className="border px-4 py-2">
                        <EditableCell
                          value={category.name}
                          onChange={(value) => handleCategoryChange(categoryIndex, 'name', value)}
                        />
                      </td>
                      <td className="border px-4 py-2">
                        <EditableCell
                          value={category.weight}
                          onChange={(value) => handleCategoryChange(categoryIndex, 'weight', value)}
                          type="number"
                        />
                      </td>
                      {category.scoring_levels.map((level, levelIndex) => (
                        <td key={levelIndex} className="border px-4 py-2">
                          <EditableCell
                            value={level.description || ''}
                            onChange={(value) => handleLevelChange(categoryIndex, levelIndex, 'description', value)}
                            multiline
                          />
                        </td>
                      ))}
                      {[...Array(maxLevels - category.scoring_levels.length)].map((_, index) => (
                        <td key={`empty-${index}`} className="border px-4 py-2"></td>
                      ))}
                      <td className="border px-4 py-2">
                        <button
                          onClick={() => removeCategory(categoryIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
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
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Category
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={addScoringLevel}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Scoring Level
              </motion.button>
            </div>
          </div>
          <div className="p-6 border-t flex justify-end">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-6 rounded transition duration-300 ease-in-out"
            >
              Save Rubric
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RubricEditModal;