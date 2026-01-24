import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { VideoJob } from '@/lib/types';
import { useDeletedJobs } from './useDeletedJobs';
import { useProgressBar } from './useProgressBar';

interface UseFeaturePageOptions {
  featureType: string;
  apiEndpoint: string;
}

/**
 * Shared hook for feature pages with common logic
 */
export function useFeaturePage({ featureType, apiEndpoint }: UseFeaturePageOptions) {
  const { data: session } = useSession();
  const [isGenerating, setIsGenerating] = useState(false);
  const [serverProgress, setServerProgress] = useState<number | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultJobs, setResultJobs] = useState<VideoJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [currentDisplayJob, setCurrentDisplayJob] = useState<VideoJob | null>(null);
  
  const { deletedJobIds, saveDeletedJobId } = useDeletedJobs(featureType);
  const progress = useProgressBar(serverProgress, isGenerating);

  // Fetch jobs history
  useEffect(() => {
    if (session) {
      fetchJobs();
    }
  }, [session]);

  const fetchJobs = async () => {
    if (!session) return;
    
    const user_id = (session.user as any)?.id;
    if (!user_id) return;
    
    try {
      setLoadingJobs(true);
      const response = await axios.get('/api/jobs', { 
        params: { status: 'all', user_id: user_id },
        timeout: 5000,
      });
      if (response.data && response.data.jobs) {
        const featureJobs = response.data.jobs.filter(
          (job: VideoJob) => job.feature_type === featureType && !deletedJobIds.has(job.id)
        );
        const sortedJobs = featureJobs.sort((a: VideoJob, b: VideoJob) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setResultJobs(sortedJobs.slice(0, 10));
        
        // Set preview to latest completed job
        const latestCompleted = sortedJobs.find(
          (job: VideoJob) => job.status === 'completed' && job.result_url
        );
        if (latestCompleted && latestCompleted.result_url) {
          if (!currentDisplayJob || latestCompleted.id !== currentDisplayJob.id) {
            setPreviewUrl(latestCompleted.result_url);
            setCurrentDisplayJob(latestCompleted);
          }
        } else {
          setCurrentDisplayJob(null);
          setPreviewUrl(null);
        }
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const startPolling = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/videos/${jobId}/progress`);
        const { status, progress: prog, result_url, input_file_url, input_video_url, input_face_file_url, input_outfit_file_url, prompt } = response.data;
        setServerProgress(prog || 0);

        if (status === 'completed') {
          clearInterval(interval);
          setIsGenerating(false);
          setServerProgress(100);
          if (result_url) {
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
            setPreviewUrl(result_url);
            setCurrentDisplayJob(completedJob);
          }
          fetchJobs();
        } else if (status === 'failed') {
          clearInterval(interval);
          setIsGenerating(false);
          alert(`Tạo ${featureType} thất bại!`);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
  };

  const handleDelete = async () => {
    if (!currentDisplayJob) return;
    
    if (!confirm('Bạn có chắc chắn muốn xóa kết quả này khỏi hiển thị? (Nó vẫn sẽ có trong Dashboard của bạn)')) {
      return;
    }
    
    try {
      saveDeletedJobId(currentDisplayJob.id);
      setCurrentDisplayJob(null);
      setPreviewUrl(null);
      alert('Đã xóa kết quả khỏi hiển thị.');
    } catch (error) {
      console.error('Error deleting job from display:', error);
      alert('Không thể xóa kết quả khỏi hiển thị!');
    }
  };

  return {
    session,
    isGenerating,
    setIsGenerating,
    serverProgress,
    setServerProgress,
    jobId,
    setJobId,
    previewUrl,
    setPreviewUrl,
    resultJobs,
    loadingJobs,
    currentDisplayJob,
    setCurrentDisplayJob,
    deletedJobIds,
    saveDeletedJobId,
    progress,
    fetchJobs,
    startPolling,
    handleDelete,
  };
}

