// hooks/useAssignments.js
import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export const useAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/assignments/');
      setAssignments(response.data.results || []);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const createAssignment = async (newAssignment) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/assignments/', newAssignment);
      setAssignments(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err.message || 'An error occurred while creating the assignment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAssignment = async (id, updatedAssignment) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/assignments/${id}/`, updatedAssignment);
      setAssignments(prev => prev.map(assignment =>
        assignment.id === id ? response.data : assignment
      ));
      return response.data;
    } catch (err) {
      setError(err.message || 'An error occurred while updating the assignment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAssignment = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/assignments/${id}/`);
      setAssignments(prev => prev.filter(assignment => assignment.id !== id));
    } catch (err) {
      setError(err.message || 'An error occurred while deleting the assignment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    assignments,
    loading,
    error,
    fetchAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment
  };
};