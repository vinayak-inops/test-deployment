"use client";
import { Provider } from "react-redux";
import { store } from "@inops/store/src/store/";
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '../lib/apollo-client';

export default function Providers({
  children,
}: Readonly<{
  children: any;
}>) {
  return (
    <ApolloProvider client={apolloClient}>
      <Provider store={store}>{children}</Provider>
    </ApolloProvider>
  );
}
