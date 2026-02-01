import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STRATEGIE - Projekte & Aufgaben",
  description: "Projekt- und Aufgabenverwaltung für Teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}