import { useState, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useApolloClient } from '@apollo/client';
import { useGetTenantCode } from '../search/useGetTenantCode';

// GraphQL query for fetching contractor employees
const FETCH_CONTRACTOR_EMPLOYEES_QUERY = gql`
  query FetchContractorEmployees($tenantCode: String!) {
    fetchEmployees(
      criteriaRequests: { field: "tenantCode", operator: "eq", value: $tenantCode }
      collection: "contract_employee"
    ) {
      _id
      organizationCode
      tenantCode
      employeeID
      firstName
      middleName
      lastName
      isDeleted
      contractorCode
      deployment {
        department {
          departmentCode
          departmentName
        }
        designation {
          designationCode
          designationName
        }
      }
    }
  }
`;

export interface ContractorEmployee {
  _id: string;
  organizationCode: string;
  tenantCode: string;
  employeeID: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  isDeleted: boolean;
  contractorCode: string;
  deployment?: {
    department?: {
      departmentCode: string;
      departmentName: string;
    };
    designation?: {
      designationCode: string;
      designationName: string;
    };
  };
}

interface UseContractorEmployeeReturn {
  employees: ContractorEmployee[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useContractorEmployee = (): UseContractorEmployeeReturn => {
  const [employees, setEmployees] = useState<ContractorEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const tenantCode = useGetTenantCode();
  const client = useApolloClient();

  const {
    data: employeesData,
    error: employeesError,
    loading: employeesLoading,
    refetch: refetchEmployees
  } = useQuery(FETCH_CONTRACTOR_EMPLOYEES_QUERY, {
    variables: { tenantCode },
    client,
    errorPolicy: 'all',
    skip: !tenantCode,
    onCompleted: (data) => {
      if (data?.fetchEmployees) {
        // Filter out deleted employees and map the data
        const filteredEmployees = data.fetchEmployees
          .filter((emp: any) => emp?.isDeleted !== true)
          .map((emp: any) => ({
            _id: emp._id,
            organizationCode: emp.organizationCode || "",
            contractorCode: emp.contractorCode || "",
            tenantCode: emp.tenantCode || "",
            employeeID: emp.employeeID || "",
            firstName: emp.firstName || "",
            middleName: emp.middleName || "",
            lastName: emp.lastName || "",
            isDeleted: emp.isDeleted || false,
            deployment: emp.deployment || null
          }));
        
        setEmployees(filteredEmployees);
        setLoading(false);
        setError(null);
      } else {
        setError("No contractor employee data found");
        setLoading(false);
      }
    },
    onError: (error) => {
      setError("Failed to fetch contractor employees");
      setLoading(false);
    }
  });

  // Refetch function
  const refetch = () => {
    setLoading(true);
    setError(null);
    refetchEmployees();
  };

  // Handle loading state
  useEffect(() => {
    setLoading(employeesLoading);
  }, [employeesLoading]);

  // Handle error state
  useEffect(() => {
    if (employeesError) {
      setError(employeesError.message);
      setLoading(false);
    }
  }, [employeesError]);

  return {
    employees,
    loading,
    error,
    refetch
  };
};