import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import Navbar from "@/components/global-navbar";
import { SessionProvider } from "@/components/session-provider";
import { AppBanner } from "@/components/ui/banner";

const domain = process.env.DOMAIN || "localhost:3000";
const protocol = process.env.PROTOCOL || "http";
const clientUrl = `${protocol}://${domain}`;

export const metadata: Metadata = {
  title: {
    default: "Pomelo | Online Coding Contest & Assessment Platform",
    template: "%s | Pomelo",
  },
  description: "Pomelo is a lightweight, modern, self-hosted coding contest platform with real-time code execution, evaluation, and leaderboard statistics powered by Citron and Next.js.",
  keywords: [
    "coding contest",
    "programming competition",
    "online judge",
    "citron",
    "next.js",
    "monaco editor",
    "hackathon platform",
    "pomelo",
    "competitive programming"
  ],
  authors: [{ name: "Pomelo Team" }],
  creator: "Pomelo Team",
  publisher: "Pomelo",
  metadataBase: new URL(clientUrl),
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: clientUrl,
    title: "Pomelo | Online Coding Contest Platform",
    description: "Lightweight, modern coding contest platform with real-time code execution via Citron.",
    siteName: "Pomelo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pomelo | Online Coding Contest Platform",
    description: "Lightweight, modern coding contest platform with real-time code execution via Citron.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
        <body className="antialiased h-[100dvh] overflow-hidden box-border pt-[var(--banner-h,0px)]">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar />
            <AppBanner />

            {children}
          </ThemeProvider>
        </body>
      </html>
    </SessionProvider>
  );
}
