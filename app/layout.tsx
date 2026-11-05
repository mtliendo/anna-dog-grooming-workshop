import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { getSessionSafe } from "@/lib/auth0";
import { isAuth0Configured } from "@/lib/config";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anna's Dog Grooming — AI Security Workshop",
  description:
    "Hands-on workshop: Auth0 sign-in, Token Vault + Google Calendar, and a secure MCP server.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const configured = isAuth0Configured();
  const session = await getSessionSafe();

  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} ${mono.variable}`}>
        <SiteHeader user={session?.user} configured={configured} />
        <main className="shell page">{children}</main>
        <footer className="footer">
          <div className="shell footer-row">
            <span>Anna&apos;s Dog Grooming · AI Security for the everyday dev</span>
            <span>Auth0 workshop by Michael Liendo · @focusotter</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
