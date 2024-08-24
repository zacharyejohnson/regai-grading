// KnowledgeBaseItemView.js
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import KnowledgeBaseItemForm from './KnowledgeBaseItemForm';
import KnowledgeBaseItemDetail from './KnowledgeBaseItemList';

const KnowledgeBaseItemView = ({ item, onUpdate, onApprove }) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleEditClick = () => setIsEditing(true);
  const handleCancelEdit = () => setIsEditing(false);

  const handleSubmit = async (updatedItem) => {
    await onUpdate(updatedItem);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <KnowledgeBaseItemForm
              item={item}
              onSubmit={handleSubmit}
              onCancel={handleCancelEdit}
            />
          </motion.div>
        ) : item ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <KnowledgeBaseItemDetail
              item={item}
              onEditClick={handleEditClick}
              onApprove={onApprove}
            />
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-gray-500 mt-20"
          >
            <p>Select an item from the list to view details or edit.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KnowledgeBaseItemView;