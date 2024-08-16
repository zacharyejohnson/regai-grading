import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { initializeSCORM, finishSCORM } from './components/utils/api';

window.onload = function() {
  initializeSCORM();

  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  );
};

window.onunload = function() {
  finishSCORM();
};