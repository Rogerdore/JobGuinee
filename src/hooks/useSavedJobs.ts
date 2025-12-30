import { useState, useEffect } from 'react';
import { savedJobsService } from '../services/savedJobsService';

export function useSavedJobs(jobId?: string) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (jobId) {
      checkIfSaved();
    }
  }, [jobId]);

  const checkIfSaved = async () => {
    if (!jobId) return;
    try {
      const saved = await savedJobsService.isSaved(jobId);
      setIsSaved(saved);
    } catch (error) {
      console.error('Error checking if job is saved:', error);
    }
  };

  const toggleSave = async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const newState = await savedJobsService.toggleSaveJob(jobId);
      setIsSaved(newState);
      return newState;
    } catch (error) {
      console.error('Error toggling saved job:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    isSaved,
    loading,
    toggleSave,
    checkIfSaved,
  };
}
