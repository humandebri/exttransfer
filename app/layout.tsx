// app/layout.tsx: Root layout sets global fonts, wallet styles, and metadata for the full app shell.
import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "@nfid/identitykit/react/styles.css";
import "./globals.css";
import Providers from "./providers";

// Display and body fonts are separated to create contrast without dark-mode bias.
const displayFont = Fraunces({
  variable: "--font-display-source",
  subsets: ["latin"],
});

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono-source",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EXT Transfer Studio",
  description: "Bulk transfer workspace for EXT NFTs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply global font variables once at the root to keep components clean. */}
      <body
        className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
