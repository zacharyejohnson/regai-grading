import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { ClockIcon, DocumentTextIcon } from '@heroicons/react/24/solid';
import apiEndpoints from '../apiService';
import GradeDisplay from './GradeDisplay';

const AssignmentView = () => {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [studentName, setStudentName] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const data = await apiEndpoints.scormAssignment.get();
        setAssignment(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch assignment details. Please try again later.');
        setLoading(false);
      }
    };

    fetchAssignment();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await apiEndpoints.scormAssignment.submit({
        content: submissionText,
        student_name: studentName
      });
      setResult(response);
      setSubmitting(false);
    } catch (err) {
      setError('Failed to submit assignment. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (result) {
    return (
      <GradeDisplay
        categoryScores={result.category_scores}
        onClose={() => setResult(null)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">{assignment.title}</h1>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Assignment Details</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">{assignment.course}</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <ClockIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                Due Date
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {assignment.due_date ? format(new Date(assignment.due_date), 'MMMM dd, yyyy hh:mm a') : 'Not specified'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <DocumentTextIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                Description
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <ReactMarkdown className="prose">{assignment.description || 'No description available.'}</ReactMarkdown>
              </dd>
            </div>
          </dl>
        </div>
      </div>
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
        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
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

export default AssignmentView;