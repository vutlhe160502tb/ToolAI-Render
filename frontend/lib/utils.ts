/**
 * Utility functions shared across the application
 */

/**
 * Check if a URL is an image
 */
export function isImageUrl(url: string): boolean {
  if (!url) return false;
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some(ext => lowerUrl.includes(ext)) || 
         lowerUrl.includes('image') ||
         lowerUrl.startsWith('data:image');
}

/**
 * Check if a URL is a video
 */
export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext)) || 
         lowerUrl.includes('video');
}

/**
 * Format date to DD/MM/YYYY
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Get deleted job IDs from localStorage
 */
export function getDeletedJobIds(featureType: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const deleted = localStorage.getItem(`deleted_jobs_${featureType}`);
  return deleted ? new Set(JSON.parse(deleted)) : new Set();
}

/**
 * Save deleted job ID to localStorage
 */
export function saveDeletedJobId(featureType: string, jobId: string): void {
  if (typeof window === 'undefined') return;
  const deleted = getDeletedJobIds(featureType);
  deleted.add(jobId);
  localStorage.setItem(`deleted_jobs_${featureType}`, JSON.stringify(Array.from(deleted)));
}

/**
 * Validate file type and size
 */
export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSize: number,
  typeLabel: string = 'file'
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Chỉ chấp nhận ${typeLabel}: ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`
    };
  }
  
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `Kích thước ${typeLabel} không được vượt quá ${maxSizeMB}MB`
    };
  }
  
  return { valid: true };
}

