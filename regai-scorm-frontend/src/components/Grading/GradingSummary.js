// components/Grading/GradingSummary.js
import React from 'react';

function GradingSummary({ grade, critique }) {
  const formatScore = (score) => {
    if (typeof score === 'number') {
      return `${(score * 100).toFixed(2)}%`;
    }
    return 'N/A';
  };

  const overallScore = grade && typeof grade.overall_score === 'number'
    ? formatScore(grade.overall_score)
    : 'N/A';

  const critiqueSummary = critique && critique.overall_assessment
    ? critique.overall_assessment
    : 'No critique available';

  return (
    <div className="bg-gray-50 rounded-lg p-6 mb-6 shadow-inner">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Grading Summary</h2>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-blue-800">Grade</h3>
          <p className="text-3xl font-bold text-blue-600">{overallScore}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-yellow-800">AI Critique</h3>
          <p className="text-sm text-yellow-900 line-clamp-3">{critiqueSummary}</p>
        </div>
      </div>
    </div>
  );
}

export default GradingSummary;