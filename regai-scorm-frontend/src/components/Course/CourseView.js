// components/Course/CourseView.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, BookOpenIcon } from '@heroicons/react/solid';
import api from '../utils/api';
import AssignmentCard from '../Dashboard/AssignmentCard';
import CreateAssignmentModal from '../Dashboard/CreateAssignmentModal';
import LoadingSpinner from '../LoadingSpinner';

function CourseView() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourseAndAssignments();
  }, [courseId]);

  const fetchCourseAndAssignments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [courseResponse, assignmentsResponse] = await Promise.all([
        api.get(`/courses/${courseId}/`),
        api.get(`/courses/${courseId}/assignments/`)
      ]);
      setCourse(courseResponse.data);
      setAssignments(assignmentsResponse.data);
    } catch (error) {
      console.error('Error fetching course and assignments:', error);
      setError('Failed to fetch course data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAssignment = async (assignmentData) => {
    try {
      const response = await api.post(`/courses/${courseId}/assignments/`, assignmentData);
      setAssignments([...assignments, response.data]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('Failed to create assignment. Please try again.');
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await api.delete(`/courses/${courseId}/assignments/${assignmentId}/`);
        setAssignments(assignments.filter(a => a.id !== assignmentId));
      } catch (error) {
        console.error('Error deleting assignment:', error);
        alert('Failed to delete assignment. Please try again.');
      }
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600 text-center">{error}</div>;
  if (!course) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
        <p className="text-gray-600">{course.description}</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Assignments</h2>
        <div className="flex space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center"
            onClick={() => setShowCreateModal(true)}
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Assignment
          </motion.button>
          <Link
            to={`/knowledge-base/${courseId}`}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <BookOpenIcon className="w-5 h-5 mr-2" />
            Course Knowledge Base
          </Link>
        </div>
      </div>

      <AnimatePresence>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.07 } }
          }}
        >
          {assignments.map(assignment => (
            <motion.div
              key={assignment.id}
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 }
              }}
            >
              <AssignmentCard
                assignment={assignment}
                onDelete={handleDeleteAssignment}
                courseId={courseId}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showCreateModal && (
          <CreateAssignmentModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateAssignment}
            courseId={course.id}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default CourseView;