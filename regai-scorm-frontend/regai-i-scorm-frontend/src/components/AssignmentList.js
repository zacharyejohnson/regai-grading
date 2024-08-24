import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {ChevronRightIcon, ClockIcon, CheckCircleIcon, ExclamationCircleIcon} from '@heroicons/react/24/solid';
import apiEndpoints from '../apiService';

const AssignmentList = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const data = await apiEndpoints.assignments.getAll();
        setAssignments(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch assignments. Please try again later.');
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'overdue':
        return <ExclamationCircleIcon className="w-6 h-6 text-red-500" />;
      default:
        return <ClockIcon className="w-6 h-6 text-yellow-500" />;
    }
  };

  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-4">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="bg-white shadow rounded-lg p-4">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );

  const ErrorDisplay = ({ message }) => (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md" role="alert">
      <p className="font-bold">Error</p>
      <p>{message}</p>
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-12">
      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments</h3>
      <p className="mt-1 text-sm text-gray-500">Get started by creating a new assignment.</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">My Assignments</h1>
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorDisplay message={error} />
      ) : assignments.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {assignments.map((assignment) => (
              <li key={assignment.id}>
                <Link to={`/assignment/${assignment.id}`} className="block hover:bg-gray-50">
                  <div className="flex items-center px-4 py-4 sm:px-6">
                    <div className="min-w-0 flex-1 flex items-center">
                      <div className="flex-shrink-0">
                        {getStatusIcon(assignment.status)}
                      </div>
                      <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
                        <div>
                          <p className="text-sm font-medium text-indigo-600 truncate">{assignment.title}</p>
                          <p className="mt-2 flex items-center text-sm text-gray-500">
                            <span className="truncate">{assignment.course}</span>
                          </p>
                        </div>
                        <div className="hidden md:block">
                          <div>
                            <p className="text-sm text-gray-900">
                              Due: {format(new Date(assignment.due_date), 'MMM dd, yyyy')}
                            </p>
                            <p className="mt-2 flex items-center text-sm text-gray-500">
                              {assignment.status === 'completed' ? 'Submitted' : 'Not submitted'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <ChevronRightIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AssignmentList;