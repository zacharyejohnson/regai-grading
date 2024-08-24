import { useState, useCallback } from 'react';
import { getSCORMValue, setSCORMValue, commitSCORM } from '../utils/scormApi';

export const useSCORMData = (assignmentId, submissionId) => {
  const [scormData, setScormData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSCORMData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const lessonStatus = await getSCORMValue(assignmentId, submissionId, 'cmi.core.lesson_status');
      const score = await getSCORMValue(assignmentId, submissionId, 'cmi.core.score.raw');
      const totalTime = await getSCORMValue(assignmentId, submissionId, 'cmi.core.total_time');

      setScormData({ lessonStatus, score, totalTime });
    } catch (err) {
      setError(err.message || 'An error occurred while fetching SCORM data');
    } finally {
      setLoading(false);
    }
  }, [assignmentId, submissionId]);

  const updateSCORMData = useCallback(async (updates) => {
    setLoading(true);
    setError(null);
    try {
      for (const [key, value] of Object.entries(updates)) {
        await setSCORMValue(assignmentId, submissionId, key, value);
      }
      await commitSCORM(assignmentId, submissionId);
      await fetchSCORMData(); // Refresh the data after update
    } catch (err) {
      setError(err.message || 'An error occurred while updating SCORM data');
    } finally {
      setLoading(false);
    }
  }, [assignmentId, submissionId, fetchSCORMData]);

  return {
    scormData,
    loading,
    error,
    fetchSCORMData,
    updateSCORMData
  };
};