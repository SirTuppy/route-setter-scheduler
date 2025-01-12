// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/providers/auth-provider";
import "./globals.css";

/*
export const viewport: Viewport = {
  width: "1024"
};
*/

export const metadata: Metadata = {
  title: "DFW Schedule",
  description: "Built with love <3",
};

// Rest of your layout code remains the same

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}