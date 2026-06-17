import { gql, useQuery } from '@apollo/client';

// Define the GraphQL query
const FETCH_ALL_WORKFLOWS = gql`
  query FetchAllWorkflows {
    fetchAllWorkflows(collection: "workflows") {
      _id
      label: name
      value: name
      initialState
      states
    }
  }
`;

// Define TypeScript interfaces for the response
interface WorkflowState {
  _id: string;
  name: string;
  // Add other state properties as needed
}

interface Workflow {
  _id: string;
  label: string;
  initialState: string;
  states: WorkflowState[];
}

interface FetchAllWorkflowsResponse {
  fetchAllWorkflows: Workflow[];
}

// Create the hook
export const useFetchAllWorkflows = () => {
  const { data, loading, error } = useQuery<FetchAllWorkflowsResponse>(FETCH_ALL_WORKFLOWS, {
    fetchPolicy: 'network-only', // This ensures we always get fresh data
  });

  return {
    workflows: data?.fetchAllWorkflows || [],
    loading,
    error,
  };
};
