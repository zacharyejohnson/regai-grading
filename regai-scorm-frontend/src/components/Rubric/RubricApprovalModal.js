import React from 'react';
import Button from '../Common/Button';

function RubricApprovalModal({ assignment, onApprove, onReject }) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">Approve Rubric for {assignment.title}</h2>
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Generated Rubric:</h3>

          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(assignment.rubric, null, 2)}
          </pre>
        </div>
        <div className="flex justify-end space-x-4">
          <Button onClick={() => onApprove(assignment.rubric)} variant="primary">
            Approve Rubric
          </Button>
          <Button onClick={onReject} variant="secondary">
            Reject and Recreate
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RubricApprovalModal;