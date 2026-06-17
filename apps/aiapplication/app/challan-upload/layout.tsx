import type { Metadata } from "next";
import DashboardWrapper from "@/components/dashboard-wrapper";
import AdminWrapper from "@/components/adminWrapper";
import Provider from "@repo/ui/components/providers";
import { Inter } from 'next/font/google';
import { ToastContainer } from 'react-toastify';
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import SideMenu from "@/components/header/side-menu";

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
        className={` antialiased`}
      >
        {/* <AdminWrapper> */}
            <SideMenu/>
          <DashboardWrapper>
              {children}
          </DashboardWrapper>
          {/* </AdminWrapper> */}
      </body>
    </html>
  );
}
