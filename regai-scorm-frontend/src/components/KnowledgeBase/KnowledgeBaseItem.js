import React, { useState } from 'react';
import Button from '../Common/Button';
import KnowledgeBaseItemForm from './KnowledgeBaseItemForm';

function KnowledgeBaseItem({ item, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdate = (updatedItem) => {
    onUpdate(updatedItem);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <KnowledgeBaseItemForm
        initialData={item}
        onSubmit={handleUpdate}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-bold">{item.item_type}</h2>
      <pre className="mt-2 text-gray-600 whitespace-pre-wrap">{JSON.stringify(item.content, null, 2)}</pre>
      <div className="mt-4 space-x-2">
        <Button onClick={() => setIsEditing(true)}>Edit</Button>
        <Button onClick={() => onDelete(item.id)} className="bg-red-500 hover:bg-red-600">Delete</Button>
      </div>
    </div>
  );
}

export default KnowledgeBaseItem;