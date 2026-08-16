import "./globals.css";
import Navbar from "@/components/Navbar";
import ChatProvider from "@/components/ChatProvider";
import ThemeProvider from "@/components/ThemeProvider";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  title: SITE_NAME,
  description: `${SITE_TAGLINE} Discover projects, find collaborators, build together.`,
  openGraph: {
    title: SITE_NAME,
    description: `${SITE_TAGLINE} Discover projects, find collaborators, build together.`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: `${SITE_TAGLINE} Discover projects, find collaborators, build together.`,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ChatProvider>
            <Navbar />
            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
          </ChatProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
