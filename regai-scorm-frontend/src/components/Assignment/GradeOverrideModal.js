import React, { useState } from 'react';
import { XIcon } from '@heroicons/react/solid';

function GradeOverrideModal({ submission, rubric, onClose, onSave }) {
  const [overrideScores, setOverrideScores] = useState(submission.category_scores);

  const handleScoreChange = (index, newScore) => {
    const updatedScores = [...overrideScores];
    updatedScores[index].score = parseFloat(newScore);
    setOverrideScores(updatedScores);
  };

  const calculateOverallScore = () => {
    let totalScore = 0;
    let totalWeight = 0;
    overrideScores.forEach((categoryScore) => {
      const rubricCategory = rubric.categories.find(c => c.name === categoryScore.name);
      if (rubricCategory) {
        totalScore += categoryScore.score * rubricCategory.weight;
        totalWeight += rubricCategory.weight;
      }
    });
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  };

  const handleSave = () => {
    const updatedSubmission = {
      ...submission,
      category_scores: overrideScores,
      overall_score: calculateOverallScore(),
    };
    onSave(updatedSubmission);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Override Grades</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {overrideScores.map((categoryScore, index) => {
          const rubricCategory = rubric.categories.find(c => c.name === categoryScore.name);
          const maxScore = rubricCategory ? rubricCategory.scoring_levels.length : 1;

          return (
            <div key={index} className="mb-4">
              <label className="block text-sm font-medium text-gray-700">{categoryScore.name}</label>
              <input
                type="number"
                min="0"
                max={maxScore}
                step="0.1"
                value={categoryScore.score}
                onChange={(e) => handleScoreChange(index, e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          );
        })}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default GradeOverrideModal;