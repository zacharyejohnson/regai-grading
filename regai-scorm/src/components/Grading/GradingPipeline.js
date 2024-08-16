import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';
import LoadingSpinner from '../LoadingSpinner';
import Button from '../Common/Button';
import GradeDisplay from '../Grading/GradeDisplay';
import CritiqueDisplay from '../Grading/CritiqueDisplay';
import RevisionForm from '../Grading/RevisionForm';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import GradingProgress from "./GradingProgress";
import GradingSummary from "./GradingSummary";

function GradingPipeline({ initialSubmission, onClose }) {
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState(initialSubmission);
  const [loading, setLoading] = useState(false);
  const [gradingResult, setGradingResult] = useState(null);
  const [critiqueResult, setCritiqueResult] = useState(null);
  const [revisionHistory, setRevisionHistory] = useState([]);
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  useEffect(() => {
    if (!submission && submissionId) {
      fetchSubmission();
    } else if (submission) {
      fetchGradingDetails();
    }
  }, [submission, submissionId]);

  const fetchSubmission = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/submissions/${submissionId}/`);
      setSubmission(response.data);
    } catch (error) {
      console.error('Error fetching submission:', error);
      toast.error('Failed to fetch submission');
    } finally {
      setLoading(false);
    }
  };

  const fetchGradingDetails = async () => {
    setLoading(true);
    try {
      const gradeResponse = await axios.get(`${API_BASE_URL}/submissions/${submission.id}/grade/`);
      setGradingResult(gradeResponse.data);

      const critiqueResponse = await axios.get(`${API_BASE_URL}/submissions/${submission.id}/critique/`);
      setCritiqueResult(critiqueResponse.data);

      const revisionsResponse = await axios.get(`${API_BASE_URL}/submissions/${submission.id}/revisions/`);
      setRevisionHistory(revisionsResponse.data);
    } catch (error) {
      console.error('Error fetching grading details:', error);
      toast.error('Failed to fetch grading details');
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherRevision = async (revisionData) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/submissions/${submission.id}/teacher-revision/`, revisionData);
      setRevisionHistory([...revisionHistory, response.data]);
      toast.success('Revision submitted successfully');
      setShowRevisionForm(false);
    } catch (error) {
      console.error('Error submitting teacher revision:', error);
      toast.error('Failed to submit revision');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" onClick={onClose}>
      <div className="relative top-20 mx-auto p-5 border w-11/12 shadow-lg rounded-md bg-white" onClick={e => e.stopPropagation()}>
        <div className="mt-3">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Grading Details</h3>

          {submission && (
            <div className="mb-6 bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">Submission Details</h2>
              <p><strong>Student:</strong> {submission.student_name}</p>
              <p><strong>Submitted:</strong> {new Date(submission.submitted_at).toLocaleString()}</p>
            </div>
          )}

          {gradingResult && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">Initial Grade</h4>
              <GradeDisplay grade={gradingResult.grade} />
            </div>
          )}

          {critiqueResult && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">AI Critique</h4>
              <CritiqueDisplay critique={critiqueResult.critique} />
            </div>
          )}

          {revisionHistory.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">Revision History</h4>
              {revisionHistory.map((revision, index) => (
                <div key={index} className="mb-4 p-4 border rounded">
                  <p><strong>Revised by:</strong> {revision.revised_by}</p>
                  <p><strong>Revision date:</strong> {new Date(revision.revision_date).toLocaleString()}</p>
                  <GradeDisplay grade={revision.revised_grade} />
                </div>
              ))}
            </div>
          )}

          {!showRevisionForm ? (
            <Button
              onClick={() => setShowRevisionForm(true)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Add Teacher Revision
            </Button>
          ) : (
            <RevisionForm
              initialGrade={revisionHistory.length > 0 ? revisionHistory[revisionHistory.length - 1].revised_grade : gradingResult.grade}
              onSubmit={handleTeacherRevision}
              onCancel={() => setShowRevisionForm(false)}
            />
          )}

          <div className="mt-6">
            <Button onClick={onClose} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GradingPipeline;