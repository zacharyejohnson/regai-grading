// components/Course/CourseCard.js

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpenIcon, ClockIcon } from '@heroicons/react/solid';

const CourseCard = ({ course }) => {
  console.log('Course data:', course);
  // Ensure course is defined and has necessary properties
  if (!course || typeof course !== 'object') {
    return null; // or return a placeholder/error component
  }

  const assignmentCount = Array.isArray(course.assignments) ? course.assignments.length : 0;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-white rounded-lg shadow-md overflow-hidden"
    >
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-2">{course.title || 'Untitled Course'}</h2>
        <p className="text-gray-600 mb-4">{course.description || 'No description available'}</p>
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <ClockIcon className="h-5 w-5 mr-1" />
          <span>Created: {course.created_at ? new Date(course.created_at).toLocaleDateString() : 'Unknown date'}</span>
        </div>
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <BookOpenIcon className="h-5 w-5 mr-1" />
          <span>{assignmentCount} Assignment{assignmentCount !== 1 ? 's' : ''}</span>
        </div>
        <Link
          to={`/course/${course.id}`}
          className="block w-full text-center bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-300"
        >
          View Course
        </Link>
      </div>
    </motion.div>
  );
};

export default CourseCard;