// KnowledgeBaseItemList.js
import React from 'react';
import { motion } from 'framer-motion';
import LoadingSpinner from '../LoadingSpinner';

const KnowledgeBaseItemList = ({ items, selectedItemId, onItemSelect, loading }) => {
  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-medium mb-2">Items</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <motion.li
            key={item.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-2 rounded cursor-pointer ${
              selectedItemId === item.id ? 'bg-indigo-100' : 'hover:bg-gray-100'
            }`}
            onClick={() => onItemSelect(item)}
          >
            <div className="flex justify-between items-center">
              <span>{item.id}</span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                item.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {item.status}
              </span>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
};

export default KnowledgeBaseItemList;