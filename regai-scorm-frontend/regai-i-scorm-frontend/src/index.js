import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initializeSCORMWrapper, finishSCORMWrapper } from './scorm/scorm-entry';

const container = document.getElementById('root');
const root = createRoot(container);

const renderApp = () => {
  root.render(
    <React.StrictMode>
      <Router>
        <App />
      </Router>
    </React.StrictMode>
  );
};

window.onload = async () => {
  console.log('Window loaded');
  if (window.ScormAPI) {
    try {
      await initializeSCORMWrapper();
      console.log('SCORM initialized successfully for Student Portal');
    } catch (error) {
      console.error('Error initializing SCORM for Student Portal:', error);
    }
  } else {
    console.warn('SCORM API not found. Running in non-SCORM environment.');
  }
  renderApp();
};

window.onbeforeunload = async () => {
  console.log('Window unloading');
  if (window.ScormAPI) {
    try {
      await finishSCORMWrapper();
      console.log('SCORM terminated successfully for Student Portal');
    } catch (error) {
      console.error('Error terminating SCORM for Student Portal:', error);
    }
  }
};

reportWebVitals(console.log);