import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import api, { API_BASE_URL } from '../utils/api';
import RubricDisplay from '../Rubric/RubricDisplay';
import RubricEditModal from '../Rubric/RubricEditModal';
import SubmissionTable from './SubmissionTable';
import { CloudUploadIcon, DocumentTextIcon, AcademicCapIcon } from '@heroicons/react/solid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';
import truncateText from "../utils/truncateText";

function AssignmentView() {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [rubric, setRubric] = useState(null);
  const [rubricId, setRubricId] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [showRubricEditModal, setShowRubricEditModal] = useState(false);
  const [showTextSubmissionModal, setShowTextSubmissionModal] = useState(false);
  const [textSubmission, setTextSubmission] = useState('');
  const [isRubricApproved, setIsRubricApproved] = useState(false);

  useEffect(() => {
  fetchAssignment();
  fetchRubric();
  fetchSubmissions();
}, [id]);

  const handleRubricUpdate = async (updatedRubric) => {
  console.log("Updating rubric in AssignmentView:", updatedRubric);
  try {
    const response = await api.patch(`/rubrics/${updatedRubric.id}/`, updatedRubric);
    console.log("Response from server:", response.data);
    setRubric(response.data);
    setShowRubricEditModal(false);
    toast.success('Rubric updated successfully');
  } catch (error) {
    console.error('Error updating rubric:', error);
    toast.error('Error updating rubric');
  }
};



  const fetchAssignment = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/assignments/${id}/`);
      setAssignment(response.data);
      console.log(assignment);
    } catch (error) {
      console.error('Error fetching assignment:', error);
      toast.error('Error fetching assignment');
    }
  }

  const fetchRubric = async () => {
    try {
      const rubricResponse = await axios.get(`${API_BASE_URL}/rubrics/?assignment=${id}`);
      const fetchedRubric = rubricResponse.data.results[0];
      setRubric(fetchedRubric);
      setRubricId(fetchedRubric.id);  // Store the rubric ID
      setIsRubricApproved(fetchedRubric?.human_approved || false);
    } catch(error) {
      console.error('Error fetching rubric:', error);
      toast.error('Error fetching rubric');
    }
  };

const handleApproveRubric = useCallback(async () => {
    if (!rubric || isRubricApproved) return;

    try {
      await axios.post(`${API_BASE_URL}/assignments/${id}/approve_rubric/`);
      setIsRubricApproved(true);
      toast.success('Rubric approved successfully');
    } catch (error) {
      console.error('Error approving rubric:', error);
      toast.error('Error approving rubric');
    }
  }, [id, rubric, isRubricApproved]);


const fetchSubmissions = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/submissions/`, {
      params: { assignment: id }
    });
    if (Array.isArray(response.data)) {
      setSubmissions(response.data);
    } else if (response.data.results && Array.isArray(response.data.results)) {
      setSubmissions(response.data.results);
    } else {
      console.error('Unexpected response format:', response.data);
      setSubmissions([]);
    }
  } catch (error) {
    console.error('Error fetching submissions:', error);
    toast.error('Error fetching submissions');
    setSubmissions([]);
  }
};

  const handleDeleteSubmission = async (submissionId) => {
    try {
      await axios.delete(`${API_BASE_URL}/submissions/${submissionId}/`);
      fetchSubmissions();
      toast.success('Submission deleted successfully');
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast.error('Error deleting submission');
    }
  };

  const handleFileUpload = async (formData) => {
  formData.append('assignment', id);  // Ensure this is the current assignment ID
  try {
    await axios.post(`${API_BASE_URL}/submissions/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    fetchSubmissions();  // This will now fetch only submissions for the current assignment
    toast.success('Files uploaded successfully');
  } catch (error) {
    console.error('Error uploading files:', error);
    toast.error('Error uploading files');
  }
};

  const onDrop = useCallback((acceptedFiles) => {
  const formData = new FormData();
  formData.append('assignment', id);
  acceptedFiles.forEach(file => {
    formData.append('file', file);
  });
  handleFileUpload(formData);
}, [id]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });


  const handleTextSubmission = async () => {
  try {
    await axios.post(`${API_BASE_URL}/submissions/submit_text/`, {
      content: textSubmission,
      assignment: id,
      student_name: "Anonymous"
    });
    setShowTextSubmissionModal(false);
    setTextSubmission('');
    fetchSubmissions();  // This will now fetch only submissions for the current assignment
    toast.success('Text submission successful');
  } catch (error) {
    console.error('Error submitting text:', error);
    toast.error('Error submitting text');
  }
};


  const handleStartGrading = async (submissionId) => {
  try {
    await axios.post(`${API_BASE_URL}/submissions/${submissionId}/grade/`);
    fetchSubmissions();
    toast.success('Grading completed');
  } catch (error) {
    console.error('Error grading submission:', error);
    toast.error('Error grading submission');
  }
};

  if (!assignment) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  const RubricApprovalWrapper = ({ children }) => {
    if (isRubricApproved) {
      return children;
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-yellow-50 border-2 border-yellow-500 rounded-lg overflow-hidden"
      >
        <div className="bg-yellow-100 p-4 border-b-2 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Rubric Needs Approval</h3>
              <p className="text-sm text-yellow-700">Please review and approve the rubric before grading submissions.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleApproveRubric}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
            >
              Approve Rubric
            </motion.button>
          </div>
        </div>
        {children}
      </motion.div>
    );
  };
  return (
      <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          className="max-w-6xl mx-auto p-4 space-y-8"
      >
        <ToastContainer/>
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-4">{assignment.title}</h1>
          <p className="text-gray-600">{truncateText(assignment.description, 300)}</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <CloudUploadIcon className="h-8 w-8 mr-2 text-blue-500"/>
            Submit Assignments
          </h2>
          <div className="flex space-x-4">
            <div
                {...getRootProps()}
                className={`flex-1 p-10 border-2 border-dashed rounded-lg text-center transition-colors duration-300 ${
                    isDragActive ? 'border-blue-600 bg-blue-100' : 'border-gray-300 hover:bg-gray-100'
                }`}
            >
              <input {...getInputProps()} />
              <CloudUploadIcon className="mx-auto h-12 w-12 text-gray-400"/>
              <p className="mt-2">Drag 'n' drop files here, or click to select files</p>
            </div>
            <button
                onClick={() => setShowTextSubmissionModal(true)}
                className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300"
            >
              <DocumentTextIcon className="mr-2 h-5 w-5"/>
              Submit Text
            </button>
          </div>
        </div>

        <RubricApprovalWrapper>
        <div className="bg-white shadow rounded-lg p-4">
          <RubricDisplay
          rubric={rubric?.content}
          onEditRubric={() => setShowRubricEditModal(true)}
          isApproved={isRubricApproved}
          onApproveRubric={handleApproveRubric}
          />
        </div>
          </RubricApprovalWrapper>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <AcademicCapIcon className="h-8 w-8 mr-2 text-green-500"/>
            Submissions
          </h2>
          <SubmissionTable
            submissions={submissions}
            assignment={assignment}
            rubric={rubric?.content}
            onDeleteSubmission={handleDeleteSubmission}
            onRefresh={fetchSubmissions}
          />
        </div>

        {showRubricEditModal && (
          <RubricEditModal
            rubric={rubric}
            onSave={handleRubricUpdate}
            onClose={() => setShowRubricEditModal(false)}
          />
        )}

        {showTextSubmissionModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <motion.div
                  initial={{scale: 0.9, opacity: 0}}
                  animate={{scale: 1, opacity: 1}}
                  exit={{scale: 0.9, opacity: 0}}
                  className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl"
              >
                <h3 className="text-lg font-medium mb-4">Submit Text</h3>
                <textarea
                    className="w-full h-64 p-2 border rounded-md mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={textSubmission}
                    onChange={(e) => setTextSubmission(e.target.value)}
                    placeholder="Paste or type your submission here..."
                />
                <div className="flex justify-end space-x-2">
                  <button
                      onClick={() => setShowTextSubmissionModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300"
                  >
                    Cancel
                  </button>
                  <button
                      onClick={handleTextSubmission}
                      className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300"
                  >
                    Submit
                  </button>
                </div>
              </motion.div>
              {showRubricEditModal && (
                <button onClick={handleRubricUpdate}>Save Rubric</button>
              )}
            </div>
        )}
      </motion.div>
  );
}

export default AssignmentView;