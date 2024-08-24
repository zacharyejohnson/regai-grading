// components/KnowledgeBase/SubmissionCycle.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import CycleVisualization from './CycleVisualization';
import DocumentViewer from './DocumentViewer';

const SubmissionCycle = ({ submissionCycle, index }) => {
  const [selectedStage, setSelectedStage] = useState('rubric');

  const stages = [
    { id: 'rubric', label: 'Rubric' },
    { id: 'initial_grade', label: 'Initial Grade' },
    { id: 'critique', label: 'Critique' },
    { id: 'final_grade', label: 'Final Grade' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-lg shadow-lg p-6 mb-8"
    >
      <h2 className="text-2xl font-bold mb-4">
        Submission by {submissionCycle.submission.student_name}
      </h2>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/2">
          <CycleVisualization
            stages={stages}
            selectedStage={selectedStage}
            onStageSelect={setSelectedStage}
          />
        </div>
        <div className="md:w-1/2">
          <DocumentViewer
            item={submissionCycle.cycle[selectedStage]}
            stage={selectedStage}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default SubmissionCycle;