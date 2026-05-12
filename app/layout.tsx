import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Musique Pour Tous - Streaming Gratuit",
  description: "Plateforme de streaming musical gratuite alimentée par Cosmic CMS",
  openGraph: {
    images: [
      {
        url: "https://imgix.cosmicjs.com/2797d440-05d5-11f0-993b-3bd041905fff-quantum.jpg",
        width: 1200,
        height: 630,
        alt: "Musique Pour Tous Preview",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white`}>
        <Providers>
          <Navigation />
          <div className="md:pl-64">
            <main className="min-h-[calc(100vh-90px)]">{children}</main>
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
