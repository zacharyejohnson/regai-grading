import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';
import AssignmentCard from './AssignmentCard';
import CreateAssignmentModal from './CreateAssignmentModal';
import CreateAssignmentButton from './CreateAssignmentButton';
import Pagination from './Pagination';
import LoadingSpinner from '../LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import AssignmentGenerationCard from './AssignmentGenerationCard';
import {BookOpenIcon} from "@heroicons/react/outline";
import {Link} from "react-router-dom";

function Dashboard() {
  const [assignments, setAssignments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [generatingAssignments, setGeneratingAssignments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, [currentPage]);

  const fetchAssignments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/assignments/?page=${currentPage}`);
      setAssignments(response.data.results);
      setTotalPages(Math.ceil(response.data.count / 10));
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setError('Failed to fetch assignments. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAssignment = async (newAssignment) => {
    const tempId = Date.now(); // Temporary ID for the generating assignment
    setGeneratingAssignments([...generatingAssignments, { ...newAssignment, id: tempId, status: 'generating' }]);

    try {
      const response = await axios.post(`${API_BASE_URL}/assignments/`, newAssignment);
      setGeneratingAssignments(prev => prev.map(a => a.id === tempId ? response.data : a));
    } catch (error) {
      console.error('Error creating assignment:', error.response ? error.response.data : error.message);
      alert('Failed to create assignment. Please try again.');
      setGeneratingAssignments(prev => prev.filter(a => a.id !== tempId));
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await axios.delete(`${API_BASE_URL}/assignments/${id}/`);
        setAssignments(assignments.filter(a => a.id !== id));
      } catch (error) {
        console.error('Error deleting assignment:', error);
        alert('Failed to delete assignment. Please try again.');
      }
    }
  };

  const handleAssignmentGenerated = (generatedAssignment) => {
    setGeneratingAssignments(prev => prev.filter(a => a.id !== generatedAssignment.id));
    setAssignments(prev => [generatedAssignment, ...prev]);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Assignments</h1>
        <CreateAssignmentButton onClick={() => setShowCreateModal(true)} />
        <Link
            to="/knowledge-base"
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <BookOpenIcon className="w-5 h-5 mr-2" />
            Knowledge Base
          </Link>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="text-red-600 text-center">{error}</div>
      ) : (
        <AnimatePresence>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.07 } }
            }}
          >
            {generatingAssignments.map(assignment => (
              <AssignmentGenerationCard
                key={assignment.id}
                assignment={assignment}
                onComplete={handleAssignmentGenerated}
              />
            ))}
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
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <AnimatePresence>
        {showCreateModal && (
          <CreateAssignmentModal
            onClose={() => setShowCreateModal(false)}
            onCreateStart={handleCreateAssignment}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Dashboard;