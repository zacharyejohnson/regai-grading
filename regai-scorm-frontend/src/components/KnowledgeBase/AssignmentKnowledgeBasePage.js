import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchSubmissionsWithCycles, updateSubmission, updateKnowledgeBaseItem } from '../utils/knowledgeBaseApi';
import SubmissionGradingCard from './SubmissionGradingCard';
import LoadingSpinner from '../LoadingSpinner';
import { QuestionMarkCircleIcon, LightBulbIcon, RefreshIcon } from '@heroicons/react/outline';

const InfoModal = ({ isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto"
          onClick={e => e.stopPropagation()}
        >
          <h2 className="text-2xl font-bold mb-4">Understanding the Assignment Knowledge Base</h2>
          <div className="space-y-4">
            <p>Welcome to the Assignment Knowledge Base! This page is designed to help you review and manage student submissions for a specific assignment. Here's what you can do:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>View Submissions:</strong> Each card represents a student's submission. Click on a card to expand and see the grading cycle.</li>
              <li><strong>Grading Cycle:</strong> The expanded view shows the entire grading process, from initial submission to final grade.</li>
              <li><strong>Interact with Items:</strong> Click on any item in the grading cycle to view details or make edits.</li>
              <li><strong>Approve Items:</strong> Use the 'Approve' button to validate grades, critiques, and revisions.</li>
              <li><strong>View Full Submission:</strong> Click on the submission item to read the entire student's work.</li>
              <li><strong>Track Progress:</strong> The final grade is displayed as a percentage, giving you a quick overview of performance.</li>
            </ul>
            <p>This interface is designed to streamline the grading process and ensure consistency across all submissions. If you have any questions, please contact the system administrator.</p>
          </div>
          <button
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
            onClick={onClose}
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const AssignmentKnowledgeBasePage = () => {
  const { assignmentId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rubric, setRubric] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [assignmentDetails, setAssignmentDetails] = useState(null);
  const [stats, setStats] = useState({ total: 0, graded: 0, averageScore: 0 });

  const loadSubmissions = async () => {
    try {
      const fetchedSubmissions = await fetchSubmissionsWithCycles(assignmentId);
      setSubmissions(fetchedSubmissions);
    } catch (error) {
      console.error('Error loading submissions:', error);
      setError('Failed to load submissions. Please try again.');
    }
  };

  const fetchRubric = async (assignmentId) => {
  try {
    const response = await fetch(`/api/rubrics/?assignment=${assignmentId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch rubric');
    }
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      setRubric(data.results[0]);
    } else {
      throw new Error('No rubric found for this assignment');
    }
  } catch (error) {
    console.error('Error fetching rubric:', error);
    setError('Failed to load rubric. Please try again.');
  }
};

   useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([loadSubmissions(), fetchRubric(assignmentId)]);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [assignmentId]);

  const fetchAssignmentDetails = async (assignmentId) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`);
      if (!response.ok) throw new Error('Failed to fetch assignment details');
      const data = await response.json();
      setAssignmentDetails(data);
    } catch (error) {
      console.error('Error fetching assignment details:', error);
      setError('Failed to load assignment details. Please try again.');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadSubmissions(),
          fetchRubric(assignmentId),
          fetchAssignmentDetails(assignmentId)
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [assignmentId]);

  useEffect(() => {
    if (submissions.length > 0) {
      const gradedSubmissions = submissions.filter(s => s.status === 'graded');
      const totalScore = gradedSubmissions.reduce((sum, s) => sum + s.overall_score, 0);
      setStats({
        total: submissions.length,
        graded: gradedSubmissions.length,
        averageScore: gradedSubmissions.length > 0 ? totalScore / gradedSubmissions.length : 0
      });
    }
  }, [submissions]);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const fetchedSubmissions = await fetchSubmissionsWithCycles(assignmentId);
      setSubmissions(fetchedSubmissions);
    } catch (error) {
      console.error('Error refreshing submissions:', error);
      setError('Failed to refresh submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto p-4 space-y-8"
    >
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Assignment Knowledge Base</h1>
        <p className="text-xl">{assignmentDetails?.title || 'Assignment Details'}</p>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Overview</h2>
          <button
            onClick={() => setShowInfoModal(true)}
            className="flex items-center text-blue-500 hover:text-blue-700 transition duration-300"
          >
            <QuestionMarkCircleIcon className="w-5 h-5 mr-1" />
            How it works
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-100 p-4 rounded-lg">
            <p className="text-lg font-semibold">Total Submissions</p>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <p className="text-lg font-semibold">Graded Submissions</p>
            <p className="text-3xl font-bold text-green-600">{stats.graded}</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg">
            <p className="text-lg font-semibold">Average Score</p>
            <p className="text-3xl font-bold text-yellow-600">{(stats.averageScore * 100).toFixed(2)}%</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Student Submissions</h2>
        <button
          onClick={handleUpdate}
          className="flex items-center bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-300"
        >
          <RefreshIcon className="w-5 h-5 mr-2" />
          Refresh Submissions
        </button>
      </div>

      <AnimatePresence>
        {submissions.map((submission) => (
          <SubmissionGradingCard
            key={submission.id}
            submission={submission}
            rubric={rubric}
            isExpanded={expandedSubmission === submission.id}
            onToggleExpand={() => setExpandedSubmission(
              expandedSubmission === submission.id ? null : submission.id
            )}
            onUpdate={handleUpdate}
          />
        ))}
      </AnimatePresence>

      {submissions.length === 0 && (
        <div className="text-center py-12">
          <LightBulbIcon className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600">No submissions yet. Check back later or refresh the page.</p>
        </div>
      )}

      <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
    </motion.div>
  );
};

export default AssignmentKnowledgeBasePage;