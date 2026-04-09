import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoopInventory - Inventory Management System",
  description: "Cooperative Inventory Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-gray-50">{children}</body>
    </html>
  );
}
