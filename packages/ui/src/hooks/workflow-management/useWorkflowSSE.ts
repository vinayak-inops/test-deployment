import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthToken } from "../auth/useAuthToken";
import { EventSourcePolyfill } from 'event-source-polyfill';

// Get API URL from environment variables with proper fallbacks
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

interface WorkflowEvent {
  tenant: string;
  action: string;
  collectionName: string;
  id: string;
  data: any;
}

interface WorkflowSSEGrouped {
  [id: string]: any[];
}

type SSEStatus = "idle" | "connecting" | "connected" | "error";

export function useWorkflowSSE() {
  const { token, loading, error: authError } = useAuthToken();
  const [workflows, setWorkflows] = useState<WorkflowSSEGrouped>({});
  const [status, setStatus] = useState<SSEStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSourcePolyfill | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const isMountedRef = useRef(true);

  const connect = useCallback(() => {
    // Don't connect if still loading auth
    if (loading) {
      setStatus("idle");
      return;
    }

    // Check if component is still mounted
    if (!isMountedRef.current) return;

    // Handle authentication errors
    if (authError) {
      setStatus("error");
      setError(`Authentication error: ${authError.message}`);
      return;
    }

    if (!token) {
      setStatus("error");
      setError("No authentication token available. Please log in.");
      return;
    }

    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Ensure any old connection is closed before starting a new one
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setStatus("connecting");
    setError(null);

    try {
      // Use the working URL from the working page
      const url = 'http://122.166.245.97:8000/api/query/attendance/sse';
      
      
      const eventSource = new EventSourcePolyfill(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        withCredentials: true,
        heartbeatTimeout: 120000 // 2 minutes to prevent timeout
      });
      
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        if (!isMountedRef.current) return;
        setStatus("connected");
        setError(null);
      };

      eventSource.onmessage = (event: any) => {
        if (!isMountedRef.current) return;
        
        
        let raw = event.data;
        if (raw.startsWith("data:")) raw = raw.slice(5);
        
        try {
          if (!raw || raw.trim() === "") return; // Ignore empty messages
          
          const parsed: WorkflowEvent = JSON.parse(raw);
          
          // Validate the parsed data
          if (!parsed.id || !parsed.action) {
            return;
          }
          
          setWorkflows(prev => {
            const id = parsed.id;
            const entry = prev[id] ? [...prev[id]] : [];
            
            // Deduplicate to prevent identical entries
            const isDuplicate = entry.some(e => 
              e.action === parsed.data.action && 
              e.id === parsed.data.id &&
              e.timestamp === parsed.data.timestamp
            );
            
            if (!isDuplicate) {
              entry.push(parsed.data);
            }
            
            return { ...prev, [id]: entry };
          });
        } catch (e) {
          // Don't set error status for parsing issues, just log them
        }
      };

      eventSource.onerror = (err: any) => {
        if (!isMountedRef.current) return;
        
        setStatus('error');
        setError('Connection error occurred');
        
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
      };
    } catch (err) {
      if (!isMountedRef.current) return;
      
      setStatus("error");
      setError(`Failed to establish workflow connection: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [token, loading, authError]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Only connect when auth is ready and we have a token
    if (!loading && token) {
      connect();
    } else if (!loading && !token) {
      setStatus("error");
      setError("No authentication token available");
    }
    
    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [connect, loading, token, cleanup]);

  // Expose cleanup function for manual disconnection
  const disconnect = useCallback(() => {
    cleanup();
    setStatus("idle");
    setError(null);
  }, [cleanup]);

  return { 
    workflows, 
    status, 
    error, 
    reconnect: connect,
    disconnect,
    authLoading: loading,
    authError: authError?.message
  };
} 