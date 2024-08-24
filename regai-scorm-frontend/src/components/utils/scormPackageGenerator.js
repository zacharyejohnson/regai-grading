import React, { useState } from 'react';
import apiEndpoints from '../apiService';

const ScormPackageGenerator = ({ assignmentId, assignmentTitle }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateScorm = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await apiEndpoints.assignments.generateScormPackage(assignmentId);

      // Create a Blob from the response data
      const blob = new Blob([response.data], { type: 'application/zip' });

      // Create a link element and trigger the download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `scorm-package-${assignmentTitle}.zip`;
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

    } catch (error) {
      console.error('Error generating SCORM package:', error);
      setError('Failed to generate SCORM package. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleGenerateScorm}
        disabled={isGenerating}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        {isGenerating ? 'Generating...' : 'Generate SCORM Package'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default ScormPackageGenerator;