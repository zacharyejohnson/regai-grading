// KnowledgeBaseList.js
import React from 'react';
import { motion } from 'framer-motion';
import { DocumentTextIcon, AcademicCapIcon, ChatIcon } from '@heroicons/react/outline';

function KnowledgeBaseList({ items, onItemClick, selectedItemId }) {
  const getIcon = (itemType) => {
    switch (itemType) {
      case 'rubric':
        return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
      case 'grade':
        return <AcademicCapIcon className="h-5 w-5 text-green-500" />;
      case 'critique':
        return <ChatIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {items.length === 0 ? (
        <p className="p-4 text-gray-500">No items available</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {items.map((item) => (
            <motion.li
              key={item.id}
              className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                item.id === selectedItemId ? 'bg-indigo-50' : ''
              }`}
              onClick={() => onItemClick(item)}
              whileHover={{ backgroundColor: '#F3F4F6' }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-3">
                {getIcon(item.item_type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1)}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  item.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {item.status}
                </span>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default KnowledgeBaseList;