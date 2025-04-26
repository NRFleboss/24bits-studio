import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "24bits – AI Audio Analyzer",
  description: "Analyze your music via Spotify or file – premium insights powered by AI",
  openGraph: {
    title: "24bits – AI Audio Analyzer",
    description: "Analyze your music via Spotify or file – premium insights powered by AI",
    url: "https://24bits.example.com",
    siteName: "24bits",
    images: [{ url: "https://24bits.example.com/og-image.png" }],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-black font-sans antialiased" style={{ backgroundImage: "radial-gradient(rgba(64, 64, 64, 0.075) 1px, transparent 0)", backgroundSize: "30px 30px", backgroundPosition: "-19px -19px" }}>
        {children}
      </body>
    </html>
  );
}
