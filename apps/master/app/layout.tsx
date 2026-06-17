import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import DashboardWrapper from "@/components/dashboard-wrapper";
import AdminWrapper from "@/components/adminWrapper";
import Provider from "@repo/ui/components/providers";
import { Inter } from 'next/font/google';
import { ToastContainer } from 'react-toastify';
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
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
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProviderWrapper>
        <Provider>
        <AdminWrapper>
            <SideMenu/>
          <DashboardWrapper>
              {children}
          </DashboardWrapper>
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
        
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
