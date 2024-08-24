// components/KnowledgeBase/CycleVisualization.js
import React from 'react';
import { motion } from 'framer-motion';

const CycleVisualization = ({ stages, selectedStage, onStageSelect }) => {
  return (
    <div className="relative w-full h-80">
      {stages.map((stage, index) => (
        <motion.button
          key={stage.id}
          className={`absolute w-24 h-24 rounded-full flex items-center justify-center text-center p-2 ${
            selectedStage === stage.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
          }`}
          style={{
            top: `${50 + 40 * Math.sin((index / stages.length) * 2 * Math.PI)}%`,
            left: `${50 + 40 * Math.cos((index / stages.length) * 2 * Math.PI)}%`,
            transform: 'translate(-50%, -50%)',
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onStageSelect(stage.id)}
        >
          {stage.label}
        </motion.button>
      ))}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: -1 }}>
        <circle
          cx="50%"
          cy="50%"
          r="40%"
          fill="none"
          stroke="#CBD5E0"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      </svg>
    </div>
  );
};

export default CycleVisualization;