import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Luxury/Clean font
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Sewlovely Homeset - Dashboard Mitra",
  description: "Aplikasi Affiliate Resmi Sewlovely Homeset",
};

import { AppSettingsProvider } from "@/providers/AppSettingsProvider";
import { SessionTimeoutProvider } from "@/providers/SessionTimeoutProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        <AppSettingsProvider>
          <SessionTimeoutProvider>
            {children}
            <Toaster position="top-center" richColors />
          </SessionTimeoutProvider>
        </AppSettingsProvider>
      </body>
    </html>
  );
}
