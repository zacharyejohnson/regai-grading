import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';
import truncateText from "../utils/truncateText";

const stages = ['Creating Assignment', 'Generating Rubric', 'Finalizing'];

function AssignmentGenerationCard({ assignment, onComplete }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/assignments/${assignment.id}/status/`);
        if (response.data.status === 'complete') {
          onComplete(assignment);
        } else {
          setCurrentStage((prevStage) => (prevStage + 1) % stages.length);
          setProgress((prevProgress) => Math.min(prevProgress + 33, 99));
          setTimeout(checkStatus, 2000);
        }
      } catch (error) {
        console.error('Error checking assignment status:', error);
      }
    };

    checkStatus();
  }, [assignment.id, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white shadow-lg rounded-lg p-6"
    >
      <h3 className="text-xl font-bold mb-2">{assignment.title}</h3>
      <p className="text-gray-600 mb-4">{truncateText(assignment.description, 30)}</p>
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
              {stages[currentStage]}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block text-blue-600">
              {progress}%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
          <motion.div
            style={{ width: `${progress}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          ></motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default AssignmentGenerationCard;