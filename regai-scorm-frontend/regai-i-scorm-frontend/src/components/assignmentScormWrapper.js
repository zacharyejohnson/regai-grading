import React, { useState, useEffect } from 'react';
import { initializeSCORM, getAssignmentData, submitAssignment } from '../scorm/scormApi';
import AssignmentView from './AssignmentView';
import generateAssignmentScorm from '../scripts/generate-assignment-scorm';

const AssignmentScormWrapper = () => {
  const [assignmentData, setAssignmentData] = useState(null);
  const [isScormInitialized, setIsScormInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      const scormInitialized = await initializeSCORM();
      setIsScormInitialized(scormInitialized);
      if (scormInitialized) {
        const data = await getAssignmentData();
        setAssignmentData(data);
      }
    };
    init();
  }, []);

  const handleSubmit = async (submissionText) => {
    if (isScormInitialized) {
      const result = await submitAssignment(submissionText);
      if (result) {
        alert('Assignment submitted successfully!');
      } else {
        alert('Failed to submit assignment. Please try again.');
      }
    } else {
      alert('SCORM is not initialized. Cannot submit assignment.');
    }
  };

  const handleGenerateScorm = async () => {
    if (!assignmentData) {
      alert('Assignment data not loaded. Cannot generate SCORM package.');
      return;
    }

    try {
      const scormPackagePath = await generateAssignmentScorm(assignmentData.id, assignmentData);

      // Create a download link for the SCORM package
      const link = document.createElement('a');
      link.href = `file://${scormPackagePath}`;
      link.download = `scorm-package-${assignmentData.id}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('SCORM package generated and download started!');
    } catch (error) {
      console.error('Error generating SCORM package:', error);
      alert('Failed to generate SCORM package. Please try again.');
    }
  };

  if (!isScormInitialized) return <div>Initializing SCORM...</div>;
  if (!assignmentData) return <div>Loading assignment data...</div>;

  return (
    <div>
      <AssignmentView
        assignment={assignmentData}
        onSubmit={handleSubmit}
      />
      <button onClick={handleGenerateScorm}>Generate SCORM Package</button>
    </div>
  );
};

export default AssignmentScormWrapper;