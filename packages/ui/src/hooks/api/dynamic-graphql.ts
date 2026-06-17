import { gql, useQuery } from '@apollo/client';
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import useCurrentDomain from "@/hooks/api/useCurrentDomain";

// Get API URL from environment variables with fallbacks
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL;
};

// Get GraphQL endpoint from environment variable
const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 
  (process.env.NEXT_PUBLIC_API_BASE_URL 
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/graphql`
    : ''); // fallback for development
    
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

const redirectToLoginOnClient = () => {
  if (typeof window === 'undefined') return;
  const target = getLoginRedirectUrl();
  if (window.location.pathname !== '/login') {
    window.location.assign(target);
  }
};


const AUTH_TOKEN_CACHE_TTL_MS = 30_000;
let authTokenCache: { token: string | null; fetchedAt: number } | null = null;

const getAuthTokenEndpoint = () => {
  if (typeof window !== 'undefined') return '/api/auth/token';
  if (process.env.NEXTAUTH_URL) return `${process.env.NEXTAUTH_URL}/api/auth/token`;
  return null;
};

const getAccessToken = async (): Promise<string | null> => {
  const now = Date.now();
  if (authTokenCache && now - authTokenCache.fetchedAt < AUTH_TOKEN_CACHE_TTL_MS) {
    return authTokenCache.token;
  }

  const endpoint = getAuthTokenEndpoint();
  if (!endpoint) return null;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        redirectToLoginOnClient();
      }
      authTokenCache = { token: null, fetchedAt: Date.now() };
      return null;
    }

    const data = (await response.json()) as { accessToken?: string };
    const token = data.accessToken || null;
    authTokenCache = { token, fetchedAt: Date.now() };
    return token;
  } catch {
    authTokenCache = { token: null, fetchedAt: Date.now() };
    return null;
  }
};

// Create the http link
const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
  credentials: 'include',
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  const statusCode = (networkError as any)?.statusCode ?? (networkError as any)?.response?.status;
  const unauthenticatedGraphQLError = (graphQLErrors || []).some(
    (gqlError: any) => gqlError?.extensions?.code === 'UNAUTHENTICATED'
  );

  if (statusCode === 401 || unauthenticatedGraphQLError) {
    redirectToLoginOnClient();
  }
});


// Create the auth link
const authLink = setContext(async (_, { headers }) => {
  const token = await getAccessToken();
  

  // Return the headers to the context
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  };
});

// Create a singleton Apollo Client
let apolloClient: ApolloClient<any> | null = null;

const createApolloClient = () => {
  if (apolloClient) return apolloClient;

  apolloClient = new ApolloClient({
    link: errorLink.concat(authLink.concat(httpLink)),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
    },
  });

  return apolloClient;
};

// Initialize the client
export const client = createApolloClient();

interface DynamicQuerySelection {
  fields: string[];
}

interface DynamicQueryVariables {
  collection: string;
  id?: string; // Add explicit type for id
  [key: string]: any; // Allow additional variables
}

interface DynamicQueryResult {
  [key: string]: any[]; // This will match any operation name
}

// Helper function to build the query
const buildDynamicQuery = (
  selection: DynamicQuerySelection,
  operationName: string,
  operationType: string,
  additionalVariables?: Record<string, any>
) => {
  // Build variable definitions - start with collection
  const variableDefinitions = ['$collection: String!'];
  
  // Build operation arguments - start with collection
  const operationArgs = ['collection: $collection'];
  
  if (additionalVariables) {
    Object.keys(additionalVariables).forEach(key => {
      // Skip collection as it's already handled
      if (key === 'collection') return;
      
      // Special handling for 'id' parameter to use ID! type
      if (key === 'id') {
        variableDefinitions.push(`$${key}: ID!`);
      } else {
        // Use String! for non-nullable strings based on the error message
        variableDefinitions.push(`$${key}: String!`);
      }
      operationArgs.push(`${key}: $${key}`);
    });
  }

  return gql`
    query ${operationName}(${variableDefinitions.join(', ')}) {
      ${operationType}(${operationArgs.join(', ')}) {
        ${selection.fields.join('\n        ')}
      }
    }
  `;
};

interface UseDynamicQueryResult {
  data: any[]; // TODO: Replace with proper type based on your schema
  loading: boolean;
  error: Error | undefined;
}

/**
 * A dynamic GraphQL query hook that can be used to fetch data from any collection
 * @param selection - The fields to select from the query
 * @param collection - The collection name to query
 * @param operationName - The name of the GraphQL operation
 * @param operationType - The type of operation (e.g., fetchAllWorkflows, fetchAllFileDetails)
 * @param additionalVariables - Additional variables to include in the query
 * @returns The query result with data, loading state, and any errors
 */
export const useDynamicQuery = (
  selection: DynamicQuerySelection,
  collection: string,
  operationName: string,
  operationType: string,
  additionalVariables?: Record<string, any>
): UseDynamicQueryResult => {
  const query = buildDynamicQuery(selection, operationName, operationType, additionalVariables);
  
  // Filter out collection from additionalVariables to avoid duplication
  const filteredAdditionalVariables = additionalVariables 
    ? Object.fromEntries(
        Object.entries(additionalVariables).filter(([key]) => key !== 'collection')
      )
    : {};
    
  const variables: DynamicQueryVariables = { 
    collection,
    ...filteredAdditionalVariables
  };

  const { data, loading, error } = useQuery<DynamicQueryResult, DynamicQueryVariables>(query, {
    client, // Use the singleton client instance
    variables,
    onCompleted: (data) => {
    },
    onError: (error) => {
    }
  });

  // Add validation for nested data
  const validateNestedData = (data: any) => {
    if (!data) return null;
    
    // Check if the data is an array and has items
    if (Array.isArray(data)) {
      return data.length > 0 ? data : null;
    }
    
    // Check if the data is an object and has nested arrays
    if (typeof data === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          result[key] = value.length > 0 ? value : null;
        } else if (typeof value === 'object' && value !== null) {
          result[key] = validateNestedData(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    }
    
    return data;
  };

  const processedData = data?.[operationType] ? validateNestedData(data[operationType]) : null;
  
 
  
  return {
    data: processedData || [],
    loading,
    error,
  };
};

// Update the standalone fetch function to use the singleton client
export async function fetchDynamicQuery(
  selection: DynamicQuerySelection,
  collection: string,
  operationName: string,
  operationType: string,
  additionalVariables?: Record<string, any>
) {
  const query = buildDynamicQuery(selection, operationName, operationType, additionalVariables);
  
  // Filter out collection from additionalVariables to avoid duplication
  const filteredAdditionalVariables = additionalVariables 
    ? Object.fromEntries(
        Object.entries(additionalVariables).filter(([key]) => key !== 'collection')
      )
    : {};
    
  const variables: DynamicQueryVariables = {
    collection,
    ...filteredAdditionalVariables
  };

  try {
    const { data } = await client.query({
      query,
      variables,
    });

    // Use the same validateNestedData logic
    const validateNestedData = (data: any) => {
      if (!data) return null;
      if (Array.isArray(data)) {
        return data.length > 0 ? data : null;
      }
      if (typeof data === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(data)) {
          if (Array.isArray(value)) {
            result[key] = value.length > 0 ? value : null;
          } else if (typeof value === 'object' && value !== null) {
            result[key] = validateNestedData(value);
          } else {
            result[key] = value;
          }
        }
        return result;
      }
      return data;
    };
    const processedData = data?.[operationType] ? validateNestedData(data[operationType]) : null;
    return {
      data: processedData || [],
      loading: false,
      error: undefined,
    };
  } catch (error: any) {
    
    return {
      data: [],
      loading: false,
      error,
    };
  }
}

// Universal criteria-based GraphQL query function
export async function executeCriteriaQuery(
  options: {
    operationName: string;
    operationType: string;
    criteriaRequests: Array<{ field: string; operator: string; value: string }>;
    collection?: string;
    fields: string[];
    variables?: Record<string, any>;
    additionalArgs?: Record<string, any>;
    accessToken?: string;
    graphqlEndpoint?: string;
    timeout?: number;
    headers?: Record<string, string>;
    extractDataPath?: string;
    transformResponse?: (data: any) => any;
  }
) {
  const {
    operationName,
    operationType,
    criteriaRequests,
    collection,
    fields,
    variables = {},
    additionalArgs = {},
    accessToken,
    graphqlEndpoint,
    timeout = 10000,
    headers: customHeaders = {},
    extractDataPath,
    transformResponse
  } = options;

  try {
    // Use provided endpoint or fallback to default
    const endpoint = graphqlEndpoint || GRAPHQL_URL;
    
    // Build the query dynamically
    const criteriaString = criteriaRequests.map(criteria => 
      `{ field: "${criteria.field}", operator: "${criteria.operator}", value: "${criteria.value}" }`
    ).join(', ');

    // Build additional arguments
    const additionalArgsString = Object.keys(additionalArgs).map(key => {
      const value = additionalArgs[key];
      if (typeof value === 'string') return `${key}: "${value}"`;
      if (typeof value === 'number') return `${key}: ${value}`;
      if (typeof value === 'boolean') return `${key}: ${value}`;
      if (Array.isArray(value)) return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`;
      if (typeof value === 'object' && value !== null) {
        const objString = Object.entries(value).map(([k, v]) => {
          if (typeof v === 'string') return `${k}: "${v}"`;
          if (typeof v === 'number') return `${k}: ${v}`;
          if (typeof v === 'boolean') return `${k}: ${v}`;
          return `${k}: "${v}"`;
        }).join(', ');
        return `${key}: { ${objString} }`;
      }
      return `${key}: "${value}"`;
    }).join(', ');

    // Build the complete query
    const args = [`criteriaRequests: [${criteriaString}]`];
    if (collection) args.push(`collection: "${collection}"`);
    if (additionalArgsString) args.push(additionalArgsString);

    // Build variable definitions only if there are variables
    const variableDefinitions = Object.keys(variables).length > 0 
      ? `(${Object.keys(variables).map(key => `$${key}: String!`).join(', ')})`
      : '';

    const query = `
      query ${operationName}${variableDefinitions} {
        ${operationType}(${args.join(', ')}) {
          ${fields.join('\n          ')}
        }
      }
    `;


    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...customHeaders
    };

    // Add authorization header if token is provided
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }


    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        redirectToLoginOnClient();
      }
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL query errors: ${JSON.stringify(result.errors)}`);
    }

    // Check if we have data
    if (!result.data) {
      throw new Error('GraphQL response contains no data');
    }

    // Extract data based on the path
    let extractedData = result.data;
    if (extractDataPath) {
      const pathParts = extractDataPath.split('.');
      for (const part of pathParts) {
        if (extractedData && typeof extractedData === 'object' && part in extractedData) {
          extractedData = extractedData[part];
        } else {
          extractedData = null;
          break;
        }
      }
    } else {
      // Default extraction path
      extractedData = result.data?.[operationType] || [];
    }

    // Apply custom transformation if provided
    let finalData = extractedData;
    if (transformResponse && finalData !== null) {
      try {
        finalData = transformResponse(finalData);
      } catch (transformError) {
      }
    }

    return {
      data: finalData,
      rawData: result.data,
      loading: false,
      error: undefined,
    };
  } catch (error: any) {
    
    // Provide more specific error messages
    let errorMessage = 'Unknown error occurred';
    if (error.name === 'AbortError') {
      errorMessage = `Request timed out after ${timeout}ms - please check your connection`;
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage = 'Network error - unable to connect to GraphQL server. Please check if the server is running and accessible.';
    } else if (error.message.includes('HTTP error')) {
      errorMessage = error.message;
    } else if (error.message.includes('GraphQL query errors')) {
      errorMessage = error.message;
    } else if (error.message.includes('No data in GraphQL response')) {
      errorMessage = 'GraphQL server responded but returned no data. Please check your query parameters.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      data: [],
      rawData: null,
      loading: false,
      error: new Error(errorMessage),
    };
  }
}

// Backward compatibility - now uses the universal function
export async function fetchCompanyEmployeeQuery(
  criteriaRequests: Array<{ field: string; operator: string; value: string }>,
  collection: string,
  fields: string[] = ['employeeID'],
  accessToken?: string,
  graphqlEndpoint?: string
) {
  return executeCriteriaQuery({
    operationName: 'FetchCompanyEmployee',
    operationType: 'fetchCompanyEmployee',
    criteriaRequests,
    collection,
    fields,
    accessToken,
    graphqlEndpoint,
    extractDataPath: 'data.fetchCompanyEmployee'
  });
}

// Add a completely dynamic GraphQL function for any operation
export async function fetchDynamicGraphQL(
  query: string,
  variables: Record<string, any> = {},
  options: {
    accessToken?: string;
    graphqlEndpoint?: string;
    timeout?: number;
    headers?: Record<string, string>;
  } = {}
) {
  const {
    accessToken,
    graphqlEndpoint,
    timeout = 10000,
    headers: customHeaders = {}
  } = options;

  try {
    // Use provided endpoint or fallback to default
    const endpoint = graphqlEndpoint || GRAPHQL_URL;
    

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...customHeaders
    };

    // Add authorization header if token is provided
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }


    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    
    if (!response.ok) {
      if (response.status === 401) {
        redirectToLoginOnClient();
      }
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL query errors: ${JSON.stringify(result.errors)}`);
    }

    return {
      data: result.data,
      loading: false,
      error: undefined,
    };
  } catch (error: any) {
    

    // Provide more specific error messages
    let errorMessage = 'Unknown error occurred';
    if (error.name === 'AbortError') {
      errorMessage = `Request timed out after ${timeout}ms - please check your connection`;
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage = 'Network error - unable to connect to GraphQL server. Please check if the server is running and accessible.';
    } else if (error.message.includes('HTTP error')) {
      errorMessage = error.message;
    }

    return {
      data: null,
      loading: false,
      error: new Error(errorMessage),
    };
  }
}

// Helper function to build GraphQL queries dynamically
export function buildGraphQLQuery(
  operationName: string,
  operationType: string,
  fields: string[],
  variables: Record<string, any> = {},
  operationArgs: Record<string, any> = {}
) {
  // Build variable definitions with proper GraphQL types
  const variableDefinitions = Object.keys(variables).map(key => {
    const value = variables[key];
    if (typeof value === 'string') return `$${key}: String!`;
    if (typeof value === 'number') {
      // Check if it's an integer or float
      return Number.isInteger(value) ? `$${key}: Int!` : `$${key}: Float!`;
    }
    if (typeof value === 'boolean') return `$${key}: Boolean!`;
    if (value === null) return `$${key}: String`; // Nullable
    if (Array.isArray(value)) {
      if (value.length === 0) return `$${key}: [String!]`; // Empty array, nullable
      const firstItem = value[0];
      if (typeof firstItem === 'string') return `$${key}: [String!]!`;
      if (typeof firstItem === 'number') return `$${key}: [Int!]!`;
      if (typeof firstItem === 'boolean') return `$${key}: [Boolean!]!`;
      if (typeof firstItem === 'object' && firstItem !== null) return `$${key}: [JSON!]!`;
      return `$${key}: [String!]!`;
    }
    if (typeof value === 'object' && value !== null) return `$${key}: JSON!`;
    return `$${key}: String!`; // Default to String
  });

  // Build operation arguments with proper GraphQL syntax
  const args = Object.keys(operationArgs).map(key => {
    const value = operationArgs[key];
    
    if (value === null || value === undefined) return `${key}: null`;
    if (typeof value === 'string') return `${key}: "${value}"`;
    if (typeof value === 'number') return `${key}: ${value}`;
    if (typeof value === 'boolean') return `${key}: ${value}`;
    
    if (Array.isArray(value)) {
      if (value.length === 0) return `${key}: []`;
      
      if (key === 'criteriaRequests') {
        // Special handling for criteriaRequests array
        const criteriaString = value.map((criteria: any) => 
          `{ field: "${criteria.field}", operator: "${criteria.operator}", value: "${criteria.value}" }`
        ).join(', ');
        return `${key}: [${criteriaString}]`;
      }
      
      if (key === 'fields' || key === 'select') {
        // Handle field selection arrays
        return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`;
      }
      
      if (key === 'ids' || key === 'id') {
        // Handle ID arrays
        return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`;
      }
      
      if (key === 'filters' || key === 'where') {
        // Handle filter objects
        const filterString = value.map((filter: any) => {
          if (typeof filter === 'object' && filter !== null) {
            return `{ ${Object.entries(filter).map(([k, v]) => {
              if (typeof v === 'string') return `${k}: "${v}"`;
              if (typeof v === 'number') return `${k}: ${v}`;
              if (typeof v === 'boolean') return `${k}: ${v}`;
              if (Array.isArray(v)) return `${k}: [${v.map(item => `"${item}"`).join(', ')}]`;
              return `${k}: "${v}"`;
            }).join(', ')} }`;
          }
          return `"${filter}"`;
        }).join(', ');
        return `${key}: [${filterString}]`;
      }
      
      // Generic array handling
      const arrayString = value.map(v => {
        if (typeof v === 'string') return `"${v}"`;
        if (typeof v === 'number') return v;
        if (typeof v === 'boolean') return v;
        if (typeof v === 'object' && v !== null) {
          return `{ ${Object.entries(v).map(([k, val]) => {
            if (typeof val === 'string') return `${k}: "${val}"`;
            if (typeof val === 'number') return `${k}: ${val}`;
            if (typeof val === 'boolean') return `${k}: ${val}`;
            if (Array.isArray(val)) return `${k}: [${val.map(item => `"${item}"`).join(', ')}]`;
            return `${k}: "${val}"`;
          }).join(', ')} }`;
        }
        return `"${v}"`;
      }).join(', ');
      return `${key}: [${arrayString}]`;
    }
    
    if (typeof value === 'object' && value !== null) {
      // Handle nested objects
      if (key === 'pagination' || key === 'page' || key === 'limit') {
        // Handle pagination objects
        const paginationString = Object.entries(value).map(([k, v]) => {
          if (typeof v === 'string') return `${k}: "${v}"`;
          if (typeof v === 'number') return `${k}: ${v}`;
          if (typeof v === 'boolean') return `${k}: ${v}`;
          return `${k}: "${v}"`;
        }).join(', ');
        return `${key}: { ${paginationString} }`;
      }
      
      if (key === 'sort' || key === 'orderBy') {
        // Handle sorting objects
        const sortString = Object.entries(value).map(([k, v]) => {
          if (typeof v === 'string') return `${k}: "${v}"`;
          if (typeof v === 'number') return `${k}: ${v}`;
          if (typeof v === 'boolean') return `${k}: ${v}`;
          return `${k}: "${v}"`;
        }).join(', ');
        return `${key}: { ${sortString} }`;
      }
      
      // Generic object handling
      const objectString = Object.entries(value).map(([k, v]) => {
        if (typeof v === 'string') return `${k}: "${v}"`;
        if (typeof v === 'number') return `${k}: ${v}`;
        if (typeof v === 'boolean') return `${k}: ${v}`;
        if (Array.isArray(v)) {
          const arrayString = v.map(item => {
            if (typeof item === 'string') return `"${item}"`;
            if (typeof item === 'number') return item;
            if (typeof item === 'boolean') return item;
            return `"${item}"`;
          }).join(', ');
          return `${k}: [${arrayString}]`;
        }
        if (typeof v === 'object' && v !== null) {
          const nestedString = Object.entries(v).map(([nk, nv]) => {
            if (typeof nv === 'string') return `${nk}: "${nv}"`;
            if (typeof nv === 'number') return `${nk}: ${nv}`;
            if (typeof nv === 'boolean') return `${nk}: ${nv}`;
            return `${nk}: "${nv}"`;
          }).join(', ');
          return `${k}: { ${nestedString} }`;
        }
        return `${k}: "${v}"`;
      }).join(', ');
      return `${key}: { ${objectString} }`;
    }
    
    return `${key}: "${value}"`; // Default to string
  });

  const query = `
    query ${operationName}(${variableDefinitions.join(', ')}) {
      ${operationType}(${args.join(', ')}) {
        ${fields.join('\n        ')}
      }
    }
  `;

  return query;
}

// Universal GraphQL function that can handle ANY type of query
export async function executeGraphQL(
  options: {
    // Query options
    query?: string;
    mutation?: string;
    subscription?: string;
    
    // Dynamic query building
    operationName?: string;
    operationType?: string;
    fields?: string[];
    variables?: Record<string, any>;
    operationArgs?: Record<string, any>;
    
    // Request options
    accessToken?: string;
    graphqlEndpoint?: string;
    timeout?: number;
    headers?: Record<string, string>;
    
    // Authentication options
    authType?: 'bearer' | 'basic' | 'apiKey' | 'custom';
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
    
    // Response handling
    extractDataPath?: string; // e.g., "data.users" or "data.fetchCompanyEmployee"
    transformResponse?: (data: any) => any;
    
    // Advanced options
    retryAttempts?: number;
    retryDelay?: number;
    validateResponse?: boolean;
    customFetch?: typeof fetch;
  }
) {
  const {
    query: rawQuery,
    mutation: rawMutation,
    subscription: rawSubscription,
    operationName,
    operationType,
    fields,
    variables = {},
    operationArgs = {},
    accessToken,
    graphqlEndpoint,
    timeout = 10000,
    headers: customHeaders = {},
    authType = 'bearer',
    username,
    password,
    apiKey,
    apiKeyHeader = 'X-API-Key',
    extractDataPath,
    transformResponse,
    retryAttempts = 0,
    retryDelay = 1000,
    validateResponse = true,
    customFetch = fetch
  } = options;

  // Validation
  if (!rawQuery && !rawMutation && !rawSubscription && (!operationName || !operationType || !fields)) {
    throw new Error('Must provide either a raw query/mutation/subscription OR operationName + operationType + fields');
  }

  if (rawSubscription && !graphqlEndpoint) {
    throw new Error('GraphQL endpoint is required for subscriptions');
  }

  // Retry logic
  const executeWithRetry = async (attempt: number = 0): Promise<any> => {
    try {
      // Use provided endpoint or fallback to default
      const endpoint = graphqlEndpoint || GRAPHQL_URL;
      
      // Determine the final query string
      let finalQuery = '';
      let operationKind = '';
      
      if (rawQuery) {
        finalQuery = rawQuery;
        operationKind = 'query';
      } else if (rawMutation) {
        finalQuery = rawMutation;
        operationKind = 'mutation';
      } else if (rawSubscription) {
        finalQuery = rawSubscription;
        operationKind = 'subscription';
      } else if (operationName && operationType && fields) {
        // Build query dynamically
        finalQuery = buildGraphQLQuery(operationName, operationType, fields, variables, operationArgs);
        operationKind = 'query';
      }


      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...customHeaders
      };

      // Handle different authentication types
      switch (authType) {
        case 'bearer':
          if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
          }
          break;
        case 'basic':
          if (username && password) {
            const credentials = btoa(`${username}:${password}`);
            headers['Authorization'] = `Basic ${credentials}`;
          }
          break;
        case 'apiKey':
          if (apiKey) {
            headers[apiKeyHeader] = apiKey;
          }
          break;
        case 'custom':
          // Custom headers are already in customHeaders
          break;
      }


      // Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await customFetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: finalQuery,
          variables
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          redirectToLoginOnClient();
        }
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.errors && validateResponse) {
        throw new Error(`GraphQL query errors: ${JSON.stringify(result.errors)}`);
      }

      // Extract data based on the path
      let extractedData = result.data;
      if (extractDataPath) {
        const pathParts = extractDataPath.split('.');
        for (const part of pathParts) {
          if (extractedData && typeof extractedData === 'object' && part in extractedData) {
            extractedData = extractedData[part];
          } else {
            extractedData = null;
            break;
          }
        }
      }

      // Apply custom transformation if provided
      let finalData = extractedData;
      if (transformResponse && finalData !== null) {
        try {
          finalData = transformResponse(finalData);
        } catch (transformError) {
          
          // Continue with untransformed data
        }
      }

      return {
        data: finalData,
        rawData: result.data,
        loading: false,
        error: undefined,
      };
    } catch (error: any) {
      // Retry logic
      if (attempt < retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return executeWithRetry(attempt + 1);
      }

      
      // Provide more specific error messages
      let errorMessage = 'Unknown error occurred';
      if (error.name === 'AbortError') {
        errorMessage = `Request timed out after ${timeout}ms - please check your connection`;
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error - unable to connect to GraphQL server. Please check if the server is running and accessible.';
      } else if (error.message.includes('HTTP error')) {
        errorMessage = error.message;
      } else if (error.message.includes('GraphQL query errors')) {
        errorMessage = error.message;
      }

      return {
        data: null,
        rawData: null,
        loading: false,
        error: new Error(errorMessage),
      };
    }
  };

  return executeWithRetry();
}

// Convenience functions for common operations
export const executeQuery = (options: Omit<Parameters<typeof executeGraphQL>[0], 'query' | 'mutation' | 'subscription'> & { query: string }) => {
  return executeGraphQL({ ...options, query: options.query });
};

export const executeMutation = (options: Omit<Parameters<typeof executeGraphQL>[0], 'query' | 'mutation' | 'subscription'> & { mutation: string }) => {
  return executeGraphQL({ ...options, mutation: options.mutation });
};

export const executeSubscription = (options: Omit<Parameters<typeof executeGraphQL>[0], 'query' | 'mutation' | 'subscription'> & { subscription: string }) => {
  return executeGraphQL({ ...options, subscription: options.subscription });
};

// Universal function for building any GraphQL operation dynamically
export function buildUniversalGraphQL(
  operation: {
    name: string;
    type: 'query' | 'mutation' | 'subscription';
    operation: string;
    fields: string[];
    variables?: Record<string, any>;
    args?: Record<string, any>;
  }
) {
  const { name, type, operation: operationName, fields, variables = {}, args = {} } = operation;
  
  if (type === 'subscription') {
    return `
      subscription ${name}(${Object.keys(variables).map(key => `$${key}: String!`).join(', ')}) {
        ${operationName}(${Object.keys(args).map(key => {
          const value = args[key];
          if (typeof value === 'string') return `${key}: "${value}"`;
          if (typeof value === 'number') return `${key}: ${value}`;
          if (typeof value === 'boolean') return `${key}: ${value}`;
          if (Array.isArray(value)) return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`;
          if (typeof value === 'object' && value !== null) {
            const objString = Object.entries(value).map(([k, v]) => {
              if (typeof v === 'string') return `${k}: "${v}"`;
              if (typeof v === 'number') return `${k}: ${v}`;
              if (typeof v === 'boolean') return `${k}: ${v}`;
              return `${k}: "${v}"`;
            }).join(', ');
            return `${key}: { ${objString} }`;
          }
          return `${key}: "${value}"`;
        }).join(', ')}) {
          ${fields.join('\n          ')}
        }
      }
    `;
  }
  
  if (type === 'mutation') {
    return `
      mutation ${name}(${Object.keys(variables).map(key => `$${key}: String!`).join(', ')}) {
        ${operationName}(${Object.keys(args).map(key => {
          const value = args[key];
          if (typeof value === 'string') return `${key}: "${value}"`;
          if (typeof value === 'number') return `${key}: ${value}`;
          if (typeof value === 'boolean') return `${key}: ${value}`;
          if (Array.isArray(value)) return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`;
          if (typeof value === 'object' && value !== null) {
            const objString = Object.entries(value).map(([k, v]) => {
              if (typeof v === 'string') return `${k}: "${v}"`;
              if (typeof v === 'number') return `${k}: ${v}`;
              if (typeof v === 'boolean') return `${k}: ${v}`;
              return `${k}: "${v}"`;
            }).join(', ');
            return `${key}: { ${objString} }`;
          }
          return `${key}: "${value}"`;
        }).join(', ')}) {
          ${fields.join('\n          ')}
        }
      }
    `;
  }
  
  // Default to query
  return `
    query ${name}(${Object.keys(variables).map(key => `$${key}: String!`).join(', ')}) {
      ${operationName}(${Object.keys(args).map(key => {
        const value = args[key];
        if (typeof value === 'string') return `${key}: "${value}"`;
        if (typeof value === 'number') return `${key}: ${value}`;
        if (typeof value === 'boolean') return `${key}: ${value}`;
        if (Array.isArray(value)) return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`;
        if (typeof value === 'object' && value !== null) {
          const objString = Object.entries(value).map(([k, v]) => {
            if (typeof v === 'string') return `${k}: "${v}"`;
            if (typeof v === 'number') return `${k}: ${v}`;
            if (typeof v === 'boolean') return `${k}: ${v}`;
            return `${k}: "${v}"`;
          }).join(', ');
          return `${key}: { ${objString} }`;
        }
        return `${key}: "${value}"`;
      }).join(', ')}) {
        ${fields.join('\n        ')}
      }
    }
  `;
} 
