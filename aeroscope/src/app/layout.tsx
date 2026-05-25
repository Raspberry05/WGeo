import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aeroscope",
  description: "Live aircraft tracking over airports",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
