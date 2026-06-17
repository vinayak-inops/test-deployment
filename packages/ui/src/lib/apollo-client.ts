import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

// Safely resolve API base URL with a sane client-side fallback
const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '');

if (!process.env.NEXT_PUBLIC_API_BASE_URL && typeof window !== 'undefined') {
  // Helpful warning in development to surface misconfiguration
  // eslint-disable-next-line no-console
}

const httpLink = createHttpLink({
  uri: `${apiBaseUrl}/graphql`,
  // Ensure CORS-friendly defaults; attach credentials if your API requires cookies
  fetchOptions: {
    mode: 'cors',
  },
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});