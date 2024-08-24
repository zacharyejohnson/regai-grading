// components/Dashboard/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, BookOpenIcon, LightBulbIcon } from '@heroicons/react/solid';
import api from '../utils/api';
import CourseCard from '../Course/CourseCard';
import CreateCourseModal from '../Course/CreateCourseModal';
import LoadingSpinner from '../LoadingSpinner';

function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
  setIsLoading(true);
  setError(null);
  try {
    const response = await api.get('/courses/');
    console.log(response.data)
    setCourses(Array.isArray(response.data.results) ? response.data.results : []);
  } catch (error) {
    console.error('Error fetching courses:', error);
    setError('Failed to fetch courses. Please try again later.');
    setCourses([]);  // Ensure courses is always an array
  } finally {
    setIsLoading(false);
  }
};

  const handleCreateCourse = async (formData) => {
  try {
    const response = await api.post('/courses/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    setCourses([...courses, response.data]);
    setShowCreateModal(false);
  } catch (error) {
    console.error('Error creating course:', error);
    alert('Failed to create course. Please try again.');
  }
};

  const renderContent = () => {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-600 text-center">{error}</div>;
  }

  if (!Array.isArray(courses) || courses.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <LightBulbIcon className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Courses Yet</h2>
        <p className="text-gray-600 mb-6">Get started by creating your first course!</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded inline-flex items-center"
          onClick={() => setShowCreateModal(true)}
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Your First Course
        </motion.button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.07 } }
        }}
      >
        {courses.map(course => (
          <motion.div
            key={course.id}
            variants={{
              hidden: { y: 20, opacity: 0 },
              visible: { y: 0, opacity: 1 }
            }}
          >
            <CourseCard course={course} />
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Courses</h1>
        <div className="flex space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center"
            onClick={() => setShowCreateModal(true)}
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Course
          </motion.button>
          <Link
            to="/knowledge-base"
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <BookOpenIcon className="w-5 h-5 mr-2" />
            Knowledge Base
          </Link>
        </div>
      </div>

      {renderContent()}

      <AnimatePresence>
        {showCreateModal && (
          <CreateCourseModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateCourse}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Dashboard;