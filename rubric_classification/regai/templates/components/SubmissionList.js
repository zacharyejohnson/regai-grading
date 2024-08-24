import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from "../../../regai-frontend/src/components/utils/api";

function SubmissionList() {
  const { assignmentId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [assignment, setAssignment] = useState(null);

  useEffect(() => {
    fetchAssignment();
    fetchSubmissions();
  }, [assignmentId]);

  const fetchAssignment = () => {
    api.get(`/assignments/${assignmentId}/`)
      .then(response => setAssignment(response.data))
      .catch(error => console.error('Error fetching assignment:', error));
  };

  const fetchSubmissions = () => {
    api.get(`/assignments/${assignmentId}/submissions/`)
      .then(response => setSubmissions(response.data))
      .catch(error => console.error('Error fetching submissions:', error));
  };

  if (!assignment) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Submissions for {assignment.title}</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submission ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted At
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grade
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {submissions.map((submission) => (
              <tr key={submission.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{submission.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{new Date(submission.submitted_at).toLocaleString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{submission.grade !== null ? submission.grade : 'Not graded'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link to={`/grading/${submission.id}`} className="text-indigo-600 hover:text-indigo-900">
                    View Grading Details
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