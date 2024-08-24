import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AssignmentView from './components/AssignmentView';
import SubmissionForm from './components/SubmissionForm';
import HowItWorks from './components/HowItWorks';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<AssignmentView />} />
          <Route path="/submit" element={<SubmissionForm />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;