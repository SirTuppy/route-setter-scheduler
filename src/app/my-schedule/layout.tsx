import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function MyScheduleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}