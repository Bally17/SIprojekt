import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Odborná prax",
  description: "Frontend pre evidenciu praxí",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk">
      <body className="min-h-dvh bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
