import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "./providers";
import { SearchHandler } from "@/components/SearchHandler";
import UnregisterServiceWorkers from "@/components/UnregisterServiceWorkers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ShebaSetu · Healthcare Simplified",
  description: " Dhaka's premium AI-powered patient queue & hospital management system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background antialiased selection:bg-primary/20`}>
        <Providers>
          <SearchHandler />
          <UnregisterServiceWorkers />
          {children}
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}
