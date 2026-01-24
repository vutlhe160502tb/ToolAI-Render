/**
 * Shared types and interfaces
 */

export interface VideoJob {
  id: string;
  feature_type: string;
  status: string;
  progress: number;
  result_url?: string;
  created_at: string;
  completed_at?: string;
  input_file_url?: string;
  input_video_url?: string;
  input_face_file_url?: string;
  input_outfit_file_url?: string;
  prompt?: string;
}

