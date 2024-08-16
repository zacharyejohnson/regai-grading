import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, PencilAltIcon, SaveIcon, ExclamationIcon } from '@heroicons/react/solid';
import { toast } from 'react-toastify';
import api from "../utils/api";

const GradeModal = ({ grade, rubric, onClose, onUpdate, gradeType }) => {
  const [editedGrade, setEditedGrade] = useState(() => {
    const content = Array.isArray(grade.content) ? grade.content :
      (grade?.content?.scores || grade?.content?.categories || [grade.content]);
    return { ...grade, content };
  });
  const [isOverriding, setIsOverriding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showThankYouMessage, setShowThankYouMessage] = useState(false);

  const calculateOverallScore = () => {
    if (!editedGrade.content || !editedGrade.content.length) return 0;
    const totalScore = editedGrade.content.reduce((sum, category) => sum + (parseFloat(category.score) || 0), 0);
    return (totalScore / editedGrade.content.length).toFixed(2);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      let response;
      if (isOverriding) {
        // Call the override endpoint
        response = await api.post(`/grades/${grade.id}/override/`, {
          content: editedGrade.content
        });

        // Update both grade and critique
        onUpdate('grade', response.data.grade);
        onUpdate('critique', response.data.critique);

        setShowThankYouMessage(true);
        setTimeout(() => {
          setShowThankYouMessage(false);
          onClose();
        }, 3000);
      } else {
        // Regular update
        response = await api.patch(`/grades/${grade.id}/`, {
          content: editedGrade.content,
          human_approved: true
        });
        onUpdate('grade', response.data);
        toast.success('Grade updated successfully');
        onClose();
      }
    } catch (error) {
      console.error('Error saving grade:', error);
      toast.error('Failed to save grade. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (index, field, value) => {
    const newContent = editedGrade.content.map((category, i) =>
      i === index ? { ...category, [field]: value } : category
    );
    setEditedGrade({ ...editedGrade, content: newContent });
  };

  const EditableField = ({ value, onChange, isNumber = false, multiline = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(value);
    const inputRef = useRef(null);

    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isEditing]);

    const handleChange = (e) => setLocalValue(e.target.value);
    const handleBlur = () => {
      onChange(isNumber ? parseFloat(localValue) : localValue);
      setIsEditing(false);
    };

    if (!isEditing) {
      return (
        <div
          className="cursor-text relative group p-2 rounded-md bg-gray-50 min-h-[40px]"
          onClick={() => setIsEditing(true)}
        >
          {multiline ? <pre className="whitespace-pre-wrap font-sans">{value}</pre> : <p>{value}</p>}
          <PencilAltIcon className="h-5 w-5 absolute top-2 right-2 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      );
    }

    const commonProps = {
      ref: inputRef,
      value: localValue,
      onChange: handleChange,
      onBlur: handleBlur,
      className: "w-full p-2 rounded-md text-gray-700 bg-white border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
    };

    return multiline ? (
      <textarea {...commonProps} rows="3" />
    ) : (
      <input
        {...commonProps}
        type={isNumber ? "number" : "text"}
        min={isNumber ? 0 : undefined}
        max={isNumber ? 6 : undefined}
        step={isNumber ? 0.1 : undefined}
      />
    );
  };

  const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  );

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
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">
            {isOverriding ? 'Override ' : ''}{gradeType.charAt(0).toUpperCase() + gradeType.slice(1)} Grade
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : showThankYouMessage ? (
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold text-green-600 mb-4">Thank You for Your Feedback</h2>
            <p className="text-lg text-gray-700">
              Your override has been recorded and a new grade and critique have been generated based on your input.
            </p>
          </div>
        ) : (
          <>
            {isOverriding && (
              <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      You are overriding the original grade. This will generate a new grade and critique based on your input.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6 bg-indigo-100 p-4 rounded-lg">
              <div className="text-5xl font-bold text-indigo-600">{(calculateOverallScore() * 100 / 6).toFixed(2)}%</div>
              <div className="text-indigo-700 mt-1">Overall Score: {calculateOverallScore()}/6</div>
            </div>

            <AnimatePresence>
              {editedGrade.content.map((category, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-gray-50 p-4 rounded-lg mb-4 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
                    <EditableField
                      value={category.score}
                      onChange={(value) => handleCategoryChange(index, 'score', value)}
                      isNumber={true}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Justification</label>
                    <EditableField
                      value={category.justification}
                      onChange={(value) => handleCategoryChange(index, 'justification', value)}
                      multiline={true}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="mt-6 flex space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOverriding(!isOverriding)}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                disabled={isLoading}
              >
                {isOverriding ? 'Cancel Override' : 'Override Grade'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isLoading}
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <SaveIcon className="h-5 w-5 mr-2" />
                )}
                {isLoading ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default GradeModal;