import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "AURA - Real-Time Comm System",
  description: "High-Fidelity, Low-Latency. The next-generation WebRTC walkie-talkie platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-aura-bg text-aura-text antialiased selection:bg-aura-active selection:text-black`}>
        {children}
      </body>
    </html>
  );
}
