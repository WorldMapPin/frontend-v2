import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar, Footer } from "../components";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WorldMapPin",
  description: "Join WorldMapPin to explore and share unique travel experiences. Discover new destinations through the eyes of fellow travelers and post your own journey on our interactive map.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />

        <main className="pt-12 sm:pt-14 md:pt-16 min-h-screen">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
