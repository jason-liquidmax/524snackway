import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthBoot from "@/lib/auth/AuthBoot";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "snackway",
  description: "paradigm office snack voting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-black font-mono">
        <AuthBoot />
        {children}
      </body>
    </html>
  );
}
