import { instance } from '../../axiosConfig';

const SCORM_API_BASE_URL = `/scorm-api`;

export const initializeSCORM = async (assignmentId, submissionId) => {
  try {
    const response = await instance.post(`${SCORM_API_BASE_URL}/LMSInitialize/`, { assignment_id: assignmentId, submission_id: submissionId });
    return response.data.result === "true";
  } catch (error) {
    console.error('Error initializing SCORM:', error);
    throw error;
  }
};

export const finishSCORM = async (assignmentId, submissionId) => {
  try {
    const response = await instance.post(`${SCORM_API_BASE_URL}/LMSFinish/`, { assignment_id: assignmentId, submission_id: submissionId });
    return response.data.result === "true";
  } catch (error) {
    console.error('Error finishing SCORM:', error);
    throw error;
  }
};

export const getSCORMValue = async (assignmentId, submissionId, element) => {
  try {
    const response = await instance.post(`${SCORM_API_BASE_URL}/LMSGetValue/`, { assignment_id: assignmentId, submission_id: submissionId, element });
    return response.data.result;
  } catch (error) {
    console.error('Error getting SCORM value:', error);
    throw error;
  }
};

export const setSCORMValue = async (assignmentId, submissionId, element, value) => {
  try {
    const response = await instance.post(`${SCORM_API_BASE_URL}/LMSSetValue/`, { assignment_id: assignmentId, submission_id: submissionId, element, value });
    return response.data.result === "true";
  } catch (error) {
    console.error('Error setting SCORM value:', error);
    throw error;
  }
};

export const commitSCORM = async (assignmentId, submissionId) => {
  try {
    const response = await instance.post(`${SCORM_API_BASE_URL}/LMSCommit/`, { assignment_id: assignmentId, submission_id: submissionId });
    return response.data.result === "true";
  } catch (error) {
    console.error('Error committing SCORM:', error);
    throw error;
  }
};