import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppIntro } from "@/components/layout/app-intro";
import { AppSoundtrack } from "@/components/layout/app-soundtrack";
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
  title: "Mundial Battle",
  description: "Pronosticos, fantasy y mapa interactivo para competir durante el Mundial 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppSoundtrack />
        <AppIntro />
        {children}
      </body>
    </html>
  );
}
