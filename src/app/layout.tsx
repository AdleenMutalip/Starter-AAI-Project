import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Budiman HRMS",
  description: "Leave Request module for Budiman Company.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
