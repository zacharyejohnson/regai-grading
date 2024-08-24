// components/Course/CourseList.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusIcon } from '@heroicons/react/solid';
import api from '../utils/api';
import CourseCard from './CourseCard';
import CreateCourseModal from './CreateCourseModal';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/api/courses/');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleCreateCourse = async (courseData) => {
    try {
      await api.post('/api/courses/', courseData);
      setShowCreateModal(false);
      fetchCourses();
    } catch (error) {
      console.error('Error creating course:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Courses</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center"
          onClick={() => setShowCreateModal(true)}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Course
        </motion.button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
      {showCreateModal && (
        <CreateCourseModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCourse}
        />
      )}
    </div>
  );
};

export default CourseList;