import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, PencilAltIcon, PlusIcon, TrashIcon } from '@heroicons/react/solid';
import { toast } from "react-toastify";
import { updateKnowledgeBaseItem } from "../utils/knowledgeBaseApi";

const CritiqueModal = ({ critique, onClose, onUpdate }) => {
  const [editedCritique, setEditedCritique] = useState(critique);
  const [activeSection, setActiveSection] = useState(null);

  const handleSave = async () => {
    try {
      const dataToSend = {
        ...critique,
        content: editedCritique.content,
        human_approved: editedCritique.human_approved,
        revision_status: editedCritique.revision_status
      };

      const updatedCritique = await updateKnowledgeBaseItem('critiques', critique.id, dataToSend);
      onUpdate('critique', updatedCritique);
      onClose();
      toast.success("Critique saved successfully.");
    } catch (error) {
      console.error('Error updating critique:', error);
      toast.error('Failed to update critique');
    }
  };

  const handleChange = (field, value, index = null) => {
    setEditedCritique(prevState => {
      if (field === 'revision_status') {
        return { ...prevState, revision_status: value };
      }
      const newContent = { ...prevState.content };
      if (index !== null) {
        newContent[field] = newContent[field].map((item, i) =>
          i === index ? (field === 'category_critiques' ? { ...item, ...value } : value) : item
        );
      } else {
        newContent[field] = value;
      }
      return {
        ...prevState,
        content: newContent
      };
    });
  };

  const addItem = (field) => {
    setEditedCritique(prevState => ({
      ...prevState,
      content: {
        ...prevState.content,
        [field]: [...(prevState.content[field] || []), field === 'category_critiques' ? { category: '', critique: '' } : '']
      }
    }));
  };

  const removeItem = (field, index) => {
    setEditedCritique(prevState => ({
      ...prevState,
      content: {
        ...prevState.content,
        [field]: prevState.content[field].filter((_, i) => i !== index)
      }
    }));
  };

  const EditableField = ({ value, onChange, multiline = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(value);
    const inputRef = useRef(null);

    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isEditing]);

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !multiline) {
        e.preventDefault();
        onChange(localValue);
        setIsEditing(false);
      }
    };

    const handleBlur = () => {
      onChange(localValue);
      setIsEditing(false);
    };

    if (!isEditing) {
      return (
        <div
          className="relative group cursor-text p-2 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors duration-200"
          onClick={() => setIsEditing(true)}
        >
          <p className="text-gray-700">{value}</p>
          <PencilAltIcon className="h-5 w-5 absolute top-2 right-2 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      );
    }

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {multiline ? (
            <textarea
              ref={inputRef}
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={handleBlur}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows="4"
            />
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-purple-700">AI Critique</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-purple-600 mb-2">Revision Status</h3>
            <select
              value={editedCritique.revision_status}
              onChange={(e) => handleChange('revision_status', e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="PASS">Pass</option>
              <option value="MINOR_REVISION">Minor Revision</option>
              <option value="MAJOR_REVISION">Major Revision</option>
            </select>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-purple-600 mb-2">Overall Assessment</h3>
            <EditableField
              value={editedCritique?.content?.overall_assessment || ''}
              onChange={(value) => handleChange('overall_assessment', value)}
              multiline
            />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-purple-600 mb-2">Category Critiques</h3>
            {editedCritique?.content?.category_critiques?.map((cat, index) => (
                <div key={index} className="mb-4 p-4 bg-purple-50 rounded-md relative group">
                  {activeSection === `category_${index}` ? (
                      <div className="space-y-2">
                        <EditableField
                            value={cat.category}
                            onChange={(value) => handleChange('category_critiques', {...cat, category: value}, index)}
                        />
                        <EditableField
                            value={cat.critique}
                            onChange={(value) => handleChange('category_critiques', {...cat, critique: value}, index)}
                            multiline
                        />
                      </div>
                  ) : (
                      <>
                        <h4 className="font-semibold text-purple-700">{cat.category}</h4>
                        <p className="text-gray-700">{cat.critique}</p>
                        <button
                            onClick={() => setActiveSection(`category_${index}`)}
                            className="absolute top-2 right-2 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <PencilAltIcon className="h-5 w-5"/>
                        </button>
                      </>
                  )}
                  <button
                      onClick={() => removeItem('category_critiques', index)}
                      className="absolute bottom-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <TrashIcon className="h-5 w-5"/>
                  </button>
                </div>
            ))}
            <button
                onClick={() => addItem('category_critiques')}
                className="mt-2 text-purple-600 hover:text-purple-800 flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-1"/> Add Category Critique
            </button>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-purple-600 mb-2">Potential Biases</h3>
            {editedCritique?.content?.potential_biases?.map((bias, index) => (
                <div key={index} className="mb-2 relative group">
                  {activeSection === `bias_${index}` ? (
                      <EditableField
                          value={bias}
                          onChange={(value) => handleChange('potential_biases', value, index)}
                      />
                  ) : (
                      <div className="flex items-center">
                        <p className="text-gray-700">{bias}</p>
                        <button
                            onClick={() => setActiveSection(`bias_${index}`)}
                            className="ml-2 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <PencilAltIcon className="h-5 w-5"/>
                        </button>
                        <button
                            onClick={() => removeItem('potential_biases', index)}
                            className="ml-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <TrashIcon className="h-5 w-5"/>
                        </button>
                      </div>
                  )}
                </div>
            ))}
            <button
                onClick={() => addItem('potential_biases')}
                className="mt-2 text-purple-600 hover:text-purple-800 flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-1"/> Add Potential Bias
            </button>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-purple-600 mb-2">Suggestions for Improvement</h3>
            {editedCritique?.content?.suggestions_for_improvement?.map((suggestion, index) => (
                <div key={index} className="mb-2 relative group">
                  {activeSection === `suggestion_${index}` ? (
                      <EditableField
                          value={suggestion}
                          onChange={(value) => handleChange('suggestions_for_improvement', value, index)}
                      />
                  ) : (
                      <div className="flex items-center">
                        <p className="text-gray-700">{suggestion}</p>
                        <button
                            onClick={() => setActiveSection(`suggestion_${index}`)}
                            className="ml-2 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <PencilAltIcon className="h-5 w-5"/>
                        </button>
                        <button
                            onClick={() => removeItem('suggestions_for_improvement', index)}
                            className="ml-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <TrashIcon className="h-5 w-5"/>
                        </button>
                      </div>
                  )}
                </div>
            ))}
            <button
                onClick={() => addItem('suggestions_for_improvement')}
                className="mt-2 text-purple-600 hover:text-purple-800 flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-1"/> Add Suggestion
            </button>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          className="mt-6 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Save Changes
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default CritiqueModal;