'use client';

import { useEffect } from 'react';

export default function MetaMaskErrorHandler() {
  useEffect(() => {
    // Suppress MetaMask connection errors in console
    const originalError = console.error;
    console.error = (...args: any[]) => {
      // Filter out MetaMask connection errors
      const errorMessage = args[0]?.toString() || '';
      if (
        errorMessage.includes('Failed to connect to MetaMask') ||
        errorMessage.includes('MetaMask') ||
        errorMessage.includes('ethereum')
      ) {
        // Silently ignore MetaMask errors
        return;
      }
      // Log other errors normally
      originalError.apply(console, args);
    };

    // Also handle unhandled promise rejections from MetaMask
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.toString() || '';
      if (
        reason.includes('Failed to connect to MetaMask') ||
        reason.includes('MetaMask') ||
        reason.includes('ethereum')
      ) {
        event.preventDefault(); // Prevent error from showing in console
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      console.error = originalError;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}

