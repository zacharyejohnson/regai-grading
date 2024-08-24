
let scormAPI = null;


export const initializeSCORM = () => {
  if (window.ScormAPI) {
    const result = window.ScormAPI.initialize();
    if (result === false) {
      console.warn('SCORM initialization failed');
      return false;
    }
    return true;
  } else {
    console.warn('SCORM API not found');
    return false;
  }
};

export const finishSCORM = () => {
  if (window.ScormAPI) {
    return window.ScormAPI.terminate();
  } else {
    console.warn('SCORM API not found');
    return false;
  }
};

export const getSCORMValue = (element) => {
  if (window.ScormAPI) {
    return window.ScormAPI.getValue(element);
  } else {
    console.error('SCORM API not found');
    return '';
  }
};

export const setSCORMValue = (element, value) => {
  if (window.ScormAPI) {
    return window.ScormAPI.setValue(element, value);
  } else {
    console.error('SCORM API not found');
    return false;
  }
};

export const commitSCORM = () => {
  if (window.ScormAPI) {
    return window.ScormAPI.commit();
  } else {
    console.error('SCORM API not found');
    return false;
  }
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