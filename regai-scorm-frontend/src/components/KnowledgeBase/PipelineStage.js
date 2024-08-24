// PipelineStages.js
import React from 'react';
import { motion } from 'framer-motion';
import { DocumentTextIcon, AcademicCapIcon, ChatIcon, CheckCircleIcon } from '@heroicons/react/outline';

const pipelineStages = [
  { name: 'Rubric Creation', icon: DocumentTextIcon, type: 'rubric' },
  { name: 'Grading', icon: AcademicCapIcon, type: 'grade' },
  { name: 'Critique Cycle', icon: ChatIcon, type: 'critique' },
  { name: 'Final Grade', icon: CheckCircleIcon, type: 'grade' },
];

const PipelineStages = ({ assignment, onStageSelect }) => {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">{assignment.title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {pipelineStages.map((stage) => (
          <motion.div
            key={stage.name}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white rounded-lg shadow-md p-4 cursor-pointer"
            onClick={() => onStageSelect(stage)}
          >
            <stage.icon className="h-8 w-8 text-indigo-500 mb-2" />
            <h3 className="text-lg font-medium">{stage.name}</h3>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PipelineStages;