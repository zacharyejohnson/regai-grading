import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { ClockIcon, DocumentTextIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import apiEndpoints from '../apiService';

const AssignmentView = () => {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const data = await apiEndpoints.assignments.get();
        setAssignment(data);
        setLoading(false);

        // Initialize SCORM data for this assignment
        await apiEndpoints.scormAPI.initialize();
      } catch (err) {
        setError('Failed to fetch assignment details. Please try again later.');
        setLoading(false);
      }
    };

    fetchAssignment();
  }, []);

  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-8">
      <div className="h-8 bg-gray-200 rounded w-3/4"></div>
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  );

  const ErrorDisplay = ({ message }) => (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md" role="alert">
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <p className="font-bold">Error</p>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-8 px-4">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8 px-4">
        <ErrorDisplay message={error} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">{assignment.title}</h1>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
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
                {format(new Date(assignment.due_date), 'MMMM dd, yyyy hh:mm a')}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  assignment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {assignment.status}
                </span>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <DocumentTextIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                Description
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <ReactMarkdown className="prose">{assignment.description}</ReactMarkdown>
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="mt-8 flex justify-end">
        <button
          onClick={() => window.location.href = '/submit'}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Submit Assignment
        </button>
      </div>
    </div>
  );
};

export default AssignmentView;