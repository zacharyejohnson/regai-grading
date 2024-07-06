import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function AssignmentView() {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    fetchAssignment();
    fetchSubmissions();
  }, [id]);

  const fetchAssignment = () => {
    axios.get(`/api/assignments/${id}/`)
      .then(response => setAssignment(response.data))
      .catch(error => console.error('Error fetching assignment:', error));
  };

  const fetchSubmissions = () => {
    axios.get(`/api/assignments/${id}/submissions/`)
      .then(response => setSubmissions(response.data))
      .catch(error => console.error('Error fetching submissions:', error));
  };

  const handleFileUpload = (event) => {
    const formData = new FormData();
    formData.append('file', event.target.files[0]);
    axios.post(`/api/assignments/${id}/upload_submissions/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then(() => {
      fetchSubmissions();
    })
    .catch(error => console.error('Error uploading submission:', error));
  };

  if (!assignment) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{assignment.title}</h1>
      <p className="mb-4">{assignment.description}</p>
      <div className="mb-6">
        <Link to={`/rubric/${assignment.id}`} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4">
          Edit Rubric
        </Link>
        <label className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded cursor-pointer">
          Upload Submission
          <input type="file" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>
      <h2 className="text-2xl font-bold mb-4">Submissions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {submissions.map(submission => (
          <div key={submission.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <p className="text-sm text-gray-500">Submitted at: {new Date(submission.submitted_at).toLocaleString()}</p>
              <p className="mt-2">Grade: {submission.grade !== null ? submission.grade : 'Not graded'}</p>
              <Link to={`/grading/${submission.id}`} className="mt-4 inline-block text-blue-600 hover:text-blue-800">
                View Grading Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AssignmentView;