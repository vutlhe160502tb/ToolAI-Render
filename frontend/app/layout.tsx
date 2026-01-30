import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from '@/components/SessionProvider';
import MetaMaskErrorHandler from '@/components/MetaMaskErrorHandler';
import { ToastProvider } from '@/contexts/ToastContext';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Phù Thuỷ AI - Bẻ cong timeline",
  description: "Tạo video AI với nhiều tính năng đa dạng",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <MetaMaskErrorHandler />
        <SessionProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
