// CreateAssignmentModal.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../Common/Button';
import apiEndpoints from '../../apiService';

function CreateAssignmentModal({ onClose, courseId }) {
  const [formData, setFormData] = useState({ title: '', description: '', course: courseId });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiEndpoints.assignments.create(formData);
      console.log('Assignment created:', response);
      onClose();
    } catch (error) {
      console.error('Error creating assignment:', error);
      // Handle error (e.g., show error message to user)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center"
    >
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Create New Assignment</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="4"
              required
            ></textarea>
          </div>
          <div className="flex items-center justify-between">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Assignment'}
            </Button>
            <Button onClick={onClose} variant="secondary" disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

export default CreateAssignmentModal;