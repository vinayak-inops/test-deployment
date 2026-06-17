import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const SECURE_BASE = (process.env.NEXT_PUBLIC_NEXTAUTH_URL || '').replace(/\/+$/, '');

// Generic response type that can be used for any data type
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Configuration options for the API request
export interface ApiRequestOptions {
  baseURL: string;
  endpoint: string;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Generic GET request function that can be used for any API endpoint
 * @param options - Configuration for the request including baseURL, endpoint, params, etc.
 * @returns Promise containing the response data or error
 */
export const fetchData = async <T>(options: ApiRequestOptions): Promise<ApiResponse<T>> => {
  const {
    baseURL,
    endpoint,
    params,
    headers = {},
    timeout = 30000
  } = options;

  const config: AxiosRequestConfig = {
    baseURL,
    url: endpoint,
    method: 'GET',
    params,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    timeout
  };

  try {
    const response = await axios.request<T>(config);
    return {
      data: response.data,
      error: null
    };
  } catch (err) {
    const error = err as AxiosError<{ error?: string; message?: string }>;
    return {
      data: null,
      error: error.response?.data?.error || 
             error.response?.data?.message || 
             error.message || 
             'Failed to fetch data'
    };
  }
};

// Define the report type - adjust these fields based on your actual report structure
export interface Report {
  id: string;
  // Add other report fields here
  [key: string]: any;
}

export interface GetReportsResponse extends ApiResponse<Report[]> {}

export const fetchReports = async (options: { 
  endpoint?: string; 
  params?: Record<string, any>;
  token?: string;
  method?: 'GET' | 'POST';
  body?: any;
} = {}): Promise<GetReportsResponse> => {
  try {
    void options.token;
    const baseURL = SECURE_BASE ? `${SECURE_BASE}/api/secure/query` : '/api/secure/query';
    const method = options.method || 'GET';
    const config: AxiosRequestConfig = {
      timeout: 10000,
      validateStatus: (status) => status >= 200 && status < 300,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true
    };
    let response;
    if (method === 'POST') {
      response = await axios.post(
        `${baseURL}/${options.endpoint || 'tenantReportConfiguration/6827076ad74e6f59df5f216'}`,
        options.body || {},
        config
      );
    } else {
      response = await axios.get(
        `${baseURL}/${options.endpoint || 'tenantReportConfiguration/6827076ad74e6f59df5f216'}`,
        {
          ...config,
          params: options.params
        }
      );
    }
    return {
      data: response.data,
      error: null
    };
  } catch (err) {
    const error = err as AxiosError;

    let errorMessage = 'Failed to fetch reports';
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timed out. Please try again.';
    } else if (!error.response) {
      errorMessage = 'Network error. Please check your internet connection.';
    } else if (error.response.status === 401) {
      errorMessage = 'Authentication required. Please login again.';
    } else if (error.response.status === 404) {
      errorMessage = 'Report endpoint not found.';
    } else if (error.response.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }

    return {
      data: null,
      error: errorMessage
    };
  }
};
