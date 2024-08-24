import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from "../../../regai-frontend/src/components/utils/api";

function Dashboard() {
  const [assignments, setAssignments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '' });

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = () => {
    api.get('/assignments/')
      .then(response => setAssignments(response.data))
      .catch(error => console.error('Error fetching assignments:', error));
  };

  const handleCreateAssignment = (e) => {
    e.preventDefault();
    api.post('/assignments/create_assignment/', newAssignment)
      .then(response => {
        setAssignments([...assignments, response.data]);
        setShowCreateModal(false);
        setNewAssignment({ title: '', description: '' });
      })
      .catch(error => console.error('Error creating assignment:', error));
  };

  const handleDeleteAssignment = (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      api.delete(`/assignments/${id}/`)
        .then(() => {
          setAssignments(assignments.filter(a => a.id !== id));
        })
        .catch(error => console.error('Error deleting assignment:', error));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Assignments</h1>
        <button onClick={() => setShowCreateModal(true)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Create Assignment
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map(assignment => (
          <div key={assignment.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {assignment.title}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {assignment.description.substring(0, 100)}...
              </p>
              <div className="mt-4 flex justify-between">
                <Link to={`/assignment/${assignment.id}`} className="text-blue-600 hover:text-blue-800">
                  View Details
                </Link>
                <button onClick={() => handleDeleteAssignment(assignment.id)} className="text-red-600 hover:text-red-800">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {showCreateModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateAssignment}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">Title</label>
                    <input type="text" id="title" value={newAssignment.title} onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                    <textarea id="description" value={newAssignment.description} onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" rows="3"></textarea>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
                    Create
                  </button>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;