import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';
import Button from '../Common/Button';
import LoadingSpinner from '../LoadingSpinner';

function SubmissionList() {
  const { id: assignmentId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssignmentAndSubmissions();
  }, [assignmentId]);

  const fetchAssignmentAndSubmissions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [assignmentResponse, submissionsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/assignments/${assignmentId}/`),
        axios.get(`${API_BASE_URL}/assignments/${assignmentId}/submissions/`)
      ]);
      setAssignment(assignmentResponse.data);
      setSubmissions(submissionsResponse.data);
    } catch (error) {
      console.error('Error fetching assignment and submissions:', error);
      setError('Failed to fetch data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600 text-center">{error}</div>;
  if (!assignment) return <div>Assignment not found.</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Submissions for {assignment.title}</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {submissions.map((submission) => (
              <tr key={submission.id}>
                <td className="px-6 py-4 whitespace-nowrap">{submission.student_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(submission.submitted_at).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{submission.grade !== null ? `${(submission.grade * 100).toFixed(2)}%` : 'Not graded'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link to={`/submission/${submission.id}/grade`}>
                    <Button variant="secondary">Grade</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SubmissionList;