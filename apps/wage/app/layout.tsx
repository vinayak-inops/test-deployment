import React, { Suspense } from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Provider from "@repo/ui/components/providers";
import SessionProvider from "@/components/SessionProviderWrapper";
import AdminWrapper from "@/components/adminWrapper";
import SideMenu from "@/components/header/side-menu";
import DashboardWrapper from "@/components/dashboard-wrapper";
import Aiwrapper from "@/components/ai/ai-wrapper";
import { ToastContainer } from "react-toastify";

// Load local fonts correctly
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
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
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-[#f3f4f8] font-sans">
        <Suspense fallback={<div>Loading...</div>}>
          <SessionProvider>
            <Provider>
              <AdminWrapper>
                <SideMenu />
                <DashboardWrapper>{children}</DashboardWrapper>
                <Aiwrapper />
              </AdminWrapper>
            </Provider>
            <ToastContainer 
                      position="top-right" 
                      autoClose={3000} 
                      hideProgressBar={false} 
                      newestOnTop 
                      closeOnClick 
                      pauseOnFocusLoss 
                      draggable 
                      pauseOnHover 
                      theme="light"
                      toastClassName="!border-blue-600"
                      progressClassName="!bg-green-600"
                    />
          </SessionProvider>
        </Suspense>
      </body>
    </html>
  );
}
