import { useState } from 'react';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthToken } from '../auth/useAuthToken';
import useCurrentDomain from "@/hooks/api/useCurrentDomain";

// Get API URL from environment variables with fallbacks
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL;
};

const API_BASE_URL = getApiBaseUrl();
  const NEXT_PUBLIC_NEXTAUTH_URL= useCurrentDomain()

const getLoginRedirectUrl = () => {
  const baseUrl = (NEXT_PUBLIC_NEXTAUTH_URL || '').trim();
  if (baseUrl) {
    return `${baseUrl.replace(/\/+$/, '')}/login`;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/login`;
  }
  return '/login';
};

interface CustomSession {
  accessToken?: string;
  [key: string]: any;
}

interface UsePostRequestOptions<T> {
  url: string;
  data?: any;
  salMonth?: string;
  files?: File | File[]; // Support for single file or multiple files
  headers?: Record<string, string>; // Custom headers
  config?: AxiosRequestConfig;
  requireAuth?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: AxiosError) => void;
  attendance?: boolean; // New option to specify if attendance header should be included
  onProgress?: (progress: number) => void; // For file upload progress
}

interface UsePostRequestResult<T> {
  data: T | null;
  loading: boolean;
  error: AxiosError | null;
  uploadProgress: number;
  post: (postData?: any) => Promise<void>;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Custom hook for making POST requests with support for file uploads
 * @param options - Configuration options for the request
 * @returns Object containing data, loading state, error state, upload progress, and post function
 */
export const usePostRequest = <T>({
  url,
  data: initialData,
  salMonth,
  files,
  headers = {},
  config = {},
  requireAuth = true,
  onSuccess,
  onError,
  onProgress,
  attendance = true
}: UsePostRequestOptions<T>): UsePostRequestResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<AxiosError | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { token, loading: tokenLoading, error: tokenError } = useAuthToken();

  const post = async (postData?: any, retryCount = 0) => {
    try {
      if (requireAuth && tokenLoading) {
        return; // Wait for token to be loaded
      }

      if (requireAuth && tokenError) {
        throw new Error(tokenError.message);
      }

      if (requireAuth && !token) {
        throw new Error('No access token available');
      }

      setLoading(true);
      setError(null);
      setUploadProgress(0);

      // Prepare request data
      let requestData: any;
      let requestHeaders: Record<string, string> = {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      };

      // Handle file uploads
      if (files) {
        const formData = new FormData();
        
        // Add files to form data
        if (Array.isArray(files)) {
          files.forEach((file, index) => {
            formData.append(`file${index}`, file);
          });
        } else {
          formData.append('file', files);
        }

        // Add other data to form data
        const dataToSend = {
          ...(initialData && typeof initialData === 'object' ? initialData : {}),
          ...(postData && typeof postData === 'object' ? postData : {}),
          ...(salMonth ? { salMonth } : {}),
        };
        if (dataToSend) {
          Object.entries(dataToSend).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              formData.append(key, String(value));
            }
          });
        }

        requestData = formData;
        // Don't set Content-Type for FormData, let the browser set it with boundary
        delete requestHeaders['Content-Type'];
      } else {
        // Regular JSON request
        requestData = {
          ...(initialData && typeof initialData === 'object' ? initialData : {}),
          ...(postData && typeof postData === 'object' ? postData : {}),
          ...(salMonth ? { salMonth } : {}),
        };
        requestHeaders['Content-Type'] = 'application/json';
      }

      const response = await axios({
        method: 'POST',
        url: `${API_BASE_URL}/api/command/${attendance ? 'attendance/' : ''}${url}`,
        data: requestData,
        headers: requestHeaders,
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
            onProgress?.(progress);
          }
        },
        ...config,
      });

      const responseData = response.data;
      setData(responseData);
      onSuccess?.(responseData);

    } catch (err) {
      const error = err as AxiosError;

      if (error.response?.status === 401 && typeof window !== 'undefined') {
        window.location.assign(getLoginRedirectUrl());
        return;
      }

      setError(error);
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Convert tokenError to AxiosError if it exists
  const combinedError = error || (tokenError ? new AxiosError(tokenError.message) : null);

  return {
    data,
    loading: loading || tokenLoading,
    error: combinedError,
    uploadProgress,
    post,
  };
};

// Example usage:
/*
// For regular JSON POST
const { post, loading, error, data } = usePostRequest<any>({
  url: 'uploadfile',
  data: {
    name: 'example',
    description: 'test'
  },
  headers: {
    'X-workflow': 'workflow1',
    'X-Tenant': 'BHEL'
  },
  onSuccess: (response) => {
  },
  onError: (error) => {
  }
});

// For file upload
const { post, loading, error, uploadProgress } = usePostRequest<any>({
  url: 'uploadfile',
  files: selectedFile,
  headers: {
    'X-workflow': 'workflow1',
    'X-Tenant': 'BHEL'
  },
  onProgress: (progress) => {
  }
});

// Call the post function
await post();
*/ 
