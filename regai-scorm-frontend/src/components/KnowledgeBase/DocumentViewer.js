// components/KnowledgeBase/DocumentViewer.js
import React from 'react';
import { motion } from 'framer-motion';

const DocumentViewer = ({ item, stage }) => {
  if (!item) {
    return <div className="bg-white rounded-lg shadow-lg p-6">No data available for this stage.</div>;
  }

  const renderContent = () => {
    switch (stage) {
      case 'rubric':
        return <RubricView rubric={item.content.rubric} />;
      case 'initial_grade':
      case 'final_grade':
        return <GradeView grade={item.content} />;
      case 'critique':
        return <CritiqueView critique={item.content} />;
      default:
        return <div>Unknown document type</div>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <h2 className="text-2xl font-bold mb-4">{item.item_type}</h2>
      {renderContent()}
      <div className="mt-4 text-sm text-gray-500">
        <p>Status: {item.status}</p>
        <p>Created: {new Date(item.created_at).toLocaleString()}</p>
        {item.approved_at && (
          <p>Approved: {new Date(item.approved_at).toLocaleString()}</p>
        )}
      </div>
    </motion.div>
  );
};

const RubricView = ({ rubric }) => (
  <div>
    <h3 className="text-xl font-semibold mb-2">Categories:</h3>
    <ul className="list-disc pl-5">
      {rubric.categories.map((category, index) => (
        <li key={index}>{category.name} (Weight: {category.weight}%)</li>
      ))}
    </ul>
  </div>
);

const GradeView = ({ grade }) => (
  <div>
    <p className="text-lg font-semibold">Overall Score: {(grade.overall_score * 100).toFixed(2)}%</p>
    <h3 className="text-xl font-semibold mt-4 mb-2">Category Scores:</h3>
    <ul className="list-disc pl-5">
      {grade.category_scores.map((category, index) => (
        <li key={index}>{category.name}: {category.score}</li>
      ))}
    </ul>
  </div>
);

const CritiqueView = ({ critique }) => (
  <div>
    <p className="text-lg font-semibold mb-2">Overall Assessment:</p>
    <p>{critique.overall_assessment}</p>
    <h3 className="text-xl font-semibold mt-4 mb-2">Category Critiques:</h3>
    <ul className="list-disc pl-5">
      {critique.category_critiques.map((category, index) => (
        <li key={index}>
          <span className="font-semibold">{category.category}:</span> {category.critique}
        </li>
      ))}
    </ul>
  </div>
);

export default DocumentViewer;