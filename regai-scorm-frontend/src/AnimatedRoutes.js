// AnimatedRoutes.js
import React from 'react';
import {Navigate, Route, Routes, useLocation} from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import CourseView from './components/Course/CourseView';
import AssignmentView from './components/Assignment/AssignmentView';
import RubricEditor from './components/Rubric/RubricEditor';
import SubmissionList from './components/Submission/SubmissionList';
import GradingPipeline from './components/Grading/GradingPipeline';
import SignUpPage from './components/Auth/SignUpPage';
import LoginPage from './components/Auth/LoginPage';
import NotFound from './components/NotFound';
import AssignmentKnowledgeBasePage from "./components/KnowledgeBase/AssignmentKnowledgeBasePage";
import KnowledgeBasePage from "./components/KnowledgeBase/KnowledgeBasePage";

function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="course/:courseId" element={<CourseView />} />
          <Route path="course/:courseId/assignment/:assignmentId" element={<AssignmentView />} />
          <Route path="course/:courseId/assignment/:assignmentId/rubric" element={<RubricEditor />} />
          <Route path="course/:courseId/assignment/:assignmentId/submissions" element={<SubmissionList />} />
          <Route path="course/:courseId/assignment/:assignmentId/submission/:submissionId/grade" element={<GradingPipeline />} />
          <Route path="knowledge-base/:assignmentId" element={<AssignmentKnowledgeBasePage />} />
          <Route path="knowledge-base/" element={<KnowledgeBasePage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default AnimatedRoutes;