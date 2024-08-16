// AssignmentCard.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';
import truncateText from "../utils/truncateText";
import { BookOpenIcon, TrashIcon, ExternalLinkIcon } from '@heroicons/react/outline';

function AssignmentCard({ assignment, onDelete }) {
  const [submissionCount, setSubmissionCount] = useState(0);
  const [newSubmissions, setNewSubmissions] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubmissions();
    const interval = setInterval(fetchSubmissions, 30000);
    return () => clearInterval(interval);
  }, [assignment.id]);

  const fetchSubmissions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/submissions/?assignment=${assignment.id}`);
      const submissions = response.data.results || [];
      setSubmissionCount(submissions.length);

      const newCount = submissions.filter(sub =>
        sub.status === 'graded' && new Date(sub.graded_at) > new Date(assignment.last_viewed)
      ).length;
      setNewSubmissions(newCount);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissionCount(0);
    }
  };

  return (
    <motion.div
      className="bg-white shadow-lg rounded-lg p-6 relative"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
    >
      {newSubmissions > 0 && (
        <motion.div
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {newSubmissions}
        </motion.div>
      )}
      <h3 className="text-xl font-bold mb-2">{assignment.title}</h3>
      <p className="text-gray-600 mb-4">{truncateText(assignment.description, 30)}</p>
      <div className="flex justify-between items-center">
        <Link
          to={`/assignment/${assignment.id}`}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <ExternalLinkIcon className="w-5 h-5 mr-2" />
          View Details
        </Link>
        <div className="text-sm text-gray-500">
          {submissionCount} submission{submissionCount !== 1 ? 's' : ''}
        </div>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/knowledge-base/${assignment.id}`)}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <BookOpenIcon className="w-5 h-5 mr-2" />
          Knowledge Base
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDelete(assignment.id)}
          className="text-red-500 hover:text-red-700 flex items-center"
        >
          <TrashIcon className="w-5 h-5 mr-1" />
          Delete
        </motion.button>
      </div>
    </motion.div>
  );
}

export default AssignmentCard;