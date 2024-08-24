import React from 'react';
import { motion } from 'framer-motion';
import { PlusIcon } from '@heroicons/react/solid';

function CreateAssignmentButton({ onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full shadow-lg flex items-center transition duration-300 ease-in-out"
      onClick={onClick}
    >
      <PlusIcon className="h-5 w-5 mr-2" />
      Create Assignment
    </motion.button>
  );
}

export default CreateAssignmentButton;