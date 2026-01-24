import { useState, useEffect, useRef } from 'react';

/**
 * Hook để tính progress bar: 0-99% trong 15 phút, sau đó giữ 99%
 * Khi server progress = 100, thì hiển thị 100%
 */
export function useProgressBar(serverProgress: number | null, isGenerating: boolean) {
  const [progress, setProgress] = useState(1); // Bắt đầu từ 1%
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isGenerating && startTimeRef.current === null) {
      // Bắt đầu tính progress
      startTimeRef.current = Date.now();
      setProgress(1); // Bắt đầu từ 1%
      
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current === null) return;
        
        const elapsed = (Date.now() - startTimeRef.current) / 1000; // seconds
        const fifteenMinutes = 15 * 60; // 15 phút = 900 giây
        
        if (elapsed < fifteenMinutes) {
          // 1-15 phút: tăng từ 1% đến 99% (dùng hàm logarit để tăng chậm dần)
          // Sử dụng hàm: 1 + 98 * (1 - e^(-elapsed/300)) để tăng từ 1% đến 99%
          const calculatedProgress = 1 + 98 * (1 - Math.exp(-elapsed / 300));
          setProgress(Math.min(calculatedProgress, 99));
        } else {
          // Sau 15 phút: giữ ở 99%
          setProgress(99);
        }
      }, 100); // Update mỗi 100ms để smooth
    } else if (!isGenerating) {
      // Reset khi không generating
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startTimeRef.current = null;
      setProgress(1);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isGenerating]);

  // Nếu server progress = 100, hiển thị 100%
  useEffect(() => {
    if (serverProgress !== null && serverProgress === 100) {
      setProgress(100);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [serverProgress]);

  return Math.round(progress);
}

