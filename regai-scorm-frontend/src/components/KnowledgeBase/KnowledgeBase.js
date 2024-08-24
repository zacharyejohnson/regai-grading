import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import LoadingSpinner from '../LoadingSpinner';
import Button from '../Common/Button';
import KnowledgeBaseItem from './KnowledgeBaseItem';
import KnowledgeBaseItemForm from './KnowledgeBaseItemForm';

function KnowledgeBase() {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [knowledgeItems, setKnowledgeItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      fetchKnowledgeItems(selectedAssignment.id);
    }
  }, [selectedAssignment]);

  const fetchAssignments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/assignments/`);
      setAssignments(response.data);
      if (response.data.length > 0) {
        setSelectedAssignment(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setError('Failed to fetch assignments. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKnowledgeItems = async (assignmentId) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/knowledge_base/${assignmentId}/`);
      console.log("Knowledge base items: ", response)
      setKnowledgeItems(response.data);
    } catch (error) {
      console.error('Error fetching knowledge base items:', error);
      setError('Failed to fetch knowledge base items. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/knowledge-base/search/?query=${searchQuery}`);
      setKnowledgeItems(response.data);
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      setError('Failed to search knowledge base. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (newItem) => {
    try {
      const response = await api.post(`/knowledge-base/`, {
        ...newItem,
        assignment: selectedAssignment.id,
      });
      setKnowledgeItems([response.data, ...knowledgeItems]);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding knowledge base item:', error);
      setError('Failed to add knowledge base item. Please try again.');
    }
  };

  const handleUpdateItem = async (updatedItem) => {
    try {
      const response = await api.put(`/knowledge-base/${updatedItem.id}/`, updatedItem);
      setKnowledgeItems(knowledgeItems.map(item => item.id === updatedItem.id ? response.data : item));
    } catch (error) {
      console.error('Error updating knowledge base item:', error);
      setError('Failed to update knowledge base item. Please try again.');
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await api.delete(`/knowledge-base/${itemId}/`);
      setKnowledgeItems(knowledgeItems.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting knowledge base item:', error);
      setError('Failed to delete knowledge base item. Please try again.');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600 text-center">{error}</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Knowledge Base</h1>
      <div>
        <label htmlFor="assignment-select" className="block text-sm font-medium text-gray-700">Select Assignment</label>
        <select
          id="assignment-select"
          value={selectedAssignment?.id || ''}
          onChange={(e) => setSelectedAssignment(assignments.find(a => a.id === Number(e.target.value)))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {assignments.map(assignment => (
            <option key={assignment.id} value={assignment.id}>{assignment.title}</option>
          ))}
        </select>
      </div>
      <form onSubmit={handleSearch} className="flex space-x-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search knowledge base..."
          className="flex-grow px-4 py-2 border rounded"
        />
        <Button type="submit">Search</Button>
      </form>
      <Button onClick={() => setShowAddForm(true)}>Add New Item</Button>
      {showAddForm && (
        <KnowledgeBaseItemForm onSubmit={handleAddItem} onCancel={() => setShowAddForm(false)} />
      )}
      <div className="space-y-4">
        {knowledgeItems.map((item) => (
          <KnowledgeBaseItem
            key={item.id}
            item={item}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
          />
        ))}
      </div>
    </div>
  );
}

export default KnowledgeBase;