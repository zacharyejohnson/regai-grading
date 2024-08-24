import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import AssignmentView from './components/AssignmentView';
import SubmissionForm from './components/SubmissionForm';
import HowItWorks from './components/HowItWorks';
import Header from './components/Header';
import Footer from './components/Footer';
import apiEndpoints from './apiService';

function App() {
  const [assignmentId, setAssignmentId] = useState(null);

  useEffect(() => {
    // Fetch the assignment ID from a configuration file or environment variable
    const fetchAssignmentId = async () => {
      try {
        const response = await apiEndpoints.config.getAssignmentId();
        setAssignmentId(response.assignmentId);
      } catch (error) {
        console.error('Failed to fetch assignment ID:', error);
      }
    };
    fetchAssignmentId();
  }, []);

  if (!assignmentId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<AssignmentView assignmentId={assignmentId} />} />
          <Route path="/submit" element={<SubmissionForm assignmentId={assignmentId} />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;