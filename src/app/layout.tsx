import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Monitor de Campanhas | Advocacia",
  description: "Dashboard interno para monitoramento e análise de campanhas do Meta Ads focado em conversão e CPL no nicho jurídico.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
    >
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-50 selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
