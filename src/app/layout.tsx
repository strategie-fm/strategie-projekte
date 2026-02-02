import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { KeyboardShortcutsProvider } from "@/components/providers/KeyboardShortcuts";
import { KeyboardShortcutsHelp } from "@/components/ui/KeyboardShortcutsHelp";

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
      <body>
        <AuthProvider>
          <KeyboardShortcutsProvider>
            {children}
            <KeyboardShortcutsHelp />
          </KeyboardShortcutsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}