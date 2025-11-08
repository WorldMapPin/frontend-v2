import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Lexend, Poppins } from "next/font/google";
import "./globals.css";
import { Navbar, Footer } from "../components";
import AiohaProviderWrapper from "../components/AiohaProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400"],
  style: ["italic", "normal"],
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lexend.variable} ${poppins.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <AiohaProviderWrapper>
          <Navbar />

          <main className="pt-12 sm:pt-14 md:pt-16 flex-1">
            {children}
          </main>

          <Footer />
        </AiohaProviderWrapper>
      </body>
    </html>
  );
}
