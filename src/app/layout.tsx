import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/providers/auth-provider"; // Ensure this path is correct or update it to the correct path
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "1024"
};

export const metadata: Metadata = {
  title: "DFW Schedule",
  description: "Built with love <3",
};

// Rest of your layout code remains the same

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="m-0 p-0 min-h-screen bg-slate-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}