declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_BASE_URL?: string;
  }
}

interface Window {
  env?: {
    NEXT_PUBLIC_API_BASE_URL?: string;
  };
} 