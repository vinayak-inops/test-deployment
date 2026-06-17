// Runtime configuration
declare global {
  interface Window {
    env: {
      NEXT_PUBLIC_API_BASE_URL?: string;
    };
  }
}

// Set the API URL at runtime
export const initializeConfig = () => {
  if (typeof window !== 'undefined') {
    window.env = {
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.71.20:8000'
    };
  }
}; 