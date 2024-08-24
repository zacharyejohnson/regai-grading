// AssignmentCard.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import truncateText from "../utils/truncateText";
import generateAssignmentScorm from '../../scripts/generate-assignment-scorm';
import {UserIcon} from "@heroicons/react/solid";
import {BookOpenIcon, ClockIcon, TrashIcon} from "@heroicons/react/solid";
import {FiExternalLink} from "react-icons/fi";
import {BsCloudDownload} from "react-icons/bs";

function AssignmentCard({ assignment, onDelete, courseId }) {
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
      const response = await api.get(`/submissions/?assignment=${assignment.id}`);
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

  const handleGenerateScorm = async () => {
    try {
      // Fetch the full assignment data if needed
      const response = await api.get(`/assignments/${assignment.id}`);
      const fullAssignmentData = response.data;

      // Generate the SCORM package
      await generateAssignmentScorm(assignment.id, fullAssignmentData);

      // The package will be automatically downloaded by the browser
    } catch (error) {
      console.error('Error generating SCORM package:', error);
    }
  };

  return (
    <motion.div
      className="bg-white shadow-lg rounded-lg overflow-hidden transition-shadow duration-300 hover:shadow-xl"
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="p-6 relative">
        {newSubmissions > 0 && (
          <motion.div
            className="absolute top-4 right-4 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {newSubmissions}
          </motion.div>
        )}
        <h3 className="text-2xl font-bold mb-3 text-gray-800">{assignment.title}</h3>
        <p className="text-gray-600 mb-4">{truncateText(assignment.description, 100)}</p>
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <ClockIcon className="w-4 h-4 mr-2" />
          <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center text-sm text-gray-500 mb-6">
          <UserIcon className="w-4 h-4 mr-2" />
          <span>{submissionCount} submission{submissionCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Link
            to={`/course/${courseId}/assignment/${assignment.id}`}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition duration-300"
          >
            <FiExternalLink className="w-5 h-5 mr-2" />
            View Details
          </Link>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGenerateScorm}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition duration-300"
          >
            <BsCloudDownload className="w-5 h-5 mr-2" />
            SCORM Package
          </motion.button>
        </div>
      </div>
      <div className="bg-gray-100 px-6 py-4 flex justify-between items-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/knowledge-base/${assignment.id}`)}
          className="text-blue-600 hover:text-blue-800 font-semibold flex items-center transition duration-300"
        >
          <BookOpenIcon className="w-5 h-5 mr-2" />
          Knowledge Base
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDelete(assignment.id)}
          className="text-red-500 hover:text-red-700 flex items-center transition duration-300"
        >
          <TrashIcon className="w-5 h-5 mr-1" />
          Delete
        </motion.button>
      </div>
    </motion.div>
  );
}

export default AssignmentCard;