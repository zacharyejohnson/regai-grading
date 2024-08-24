import React, {useMemo, useState} from 'react';
import { Link } from 'react-router-dom';
import {
  AcademicCapIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  RefreshIcon,
  SearchIcon,
  TrashIcon
} from '@heroicons/react/solid';
import SubmissionDetailsModal from "./SubmissionDetailsModal";
import GradingPipeline from "../Grading/GradingPipeline";
import { motion } from 'framer-motion';

function CircularProgressBar({ percentage }) {
  const circumference = 2 * Math.PI * 20;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = (percent) => {
    if (percent >= 80) return '#10B981';
    if (percent >= 60) return '#FBBF24';
    return '#EF4444';
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-12 h-12" viewBox="0 0 44 44">
        <circle
          className="text-gray-200"
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          r="20"
          cx="22"
          cy="22"
        />
        <circle
          className="text-blue-600"
          stroke={getColor(percentage)}
          strokeWidth="4"
          strokeLinecap="round"
          fill="transparent"
          r="20"
          cx="22"
          cy="22"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            transition: 'stroke-dashoffset 0.5s ease 0s',
          }}
        />
      </svg>
      <span className="absolute text-xs font-semibold text-gray-700">{percentage}%</span>
    </div>
  );
}

function ClassSummary({ submissions }) {
  const averageGrade = useMemo(() => {
    if (submissions.length === 0) return 0;
    const sum = submissions.reduce((acc, sub) => acc + (sub.grade || 0), 0);
    return Math.round((sum / submissions.length) * 100);
  }, [submissions]);

  const submissionCount = submissions.length;
  const gradedCount = submissions.filter(sub => sub.status === 'graded').length;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <AcademicCapIcon className="h-8 w-8 mr-2 text-indigo-600" />
        Class Summary
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-gray-600">Average Grade</p>
          <p className="text-3xl font-bold text-indigo-600">{averageGrade}%</p>
        </div>
        <div className="text-center">
          <p className="text-gray-600">Total Submissions</p>
          <p className="text-3xl font-bold text-indigo-600">{submissionCount}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-600">Graded Submissions</p>
          <p className="text-3xl font-bold text-indigo-600">{gradedCount}</p>
        </div>
      </div>
    </div>
  );
}

function GradingStatus({ status }) {
  if (status === 'graded') {
    return <span className="text-green-500">Graded</span>;
  } else if (status === 'grading') {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-5 h-5 border-t-2 border-blue-500 rounded-full"
      />
    );
  } else if (status === 'queued') {
    return <span className="text-yellow-500">Queued</span>;
  }
  return <span className="text-gray-500">Pending</span>;
}

function SubmissionTable({ submissions, assignment, rubric, onDeleteSubmission, onRefresh }) {
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('student_name');
  const [sortDirection, setSortDirection] = useState('asc');

  const handleDelete = (submissionId) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      onDeleteSubmission(submissionId);
    }
  };
  const filteredAndSortedSubmissions = useMemo(() => {
    if (!Array.isArray(submissions)) {
      console.error('Submissions is not an array:', submissions);
      return [];
    }
    return submissions
      .filter(submission =>
        submission.student_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (a[sortColumn] < b[sortColumn]) return sortDirection === 'asc' ? -1 : 1;
        if (a[sortColumn] > b[sortColumn]) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [submissions, searchTerm, sortColumn, sortDirection]);

  const handleSort = (column) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleStartGrading = (submission) => {
    setGradingSubmission(submission);
  };

  const handleCloseGrading = () => {
    setGradingSubmission(null);
  };

  const { max_score, categoryWeights } = useMemo(() => {
    if (!rubric || !rubric.categories) return { max_score: 0, categoryWeights: {} };

    const totalWeight = rubric.categories.reduce((sum, category) => sum + (category.weight || 0), 0);

    return rubric.categories.reduce((acc, category, index) => {
      const categoryMax = category.scoring_levels.length > 0
        ? Math.max(...category.scoring_levels.map(level => level.score))
        : 0;
      const relativeWeight = (category.weight || 0) / totalWeight;

      return {
        max_score: acc.max_score + (categoryMax * relativeWeight),
        categoryWeights: {
          ...acc.categoryWeights,
          [index]: relativeWeight
        }
      };
    }, { max_score: 0, categoryWeights: {} });
  }, [rubric]);



  return (
      <div>
        {Array.isArray(submissions) ? (
            <>
              <ClassSummary submissions={submissions}/>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by student name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <SearchIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"/>
                  </div>
                  <button
                      onClick={onRefresh}
                      className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300"
                  >
                    <RefreshIcon className="h-5 w-5 mr-2"/>
                    Refresh
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                      {['Student Name', 'Submitted At', 'Status', 'Grade', 'Actions'].map((header, index) => (
                          <th
                              key={header}
                              scope="col"
                              className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${index < 2 ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                              onClick={() => index < 2 && handleSort(header.toLowerCase().replace(' ', '_'))}
                          >
                            <div className="flex items-center">
                              {header}
                              {index < 2 && sortColumn === header.toLowerCase().replace(' ', '_') && (
                                  sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4 ml-1"/> :
                                      <ChevronDownIcon className="h-4 w-4 ml-1"/>
                              )}
                            </div>
                          </th>
                      ))}
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedSubmissions.map((submission) => (
                        <tr key={submission.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{submission.student_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div
                                className="text-sm text-gray-500">{new Date(submission.submitted_at).toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <GradingStatus status={submission.status}/>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {submission.status === 'graded' ? (
                                <div className="flex items-center space-x-2">
                                  <CircularProgressBar percentage={Math.round(submission.overall_score * 100)}/>
                                  <span>
                                    {(submission.overall_score * max_score).toFixed(2)} / {max_score.toFixed(2)}{' '}
                            </span>
                                </div>
                            ) : (
                                'N/A'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                                onClick={() => setSelectedSubmission(submission)}
                                className="text-indigo-600 hover:text-indigo-900 mr-2"
                                title="View Details"
                            >
                              <EyeIcon className="h-5 w-5"/>
                            </button>
                            <button
                                onClick={() => handleDelete(submission.id)}
                                className="text-red-600 hover:text-red-900 ml-2"
                                title="Delete Submission"
                            >
                              <TrashIcon className="h-5 w-5"/>
                            </button>
                            {/*{submission.status === 'graded' ? (*/}
                            {/*    <button*/}
                            {/*        onClick={() => handleStartGrading(submission)}*/}
                            {/*        className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-xs"*/}
                            {/*    >*/}
                            {/*      Review Grade*/}
                            {/*    </button>*/}
                            {/* (*/}
                            {/*    <button*/}
                            {/*        onClick={() => handleDelete(submission.id)}*/}
                            {/*        className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs"*/}
                            {/*    >*/}
                            {/*      Delete*/}
                            {/*    </button>*/}
                            {/*)*/}
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {selectedSubmission && (
                  <SubmissionDetailsModal
                      submission={selectedSubmission}
                      rubric={rubric}
                      onClose={() => setSelectedSubmission(null)}
                      onOverrideGrade={(updatedSubmission) => {
                        // Update the submission in the list
                        const updatedSubmissions = submissions.map(sub =>
                            sub.id === updatedSubmission.id ? updatedSubmission : sub
                        );
                        setSelectedSubmission(null);

                      }}
                  />
              )}
              {gradingSubmission && (
                  <GradingPipeline
                      submission={gradingSubmission}
                      rubric={rubric}
                      onClose={handleCloseGrading}
                  />
              )}
            </>
        ) : (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
              <p className="font-bold">Warning</p>
              <p>No submissions data available or data is in an unexpected format.</p>
            </div>
        )}
      </div>
  );
}

export default SubmissionTable;