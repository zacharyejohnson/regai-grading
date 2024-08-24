let scormAPI = null;
let assignmentData = null;

const initializeScormAPI = () => {
  if (!scormAPI) {
    scormAPI = window.ScormAPI;
  }
  if (!assignmentData) {
    assignmentData = window.ASSIGNMENT_DATA;
  }
};

export const initializeSCORM = async () => {
  initializeScormAPI();
  if (scormAPI) {
    const result = scormAPI.initialize();
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

export const finishSCORM = async () => {
  initializeScormAPI();
  if (scormAPI) {
    return scormAPI.terminate();
  } else {
    console.warn('SCORM API not found');
    return false;
  }
};

export const getSCORMValue = async (element) => {
  initializeScormAPI();
  if (scormAPI) {
    return scormAPI.getValue(element);
  } else {
    console.error('SCORM API not found');
    return null;
  }
};

export const setSCORMValue = async (element, value) => {
  initializeScormAPI();
  if (scormAPI) {
    return scormAPI.setValue(element, value);
  } else {
    console.error('SCORM API not found');
    return false;
  }
};

export const commitSCORM = async () => {
  initializeScormAPI();
  if (scormAPI) {
    return scormAPI.commit();
  } else {
    console.error('SCORM API not found');
    return false;
  }
};

export const getAssignmentData = () => {
  initializeScormAPI();
  return assignmentData;
};

export const submitAssignment = async (submissionText) => {
  initializeScormAPI();
  if (!assignmentData) {
    console.error('Assignment data not found');
    return false;
  }

  try {
    const response = await fetch('/api/assignments/${assignmentData.id}/submit_text/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: submissionText,
        student_name: 'SCORM User', // You might want to get this from SCORM data
      }),
    });

    if (!response.ok) {
      throw new Error('Submission failed');
    }

    const result = await response.json();

    // Update SCORM data
    await setSCORMValue('cmi.core.lesson_status', 'completed');
    await setSCORMValue('cmi.core.score.raw', result.score);
    await commitSCORM();

    return true;
  } catch (error) {
    console.error('Error submitting assignment:', error);
    return false;
  }
};