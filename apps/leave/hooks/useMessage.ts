import { useState, useEffect } from 'react';
import { useEncashment } from './useEncashment';
import { useLeaveOfAbsence } from './useLeaveOfAbsence';
import { useLeaveApplications } from './useLeaveApplications';
import type { LeaveOfAbsenceApplication } from './useLeaveOfAbsence';
import type { EncashmentApplication } from './useEncashment';
import { toast } from 'react-toastify';

interface LeaveApplication {
  _id: string;
  createdOn: string;
  reason?: string;
  [key: string]: any;
}

interface UseMessageReturn {
  messagesData: { id: string }[];
  applicationsData: LeaveApplication[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

 


export const useMessage = (): UseMessageReturn & { showMessage: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void } => {
  const [messagesData, setMessagesData] = useState<{ id: string }[]>([]);
  const [applicationsData, setApplicationsData] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>("")

  // Use the leave applications hook
  const { applicationsData: leaveApplications, loading: applicationsLoading, error: applicationsError, lastUpdated: applicationsLastUpdated, refetch: refetchApplications } = useLeaveApplications()

  // Use the leave of absence hook
  const { absenceData: leaveOfAbsenceData, loading: absenceLoading, error: absenceError, lastUpdated: absenceLastUpdated, refetch: refetchAbsence } = useLeaveOfAbsence()    

  // Use the encashment hook
  const { encashmentData, loading: encashmentLoading, error: encashmentError, lastUpdated: encashmentLastUpdated, refetch: refetchEncashment } = useEncashment()

  const fetchMessages = async () => {
    const token = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJQeUt3ZW1kT1RPeVFnLTR0TjRHT1lBdFhMTEl1dmNGd3hGWTJFY29IQzRJIn0.eyJleHAiOjE3NTM0NjAyMzIsImlhdCI6MTc1MzQyNDIzMiwianRpIjoidHJydGNjOmFlMmU4NDgwLTU4ZDYtNzMwNC1jZDZmLTgwYjkxY2RiM2NhNCIsImlzcyI6Imh0dHA6Ly8xMjIuMTY2LjI0NS45Nzo4MDgwL3JlYWxtcy9pbm9wcyIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJiNTRiN2UxZS0xMzY3LTQwZWItYjhmZS02ODMxY2ZjNTMzY2IiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJnYXRld2F5LWNsaWVudCIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiKi8qIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJvZmZsaW5lX2FjY2VzcyIsImFkbWluIiwiZGVmYXVsdC1yb2xlcy1pbm9wcyIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsicmVhbG0tbWFuYWdlbWVudCI6eyJyb2xlcyI6WyJ2aWV3LWlkZW50aXR5LXByb3ZpZGVycyIsInZpZXctcmVhbG0iLCJ2aWV3LXVzZXJzIiwicXVlcnktY2xpZW50cyIsInF1ZXJ5LWdyb3VwcyIsInF1ZXJ5LXVzZXJzIl19LCJnYXRld2F5LWNsaWVudCI6eyJyb2xlcyI6WyJhZG1pbiJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsInZpZXctYXBwbGljYXRpb25zIiwidmlldy1jb25zZW50Iiwidmlldy1ncm91cHMiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsImRlbGV0ZS1hY2NvdW50IiwibWFuYWdlLWNvbnNlbnQiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9yZ2FuaXphdGlvbiBwcm9maWxlIGVtYWlsIiwiY2xpZW50SG9zdCI6IjE3Mi4yNS4wLjEiLCJhZGRyZXNzIjp7fSwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJncm91cHMiOlsib2ZmbGluZV9hY2Nlc3MiLCJhZG1pbiIsImRlZmF1bHQtcm9sZXMtaW5vcHMiLCJ1bWFfYXV0aG9yaXphdGlvbiJdLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzZXJ2aWNlLWFjY291bnQtZ2F0ZXdheS1jbGllbnQiLCJjbGllbnRBZGRyZXNzIjoiMTcyLjI1LjAuMSIsImNsaWVudF9pZCI6ImdhdGV3YXktY2xpZW50In0.hrWHQ3HQo8bk_m3et-hXfpaucuF-Yz1tx18NGhM9ftjvIU0mhza21x69IM9cf49xbAF6jCStW5kzsw3fOAKtgiOtIs8O489wP53a7p4CCZfhK4fmT24CY35wAVea0fj3yuBT9Qi-qmGbB_lJtmcDKfVVlBi23UvXGJPsoS9NYGivH80IxiFgSGO2FXQHF-TwdKn2ijn0pwTR8hb2i-zAFIev2IVIfw-pg8xIft2qLAzMptTTX_A8Mk-rw3UhaMbOTXJn9WfaedNlTfdCl_ECjq19sT-IrZ81minlEfLvGtuWAHKhWns3YRx6v-Yc2JxVUSXoQu3sRskaxJeRwfDnrg';
     try {
    //   setLoading(true);
    //   setError(null);
    //   const response = await fetch('http://122.166.245.97:8000/api/query/attendance/leaveApplication', {
    //     method: 'GET',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${token}`
    //     }
    //   });
    //   if (!response.ok) {
    //     throw new Error(`HTTP error! status: ${response.status}`);
    //   }
    //   const rawData = await response.json();
    //   let apiData: any[];
    //   if (Array.isArray(rawData)) {
    //     apiData = rawData;
    //   } else if (rawData.data) {
    //     apiData = Array.isArray(rawData.data) ? rawData.data : [rawData.data];
    //   } else if (rawData.messages && Array.isArray(rawData.messages)) {
    //     apiData = rawData.messages;
    //   } else {
    //     throw new Error('API response does not contain expected message data');
    //   }
    //   // Normalized data for messagesData (id only)
    //   const normalizedData = apiData.map((item: any) => ({
    //     id: item.id || item._id || '',
    //   }));
    //   setMessagesData(normalizedData);
    //   setLastUpdated(new Date());

    //   // Save normalized leave applications for later filtering
    //   const leaveApplications: LeaveApplication[] = apiData.map((item: any) => ({
    //     _id: item._id || item.id || '',
    //     createdOn: item.createdOn || '',
    //     reason: item.reason || '',
    //     ...item,
    //   }));

      const selectedApplication = [
        ...leaveApplications,
        ...leaveOfAbsenceData,
        ...encashmentData
    ].find(app => app._id === selectedApplicationId);
    
    if (!selectedApplication) {
      
        throw new Error('Application not found');
    }

      // Second API call
      const response1 = await fetch('http://122.166.245.97:8000/api/query/attendance/workflow_management', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response1.ok) {
        throw new Error(`HTTP error! status: ${response1.status}`);
      }

      const rawData1 = await response1.json();

      // Extract fileIds from rawData1 (handle both array and property cases)
      let fileIds: string[] = [];
      if (Array.isArray(rawData1)) {
        fileIds = rawData1.map((item: any) => item.fileId);
      } else if (rawData1 && Array.isArray(rawData1.data)) {
        fileIds = rawData1.data.map((item: any) => item.fileId);
      } else if (rawData1 && Array.isArray(rawData1.files)) {
        fileIds = rawData1.files.map((item: any) => item.fileId);
      }
      // Filter leaveApplications to only include items whose _id matches a fileId
      type ApplicationUnion = LeaveApplication | LeaveOfAbsenceApplication | EncashmentApplication;

      const allApplications: ApplicationUnion[] = [
        ...leaveApplications,
        ...leaveOfAbsenceData,
        ...encashmentData
      ];
      
      // Filter allApplications to only include items whose _id matches a fileId
      const filteredData = allApplications.filter((app) => fileIds.includes(app._id));
      setApplicationsData(filteredData);
      setLastUpdated(new Date());

      if (filteredData.length > 0) {
        const latestItem = filteredData.reduce((latest, current) => {
          if (!latest.createdOn) return current;
          if (!current.createdOn) return latest;
          return new Date(current.createdOn) > new Date(latest.createdOn) ? current : latest;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
      setMessagesData([]);
      setApplicationsData([]);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchMessages();
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const showMessage = (msg: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    switch (type) {
      case 'success':
        toast.success(msg);
        break;
      case 'error':
        toast.error(msg);
        break;
      case 'warning':
        toast.warn(msg);
        break;
      default:
        toast.info(msg);
    }
  };

  return {
    messagesData,
    applicationsData,
    loading,
    error,
    lastUpdated,
    refetch,
    showMessage,
  };
}; 