import { useState, useCallback } from 'react';

interface UseDownloadProgressReturn {
  progress: number;
  statusMessage: string;
  isDownloading: boolean;
  isComplete: boolean;
  hasError: boolean;
  error: string | null;
  updateProgress: (progress: number, message?: string) => void;
  setComplete: () => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const useDownloadProgress = (): UseDownloadProgressReturn => {
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);

  const updateProgress = useCallback((newProgress: number, message?: string) => {
    setProgress(newProgress);
    if (message) {
      setStatusMessage(message);
    }
    setIsDownloading(true);
    setIsComplete(false);
    setHasError(false);
    setErrorState(null);
  }, []);

  const setComplete = useCallback(() => {
    setProgress(100);
    setStatusMessage('File conversion completed!');
    setIsDownloading(false);
    setIsComplete(true);
    setHasError(false);
    setErrorState(null);
  }, []);

  const setError = useCallback((errorMessage: string) => {
    setHasError(true);
    setErrorState(errorMessage);
    setStatusMessage('File conversion failed');
    setIsDownloading(false);
    setIsComplete(false);
  }, []);

  const reset = useCallback(() => {
    setProgress(0);
    setStatusMessage('');
    setIsDownloading(false);
    setIsComplete(false);
    setHasError(false);
    setErrorState(null);
  }, []);

  return {
    progress,
    statusMessage,
    isDownloading,
    isComplete,
    hasError,
    error,
    updateProgress,
    setComplete,
    setError,
    reset
  };
};
