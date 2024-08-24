import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from "../../../regai-frontend/src/components/utils/api";


function GradingPipeline() {
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [gradingStage, setGradingStage] = useState('initial');
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  const fetchSubmission = () => {
    api.get(`/submissions/${submissionId}/`)
      .then(response => setSubmission(response.data))
      .catch(error => console.error('Error fetching submission:', error));
  };

  const startGrading = () => {
    setGradingStage('inProgress');
    api.post(`/submissions/${submissionId}/grade_submission/`)
      .then(response => {
        setFeedback(response.data.feedback);
        setGradingStage('completed');
      })
      .catch(error => {
        console.error('Error grading submission:', error);
        setGradingStage('error');
      });
  };

  if (!submission) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Grading Pipeline</h1>
      <div className="mb-4">
        <p>Submission ID: {submission.id}</p>
        <p>Submitted at: {new Date(submission.submitted_at).toLocaleString()}</p>
      </div>
      {gradingStage === 'initial' && (
        <button onClick={startGrading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Start Grading
        </button>
      )}
      {gradingStage === 'inProgress' && (
        <div>Grading in progress...</div>
      )}
      {gradingStage === 'completed' && feedback && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Grading Results</h2>
          <p>Overall Score: {feedback.overall_score}</p>
          <p>Justification: {feedback.overall_score_justification}</p>
          <h3 className="text-xl font-bold mt-4 mb-2">Category Scores:</h3>
          {feedback.category_scores.map((category, index) => (
            <div key={index} className="mb-2">
              <p><strong>{category.category}:</strong> {category.justification}</p>
            </div>
          ))}
        </div>
      )}
      {gradingStage === 'error' && (
        <div className="text-red-600">An error occurred during grading. Please try again.</div>
      )}
    </div>
  );
}

export default GradingPipeline;