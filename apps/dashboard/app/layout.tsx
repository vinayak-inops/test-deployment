import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import DashboardWrapper from "@/_components/dashboard-wrapper";
import Provider from "@repo/ui/components/providers";
import SessionProviderWrapper from "@/_components/SessionProviderWrapper";
import AdminWrapper from "@/_components/adminWrapper";
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

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#f3f4f8]">
      <SessionProviderWrapper>
        <Provider>
        <AdminWrapper>
          
          <main className=""><SideMenu /><DashboardWrapper>{children}</DashboardWrapper></main>
                <Aiwrapper />
        </AdminWrapper>
        </Provider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
