// components/Course/CreateCourseModal.js

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XIcon, UploadIcon, DocumentIcon, TrashIcon } from '@heroicons/react/solid';

const CreateCourseModal = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [syllabus, setSyllabus] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (syllabus) {
      formData.append('syllabus', syllabus);
    }
    onCreate(formData);
};

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 10 * 1024 * 1024) { // 10MB limit
      setSyllabus(file);
    } else {
      alert('File is too large. Maximum size is 10MB.');
    }
  };

  const MaxFileSizeInfo = () => (
  <div className="text-xs text-gray-500 mt-1 flex items-center">
    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
    Maximum file size: 10MB
  </div>
);


  const removeSyllabus = () => {
    setSyllabus(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="bg-white rounded-lg p-8 w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create New Course</h2>
          <button onClick={onClose}>
            <XIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Course Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Course Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              required
            ></textarea>
          </div>
          <div className="mb-6">
            <label htmlFor="syllabus" className="block text-sm font-medium text-gray-700 mb-1">
              Upload Syllabus (optional)
            </label>
            {syllabus ? (
            <div className="flex items-center justify-between bg-gray-100 p-3 rounded-md">
              <div className="flex items-center">
                <DocumentIcon className="h-6 w-6 text-blue-500 mr-2" />
                <span className="text-sm text-gray-700">{syllabus.name}</span>
              </div>
              <button
                type="button"
                onClick={removeSyllabus}
                className="text-red-500 hover:text-red-700"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="syllabus"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadIcon className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF, DOCX, or TXT</p>
                </div>
                <input
                  id="syllabus"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.txt"
                />
              </label>
            </div>
          )}
          <MaxFileSizeInfo />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300"
            >
              Create Course
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateCourseModal;