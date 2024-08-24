import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { PaperClipIcon } from '@heroicons/react/24/solid';
import apiEndpoints from '../apiService';
import { HiDocumentAdd } from "react-icons/hi";

const SubmissionForm = ({ assignmentId }) => {
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const data = await apiEndpoints.assignments.get(assignmentId);
        setAssignment(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch assignment details. Please try again later.');
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId]);


  const onDrop = (acceptedFiles) => {
    setFiles([...files, ...acceptedFiles]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

   const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('text', submissionText);
    formData.append('assignment', assignmentId);
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      await apiEndpoints.submissions.create(formData);
      await apiEndpoints.scormAPI.setValue(assignmentId, null, 'cmi.core.lesson_status', 'completed');
      await apiEndpoints.scormAPI.commit(assignmentId, null);
      navigate('/');
    } catch (err) {
      setError('Failed to submit assignment. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8 px-4">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Submit Assignment: {assignment.title}</h1>
      <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
        <div className="space-y-8 divide-y divide-gray-200">
          <div>
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Submission</h3>
              <p className="mt-1 text-sm text-gray-500">
                Please provide your submission text and any relevant files.
              </p>
            </div>

            <div className="mt-6">
              <label htmlFor="submission-text" className="block text-sm font-medium text-gray-700">
                Submission Text
              </label>
              <div className="mt-1">
                <textarea
                  id="submission-text"
                  name="submission-text"
                  rows={10}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">Attachments</label>
              <div
                {...getRootProps()}
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md ${
                  isDragActive ? 'border-indigo-500 bg-indigo-50' : ''
                }`}
              >
                <div className="space-y-1 text-center">
                  <HiDocumentAdd className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Upload a file</span>
                      <input {...getInputProps()} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                </div>
              </div>
            </div>

            {files.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900">Uploaded Files:</h4>
                <ul className="mt-2 border border-gray-200 rounded-md divide-y divide-gray-200">
                  {files.map((file) => (
                    <li
                      key={file.name}
                      className="pl-3 pr-4 py-3 flex items-center justify-between text-sm"
                    >
                      <div className="w-0 flex-1 flex items-center">
                        <PaperClipIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                        <span className="ml-2 flex-1 w-0 truncate">{file.name}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate(`/assignment/`)}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                submitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SubmissionForm;