import React from 'react';
import { motion } from 'framer-motion';

const DocumentCard = ({ item, isSelected, onSelect, adjacentStages }) => {
  const renderContent = () => {
    switch (item.item_type) {
      case 'rubric':
        return <RubricPreview rubric={item.content} />;
      case 'initial_grade':
      case 'final_grade':
        return <GradePreview grade={item.content} />;
      case 'critique':
        return <CritiquePreview critique={item.content} />;
      default:
        return <p>Unknown document type</p>;
    }
  };

  return (
    <motion.div
      className={`border rounded-lg p-4 cursor-pointer ${
        isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
    >
      <h3 className="text-lg font-semibold mb-2">{item.item_type}</h3>
      {renderContent()}
      {isSelected && (
        <div className="mt-4 flex justify-between text-sm text-gray-500">
          {adjacentStages.previous && (
            <span>← Previous: {adjacentStages.previous}</span>
          )}
          {adjacentStages.next && (
            <span>Next: {adjacentStages.next} →</span>
          )}
        </div>
      )}
    </motion.div>
  );
};

const RubricPreview = ({ rubric }) => (
  <div className="text-sm">
    <p>Categories: {rubric.categories.length}</p>
    <p>Total Weight: {rubric.categories.reduce((sum, cat) => sum + cat.weight, 0)}%</p>
  </div>
);

const GradePreview = ({ grade }) => (
  <div className="text-sm">
    <p>Overall Score: {(grade.overall_score * 100).toFixed(2)}%</p>
    <p>Categories Graded: {grade.category_scores.length}</p>
  </div>
);

const CritiquePreview = ({ critique }) => (
  <div className="text-sm">
    <p>Overall Assessment: {critique.overall_assessment.substring(0, 100)}...</p>
    <p>Suggestions: {critique.suggestions_for_improvement.length}</p>
  </div>
);

export default DocumentCard;