// components/KnowledgeBase/AssignmentKnowledgeBaseCycle.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchSubmissionsWithCycles } from '../utils/knowledgeBaseApi';
import SubmissionCycle from './SubmissionCycle';

const AssignmentKnowledgeBaseCycle = () => {
  const { assignmentId } = useParams();
  const [submissionCycles, setSubmissionCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSubmissionCycles = async () => {
      try {
        setLoading(true);
        const cycles = await fetchSubmissionsWithCycles(assignmentId);
        setSubmissionCycles(cycles);
      } catch (err) {
        setError('Failed to load submission cycles');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSubmissionCycles();
  }, [assignmentId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto p-4"
    >
      <h1 className="text-3xl font-bold mb-6">Assignment Knowledge Base Cycles</h1>
      {submissionCycles.map((submissionCycle, index) => (
        <SubmissionCycle key={submissionCycle.submission.id} submissionCycle={submissionCycle} index={index} />
      ))}
    </motion.div>
  );
};

export default AssignmentKnowledgeBaseCycle;