// app/layout.tsx: ルートのフォントとメタ情報をまとめ、全体のレイアウトを整える。
import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

// 見出しと本文のフォントを分けて、軽いコントラストを作る。
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
        {/* フォント変数はルートに集約して各コンポーネントを簡潔に保つ。 */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
