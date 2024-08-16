// AssignmentSelector.js
import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function AssignmentSelector({ onSelect }) {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/assignments/');
      setAssignments(response.data.results || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleChange = (e) => {
    const assignmentId = e.target.value;
    setSelectedAssignment(assignmentId);
    onSelect(assignmentId);
  };

  return (
    <div className="mb-6">
      <label htmlFor="assignment" className="block text-sm font-medium text-gray-700">
        Select Assignment
      </label>
      <select
        id="assignment"
        name="assignment"
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        value={selectedAssignment}
        onChange={handleChange}
      >
        <option value="">Select an assignment</option>
        {assignments.map((assignment) => (
          <option key={assignment.id} value={assignment.id}>
            {assignment.title}
          </option>
        ))}
      </select>
    </div>
  );
}

export default AssignmentSelector;