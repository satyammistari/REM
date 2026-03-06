import "./globals.css";
import React from "react";

export const metadata = {
  title: "REM — Recursive Episodic Memory",
  description: "Memory infrastructure for AI agents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

