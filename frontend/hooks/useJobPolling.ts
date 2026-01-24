import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { VideoJob } from '@/lib/types';

interface UseJobPollingOptions {
  jobId: string | null;
  featureType: string;
  onComplete?: (job: VideoJob) => void;
  onError?: (error: Error) => void;
  pollingInterval?: number;
}

/**
 * Hook to poll job status and update progress
 */
export function useJobPolling({
  jobId,
  featureType,
  onComplete,
  onError,
  pollingInterval = 3000
}: UseJobPollingOptions) {
  const [serverProgress, setServerProgress] = useState<number | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!jobId || !isPolling) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const poll = async () => {
      try {
        const response = await axios.get(`/api/videos/${jobId}/progress`);
        const { status, progress: prog, result_url, input_file_url, input_video_url, input_face_file_url, input_outfit_file_url, prompt } = response.data;
        
        setServerProgress(prog || 0);

        if (status === 'completed') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsPolling(false);
          setServerProgress(100);
          
          if (result_url && onComplete) {
            const completedJob: VideoJob = {
              id: jobId,
              feature_type: featureType,
              status: 'completed',
              progress: 100,
              result_url: result_url,
              created_at: new Date().toISOString(),
              input_file_url: input_file_url,
              input_video_url: input_video_url,
              input_face_file_url: input_face_file_url,
              input_outfit_file_url: input_outfit_file_url,
              prompt: prompt
            };
            onComplete(completedJob);
          }
        } else if (status === 'failed') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsPolling(false);
          if (onError) {
            onError(new Error('Job failed'));
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    };

    // Start polling immediately
    poll();
    
    // Then poll at intervals
    intervalRef.current = setInterval(poll, pollingInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [jobId, isPolling, featureType, onComplete, onError, pollingInterval]);

  const startPolling = () => {
    setIsPolling(true);
  };

  const stopPolling = () => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return {
    serverProgress,
    isPolling,
    startPolling,
    stopPolling
  };
}

