let scormAPI = null;

const initializeScormAPI = () => {
  if (!scormAPI) {
    scormAPI = window.ScormAPI;
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

export const getAssignmentData = async () => {
  const assignmentId = window.ASSIGNMENT_ID;
  if (!assignmentId) {
    console.error('Assignment ID not found');
    return null;
  }

  try {
    const response = await fetch(`/api/assignments/${assignmentId}/`);
    if (!response.ok) throw new Error('Failed to fetch assignment data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching assignment data:', error);
    return null;
  }
};

export const submitAssignment = async (submissionText) => {
  const assignmentId = window.ASSIGNMENT_ID;
  if (!assignmentId) {
    console.error('Assignment ID not found');
    return false;
  }

  try {
    const response = await fetch(`/api/assignments/${assignmentId}/submit_text/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: submissionText,
        student_name: 'SCORM User', // You might want to get this from SCORM data
      }),
    });

    if (!response.ok) throw new Error('Submission failed');

    const result = await response.json();

    // Update SCORM data
    scormAPI.setValue('cmi.core.lesson_status', 'completed');
    scormAPI.setValue('cmi.core.score.raw', result.score);
    scormAPI.commit();

    return true;
  } catch (error) {
    console.error('Error submitting assignment:', error);
    return false;
  }
};