import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ISEYC | Public Civic Information",
  description: "Public information and civic intelligence from the Initiative for Sustainable Evolution for Youth and Community.",
  icons: { icon: "/iseyc-seal.svg", apple: "/iseyc-seal.svg" },
  themeColor: "#072A20",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
