import { useMemo } from 'react';
import { getDeletedJobIds, saveDeletedJobId as saveDeletedJobIdUtil } from '@/lib/utils';

/**
 * Hook to manage deleted jobs for a specific feature type
 */
export function useDeletedJobs(featureType: string) {
  const deletedJobIds = useMemo(() => {
    return getDeletedJobIds(featureType);
  }, [featureType]);

  const saveDeletedJobId = (jobId: string) => {
    saveDeletedJobIdUtil(featureType, jobId);
  };

  const isDeleted = (jobId: string) => {
    return deletedJobIds.has(jobId);
  };

  return {
    deletedJobIds,
    saveDeletedJobId,
    isDeleted
  };
}

