import { useState, useCallback, useEffect } from "react";
import { OTPolicyApplication } from "../../app/policy/over-time/_components/types";

export type OTPolicyItem = OTPolicyApplication;
  

interface OTCrudHook {
  otPolicies: OTPolicyItem[];
  otPolicy: OTPolicyItem | null;
  addOTPolicy: (policy: OTPolicyItem) => void;
  updateOTPolicy: (id: string, updatedPolicy: OTPolicyItem) => void;
  deleteOTPolicy: (id: string) => void;
  getOTPolicyById: (id: string) => OTPolicyItem | undefined;
  setOTPolicy: (policy: OTPolicyItem | null) => void;
  resetOTPolicy: () => void;
}

export function useOTCrud(initialPolicies: OTPolicyItem[] = []): OTCrudHook {
  const [otPolicies, setOTPolicies] = useState<OTPolicyItem[]>(initialPolicies);
  const [otPolicy, setOTPolicyState] = useState<OTPolicyItem | null>(null);

  // Update policies when initialPolicies changes
  useEffect(() => {
    if (initialPolicies && Array.isArray(initialPolicies)) {
      setOTPolicies(initialPolicies);
    }
  }, [initialPolicies]);

  // Generate unique ID helper
  const generateId = useCallback(() => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }, []);

  const addOTPolicy = useCallback(
    (policy: OTPolicyItem) => {
      
      const newPolicy = {
        ...policy,
        _id: policy._id || generateId(),
      };
      
      setOTPolicies((prev) => {
        const updated = [...prev, newPolicy];
        return updated;
      });
    },
    [generateId]
  );

  const updateOTPolicy = useCallback(
    (id: string, updatedPolicy: OTPolicyItem) => {
      setOTPolicies((prev) => {
        const updatedPolicies = prev.map((item) => {
          if (item._id === id) {
            const updated = { ...item, ...updatedPolicy, _id: id };
            return updated;
          }
          return item;
        });
        
        return updatedPolicies;
      });
      
      // Update current policy state if it matches
      setOTPolicyState((prev) => {
        if (prev && prev._id === id) {
          return { ...prev, ...updatedPolicy, _id: id };
        }
        return prev;
      });
    },
    [otPolicies.length]
  );

  const deleteOTPolicy = useCallback(
    (id: string) => {
      setOTPolicies((prev) => {
        const filtered = prev.filter((item) => item._id !== id);
        return filtered;
      });
      
      setOTPolicyState((prev) => {
        if (prev && prev._id === id) {
          return null;
        }
        return prev;
      });
    },
    []
  );

  const getOTPolicyById = useCallback(
    (id: string) => {
      const found = otPolicies.find((item) => item._id === id);
      return found;
    },
    [otPolicies]
  );

  const setOTPolicy = useCallback((policy: OTPolicyItem | null) => {
    setOTPolicyState(policy);
  }, []);

  const resetOTPolicy = useCallback(() => {
    setOTPolicyState(null);
  }, []);

  return {
    otPolicies,
    otPolicy,
    addOTPolicy,
    updateOTPolicy,
    deleteOTPolicy,
    getOTPolicyById,
    setOTPolicy,
    resetOTPolicy,
  };
}