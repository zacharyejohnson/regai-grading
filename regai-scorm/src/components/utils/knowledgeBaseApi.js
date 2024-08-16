// api/knowledgeBase.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';


export const updateSubmission = async (submissionId, updatedData) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/submissions/${submissionId}/`, updatedData);
    return response.data;
  } catch (error) {
    console.error('Error updating submission:', error);
    throw error;
  }
};

export const fetchKnowledgeBaseItem = async (itemType, itemId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${itemType}s/${itemId}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${itemType}:`, error);
    throw error;
  }
};

export const fetchSubmissionsWithCycles = async (assignmentId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/submissions/with_knowledge_base_items?assignment=${assignmentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching submissions with cycles:', error);
    throw error;
  }
};

export const updateKnowledgeBaseItem = async (itemType, itemId, updatedData) => {
  try {
    if (itemType === 'initial_grade' || itemType === 'final_grade'){
    itemType = 'grade';
  }
    console.log(itemType);
    const response = await axios.patch(`${API_BASE_URL}/${itemType}/${itemId}/`, updatedData);
    return response.data;
  } catch (error) {
    console.error(`Error updating ${itemType}:`, error);
    throw error;
  }
};

export const approveKnowledgeBaseItem = async (itemType, updatedContent) => {
  if (itemType === 'initial_grade' || itemType === 'final_grade'){
    itemType = 'grade';
  }
  console.log(itemType);

  if (!updatedContent || !updatedContent.id) {
    throw new Error(`Invalid item: ${JSON.stringify(updatedContent)}`);
  }
  try {
    updatedContent.human_approved = true
    let updatedItem = updatedContent;  // Include the updated content


    if (itemType === 'critique' && updatedItem.grade) {
      updatedItem.grade = updatedItem.grade.id;
    }

    const response = await axios.patch(`${API_BASE_URL}/${itemType}s/${updatedItem.id}/`, updatedItem);
    return response.data;
  } catch (error) {
    console.error(`Error approving ${itemType}:`, error);
    throw error;
  }
};

export const createKnowledgeBaseItem = async (itemType, data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/${itemType}s/`, data);
    return response.data;
  } catch (error) {
    console.error(`Error creating ${itemType}:`, error);
    throw error;
  }
};

export const deleteKnowledgeBaseItem = async (itemType, itemId) => {
  try {
    await axios.delete(`${API_BASE_URL}/${itemType}s/${itemId}/`);
  } catch (error) {
    console.error(`Error deleting ${itemType}:`, error);
    throw error;
  }
};