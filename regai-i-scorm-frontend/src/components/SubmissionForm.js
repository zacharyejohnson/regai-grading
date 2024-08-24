import React, { useState } from 'react';
import apiEndpoints from '../apiService';
import GradeDisplay from './GradeDisplay';

const SubmissionForm = ({ onBack, assignment }) => {
  const [submissionText, setSubmissionText] = useState('');
  const [studentName, setStudentName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [grade, setGrade] = useState(null);
  const [showGrade, setShowGrade] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await apiEndpoints.scormAssignment.submit({
        text: submissionText,
        student_name: studentName
      });
      setGrade(response.grade);
      setShowGrade(true);
      setSubmitting(false);
    } catch (err) {
      setError('Failed to submit assignment. Please try again.');
      setSubmitting(false);
    }
  };

  if (showGrade && grade) {
    return <GradeDisplay grade={grade} onClose={() => setShowGrade(false)} />;
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Submit Assignment: {assignment?.title}</h1>
      <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
        <div>
          <label htmlFor="student-name" className="block text-sm font-medium text-gray-700">
            Your Name
          </label>
          <input
            type="text"
            id="student-name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="submission-text" className="block text-sm font-medium text-gray-700">
            Submission Text
          </label>
          <textarea
            id="submission-text"
            rows={10}
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        {error && (
          <div className="text-red-600 mt-2">
            {error}
          </div>
        )}
        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onBack}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                submitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SubmissionForm;