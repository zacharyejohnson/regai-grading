import React from 'react';
import Button from '../Common/Button';

function ScoringLevelTable({ levels, onUpdate }) {
  const handleLevelChange = (index, field, value) => {
    const newLevels = [...levels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    onUpdate(newLevels);
  };

  const deleteLevel = (index) => {
    const newLevels = levels.filter((_, i) => i !== index);
    onUpdate(newLevels);
  };

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Name</th>
          <th>Score</th>
          <th>Description</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {levels.map((level, index) => (
          <tr key={index}>
            <td>
              <input
                type="text"
                value={level.name}
                onChange={(e) => handleLevelChange(index, 'name', e.target.value)}
                className="w-full px-2 py-1 border rounded"
              />
            </td>
            <td>
              <input
                type="number"
                value={level.score}
                onChange={(e) => handleLevelChange(index, 'score', parseInt(e.target.value))}
                className="w-full px-2 py-1 border rounded"
              />
            </td>
            <td>
              <input
                type="text"
                value={level.description}
                onChange={(e) => handleLevelChange(index, 'description', e.target.value)}
                className="w-full px-2 py-1 border rounded"
              />
            </td>
            <td>
              <Button onClick={() => deleteLevel(index)} variant="danger">Delete</Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ScoringLevelTable;