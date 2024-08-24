import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// SCORM initialization (only in SCORM environment)
if (window.ScormAPI) {
  window.addEventListener('load', function() {
    console.log('Window loaded');
    const result = window.ScormAPI.initialize();
    if (result === false) {
      console.warn('SCORM initialization failed');
    }
  });
} else {
  console.log('Running in non-SCORM environment');
}