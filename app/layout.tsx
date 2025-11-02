import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ConditionalNavbar } from "@/components/conditional-navbar";
import { Toaster } from "@/components/ui/sonner";
import { EnvCheck } from "@/components/env-check";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Bid Master",
    template: "%s | Bid Master",
  },
  description: "Internal university auction platform where students can list items and bid on auctions",
  keywords: ["auction", "university", "bidding", "student", "marketplace"],
  authors: [{ name: "Bid Master Team" }],
  creator: "Bid Master",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bidmaster.university",
    title: "Bid Master - University Auction Platform",
    description: "Internal university auction platform where students can list items and bid on auctions",
    siteName: "Bid Master",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bid Master - University Auction Platform",
    description: "Internal university auction platform where students can list items and bid on auctions",
  },
  robots: {
    index: false, // Internal platform, don't index
    follow: false,
  },
  verification: {
    google: "your-google-verification-code", // Add your verification code
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col">
            <ConditionalNavbar>
              {children}
            </ConditionalNavbar>
          </div>
          <Toaster />
          <EnvCheck />
        </ThemeProvider>
      </body>
    </html>
  );
}
