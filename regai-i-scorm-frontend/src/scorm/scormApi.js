
let scormAPI = null;

const initializeScormAPI = (assignmentId, submissionId) => {
  if (!scormAPI) {
    // Access ScormAPI from the global scope (window object)
    scormAPI = window.ScormAPI;
  }
};

export const initializeSCORM = async (assignmentId, submissionId) => {
  initializeScormAPI(assignmentId, submissionId);
  return scormAPI.initialize();
};

export const finishSCORM = async () => {
  if (!scormAPI) {
    console.error('SCORM API not initialized');
    return false;
  }
  return scormAPI.terminate();
};

export const getSCORMValue = async (element) => {
  if (!scormAPI) {
    console.error('SCORM API not initialized');
    return null;
  }
  return scormAPI.getValue(element);
};

export const setSCORMValue = async (element, value) => {
  if (!scormAPI) {
    console.error('SCORM API not initialized');
    return false;
  }
  return scormAPI.setValue(element, value);
};

export const commitSCORM = async () => {
  if (!scormAPI) {
    console.error('SCORM API not initialized');
    return false;
  }
  return scormAPI.commit();
};

export const getLastError = () => {
  if (!scormAPI) {
    console.error('SCORM API not initialized');
    return '0';
  }
  return scormAPI.getLastError();
};

export const getErrorString = (errorCode) => {
  if (!scormAPI) {
    console.error('SCORM API not initialized');
    return '';
  }
  return scormAPI.getErrorString(errorCode);
};

export const getDiagnostic = (errorCode) => {
  if (!scormAPI) {
    console.error('SCORM API not initialized');
    return '';
  }
  return scormAPI.getDiagnostic(errorCode);
};