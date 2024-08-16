// hooks/useKnowledgeBaseItems.js
import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export const useKnowledgeBaseItems = (assignmentId, itemType) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    if (!assignmentId || !itemType) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/knowledge-base/', {
        params: { assignment: assignmentId, item_type: itemType }
      });
      setItems(response.data.results || []);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching knowledge base items');
    } finally {
      setLoading(false);
    }
  }, [assignmentId, itemType]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const createItem = async (newItem) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/knowledge-base/', newItem);
      setItems(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err.message || 'An error occurred while creating the item');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (id, updatedItem) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/knowledge-base/${id}/`, updatedItem);
      setItems(prev => prev.map(item =>
        item.id === id ? response.data : item
      ));
      return response.data;
    } catch (err) {
      setError(err.message || 'An error occurred while updating the item');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/knowledge-base/${id}/`);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err.message || 'An error occurred while deleting the item');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const approveItem = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/knowledge-base/${id}/approve/`);
      setItems(prev => prev.map(item =>
        item.id === id ? response.data : item
      ));
      return response.data;
    } catch (err) {
      setError(err.message || 'An error occurred while approving the item');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    items,
    loading,
    error,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    approveItem
  };
};