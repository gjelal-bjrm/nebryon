import "./globals.css";
import type { Metadata } from "next";
import { Syne } from "next/font/google";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import WelcomeSetupLoader from "@/components/WelcomeSetupLoader";
import BirthdayBannerLoader from "@/components/BirthdayBannerLoader";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nebryon",
  description: "Hub d'outils pour simplifier le quotidien.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={syne.variable}>
      <body className={`${syne.className} min-h-screen antialiased`}>
        <BirthdayBannerLoader />
        <ConditionalNavbar />
        <WelcomeSetupLoader />
        {children}
      </body>
    </html>
  );
}
