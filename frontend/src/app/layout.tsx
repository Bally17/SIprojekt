import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Praxy – správa odbornej praxe jednoducho",
  description:
    "CRM systém pre študentov, firmy a garantov. Správa praxí, dokumentov a stavov – bez papierovačiek.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk">
      <body>{children}</body>
    </html>
  );
}
