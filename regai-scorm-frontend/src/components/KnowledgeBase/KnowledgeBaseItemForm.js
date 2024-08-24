import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import RubricDisplay from "../Rubric/RubricDisplay";
import {renderHook} from "@testing-library/react";

function KnowledgeBaseItemForm({ item, onSubmit, onCancel }) {
  const [showRubricEditModal, setShowRubricEditModal] = useState(false);
  const [formData, setFormData] = useState(item || {
    item_type: '',
    content: {},
  });

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleContentChange = (field, value) => {
    setFormData(prevData => ({
      ...prevData,
      content: {
        ...prevData.content,
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderGradeForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Overall Score</label>
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={formData.content.overall_score || ''}
          onChange={(e) => handleContentChange('overall_score', parseFloat(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Justification</label>
        <textarea
          value={formData.content.justification || ''}
          onChange={(e) => handleContentChange('justification', e.target.value)}
          rows="3"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Category Scores</label>
        {formData.content.category_scores?.map((category, index) => (
          <div key={index} className="mt-2 p-4 border rounded-md">
            <input
              type="text"
              value={category.name}
              onChange={(e) => {
                const newCategoryScores = [...formData.content.category_scores];
                newCategoryScores[index].name = e.target.value;
                handleContentChange('category_scores', newCategoryScores);
              }}
              className="mb-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={category.score}
              onChange={(e) => {
                const newCategoryScores = [...formData.content.category_scores];
                newCategoryScores[index].score = parseFloat(e.target.value);
                handleContentChange('category_scores', newCategoryScores);
              }}
              className="mb-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
            <textarea
              value={category.justification}
              onChange={(e) => {
                const newCategoryScores = [...formData.content.category_scores];
                newCategoryScores[index].justification = e.target.value;
                handleContentChange('category_scores', newCategoryScores);
              }}
              rows="2"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderCritiqueForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Overall Assessment</label>
        <textarea
          value={formData.content.overall_assessment || ''}
          onChange={(e) => handleContentChange('overall_assessment', e.target.value)}
          rows="3"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Category Critiques</label>
        {formData.content.category_critiques?.map((critique, index) => (
          <div key={index} className="mt-2 p-4 border rounded-md">
            <input
              type="text"
              value={critique.category}
              onChange={(e) => {
                const newCritiques = [...formData.content.category_critiques];
                newCritiques[index].category = e.target.value;
                handleContentChange('category_critiques', newCritiques);
              }}
              className="mb-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
            <textarea
              value={critique.assessment}
              onChange={(e) => {
                const newCritiques = [...formData.content.category_critiques];
                newCritiques[index].assessment = e.target.value;
                handleContentChange('category_critiques', newCritiques);
              }}
              rows="2"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderRubricForm = (rubricJson) => (
      <RubricDisplay
          rubric={rubricJson}
          onEditRubric={() => setShowRubricEditModal(true)}
          isApproved={false}
          />
  )
  const renderForm = () => {
    switch (formData.item_type) {
      case 'grade':
        return renderGradeForm();
      case 'critique':
        return renderCritiqueForm();
      case 'rubric':
        // For rubrics, we might want to use a more complex editor like the RubricEditModal
        // For now, we'll use a simple textarea
        return renderRubricForm(formData.content);
      //     <textarea
      //       value={JSON.stringify(formData.content, null, 2)}
      //       onChange={(e) => handleContentChange('content', JSON.parse(e.target.value))}
      //       rows="20"
      //       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
      //     />
      //   );
      // default:
      //   return (
      //     <textarea
      //       value={JSON.stringify(formData.content, null, 2)}
      //       onChange={(e) => handleContentChange('content', JSON.parse(e.target.value))}
      //       rows="20"
      //       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
      //     />
      //   );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="item_type" className="block text-sm font-medium text-gray-700">Item Type</label>
        <select
          id="item_type"
          name="item_type"
          value={formData.item_type}
          onChange={handleChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">Select a type</option>
          <option value="rubric">Rubric</option>
          <option value="grade">Grade</option>
          <option value="critique">Critique</option>
        </select>
      </div>
      {renderForm()}
      <div className="flex justify-end space-x-2">
        <motion.button
          type="button"
          onClick={onCancel}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </motion.button>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Save
        </motion.button>
      </div>
    </form>
  );
}

export default KnowledgeBaseItemForm;