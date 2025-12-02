import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Header } from "@/components/layout/Header";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ThemeScript } from "@/components/providers/ThemeScript";
import { ErrorBoundary } from "@/components/errors";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GigPro - Gig Worker Tracking",
  description: "Track your gig income, expenses, and profit",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility
  userScalable: true, // Don't disable - WCAG violation
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3B82F6" },
    { media: "(prefers-color-scheme: dark)", color: "#1E3A8A" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <ThemeScript />
        <ErrorBoundary>
          <ThemeProvider>
            <div className="min-h-screen bg-background transition-colors duration-300">
              <Header />
              <main className="animate-fade-in">{children}</main>
              <Toaster
                position="top-right"
                toastOptions={{
                  className: 'rounded-xl shadow-xl border border-border/50',
                  style: {
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    borderColor: 'var(--color-border)',
                  },
                  success: {
                    iconTheme: {
                      primary: 'var(--color-success)',
                      secondary: 'white',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: 'var(--color-danger)',
                      secondary: 'white',
                    },
                  },
                }}
              />
            </div>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
