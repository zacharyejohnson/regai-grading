import React, {useState} from 'react';
import { XIcon } from '@heroicons/react/solid';
import GradeOverrideModal from "./GradeOverrideModal";

function SubmissionDetailsModal({ submission, rubric, onClose, onOverrideGrade }) {
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const overallScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const categoryScoreColor = (score, maxScore) => {
    const percentageScore = (score / maxScore) * 100;
    if (percentageScore >= 90) return 'bg-green-100 border-green-500';
    if (percentageScore >= 80) return 'bg-blue-100 border-blue-500';
    if (percentageScore >= 70) return 'bg-yellow-100 border-yellow-500';
    return 'bg-red-100 border-red-500';
  };

  const renderCategoryScores = () => {
    if (!submission.category_scores || submission.category_scores.length === 0) {
      return <p>No category scores available.</p>;
    }

    return submission.category_scores.map((categoryScore, index) => {
      const rubricCategory = rubric.categories.find(c => c.name === categoryScore.name);
      const maxScore = rubricCategory ? rubricCategory.scoring_levels.length : 1;

      return (
        <div key={index} className={`p-4 rounded-lg border-l-4 ${categoryScoreColor(categoryScore.score, maxScore)}`}>
          <div className="flex justify-between items-center mb-2">
            <h4 class
              Name="text-xl font-semibold">{categoryScore.name}</h4>
            <div className="flex items-center">
              <span className="text-2xl font-bold mr-2">{categoryScore.score.toFixed(1)}</span>
              <span className="text-sm text-gray-500">/ {maxScore}</span>
            </div>
          </div>
          <p className="text-gray-700">{categoryScore.justification}</p>
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center" onClick={onClose}>
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Submission Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-2">Overall Score</h3>
          <div className={`text-5xl font-bold ${overallScoreColor(Math.round(submission.overall_score * 100))}`}>
            {Math.round(submission.overall_score * 100)}%
          </div>
          <p className="mt-2 text-gray-700">{submission.overall_justification}</p>
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-semibold">Category Scores</h3>
          {renderCategoryScores()}
        </div>

        <div className="mt-8">
          <button
            onClick={() => setShowOverrideModal(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            Override Grade
          </button>
        </div>

        {showOverrideModal && (
          <GradeOverrideModal
            submission={submission}
            rubric={rubric}
            onClose={() => setShowOverrideModal(false)}
            onSave={(updatedSubmission) => {
              onOverrideGrade(updatedSubmission);
              setShowOverrideModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
}


export default SubmissionDetailsModal;