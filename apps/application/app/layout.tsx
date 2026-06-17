import React from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Provider from "@repo/ui/components/providers";
import SessionProvider from "@/components/SessionProviderWrapper";
import { Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import AdminWrapper from "@/components/adminWrapper";
import SideMenu from "@/components/header/side-menu";
import Aiwrapper from "@/components/ai/ai-wrapper";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Metadata including favicon/logo
export const metadata: Metadata = {
  title: "Contract Labor Management System | Workforce & Compliance Solution",
  description: "Contract Labor Management System | Workforce & Compliance Solution",
  icons: {
    icon: "/images/logoiddion.png", // this will appear in the browser tab
    shortcut: "/images/logoiddion.png", 
    apple: "/images/logoiddion.png",  // for Apple devices
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-[#f3f4f8]">
        <ErrorBoundary fallback={<div>Something went wrong. Please refresh the page.</div>}>
          <Suspense fallback={<div>Loading...</div>}>
            <SessionProvider>
              <Provider>
                <AdminWrapper>
                  <SideMenu />
                  <main className="min-h-screen">{children}</main>
                <Aiwrapper />
                </AdminWrapper>
              </Provider>
            </SessionProvider>
          </Suspense>
        </ErrorBoundary>
      </body>
    </html>
  );
}