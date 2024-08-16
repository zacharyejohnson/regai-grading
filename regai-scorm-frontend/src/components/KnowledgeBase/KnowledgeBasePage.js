// KnowledgeBasePage.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';
import { DocumentTextIcon, AcademicCapIcon, ChatIcon } from '@heroicons/react/outline';
import LoadingSpinner from '../LoadingSpinner';

const itemTypes = [
  { name: 'Rubrics', icon: DocumentTextIcon, type: 'rubric' },
  { name: 'Grades', icon: AcademicCapIcon, type: 'grade' },
  { name: 'Critiques', icon: ChatIcon, type: 'critique' },
];

function KnowledgeBasePage() {
  const [selectedType, setSelectedType] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedType) {
      fetchItems();
    }
  }, [selectedType]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/knowledge-base/?item_type=${selectedType.type}`);
      setItems(response.data.results || []);
    } catch (error) {
      console.error('Error fetching knowledge base items:', error);
      setError('Failed to fetch knowledge base items.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <h1 className="text-3xl font-bold mb-6">Knowledge Base</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {itemTypes.map((type) => (
          <motion.div
            key={type.type}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`bg-white shadow-lg rounded-lg p-6 cursor-pointer ${
              selectedType?.type === type.type ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedType(type)}
          >
            <type.icon className="w-12 h-12 text-blue-500 mb-4" />
            <h2 className="text-xl font-bold">{type.name}</h2>
          </motion.div>
        ))}
      </div>

      {selectedType && (
        <div>
          <h2 className="text-2xl font-bold mb-4">{selectedType.name}</h2>
          {loading ? (
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
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: { y: 0, opacity: 1 }
                    }}
                    className="bg-white shadow-lg rounded-lg p-6"
                  >
                    <h3 className="text-lg font-bold mb-2">ID: {item.id}</h3>
                    <p className="text-gray-600 mb-2">Status: {item.status}</p>
                    <p className="text-gray-600 mb-2">Created: {new Date(item.created_at).toLocaleString()}</p>
                    <p className="text-gray-600 mb-2">Assignment: {item.assignment_title}</p>
                    <button
                      onClick={() => {/* Implement view details logic */}}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mt-2"
                    >
                      View Details
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default KnowledgeBasePage;