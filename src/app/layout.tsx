import React from "react";
import "./globals.css";
import { ClientWrapper } from "./ClientWrapper";

export const metadata = {
  title: "Happilo Growth OS",
  description: "Growth operating system for Happilo — premium nuts, dry fruits & healthy snacks. Inventory, customer care, marketing, B2B sales and receivables in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}
