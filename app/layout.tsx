import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ISEYC | Public Intelligence for Nigeria",
  description: "What communities report. What evidence supports. What is still unknown. ISEYC is a youth-led public intelligence institution for Nigeria.",
  icons: { icon: "/iseyc-seal.svg", apple: "/iseyc-seal.svg" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#071F18" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
