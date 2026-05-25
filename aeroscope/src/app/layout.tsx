import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aeroscope",
  description: "Live aircraft tracking over airports",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Cesium widget styles — loaded globally, not via Next CSS pipeline */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link href="/cesium/Widgets/widgets.css" rel="stylesheet" />
      </head>
      <body>
        <Script src="/cesium/Cesium.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
