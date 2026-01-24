'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface VideoDurationInfoProps {
  url: string;
}

/**
 * Component to display video duration
 */
export default function VideoDurationInfo({ url }: VideoDurationInfoProps) {
  const [duration, setDuration] = useState<string>('');
  
  useEffect(() => {
    const video = document.createElement('video');
    video.src = url;
    video.addEventListener('loadedmetadata', () => {
      const dur = Math.round(video.duration);
      const minutes = Math.floor(dur / 60);
      const seconds = dur % 60;
      if (minutes > 0) {
        setDuration(`${minutes}m ${seconds}s`);
      } else {
        setDuration(`${seconds}s`);
      }
    });
    video.addEventListener('error', () => {
      setDuration('0s');
    });
    
    return () => {
      video.removeEventListener('loadedmetadata', () => {});
      video.removeEventListener('error', () => {});
    };
  }, [url]);
  
  if (!duration) return null;
  
  return (
    <span className="bg-[#2a2a2a] text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
      <Clock className="w-3 h-3" />
      {duration}
    </span>
  );
}

