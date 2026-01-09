import type React from "react";
import type { Metadata } from "next";
// import { GeistSans } from "geist/font/sans";
// import { GeistMono } from "geist/font/mono";
// import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Sistem Monitoring Pengadaan",
  description: "Sistem monitoring pengadaan barang untuk perusahaan",
  generator: "v0.app",
};
import { Toaster } from "@/components/ui/sonner";
import { BroadcastListener } from "@/components/BroadcastListener";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={<div>Loading...</div>}>
            {children}
            {/* <Analytics /> */}
          </Suspense>
          <Toaster />
          <BroadcastListener />
        </ThemeProvider>
      </body>
    </html>
  );
}
