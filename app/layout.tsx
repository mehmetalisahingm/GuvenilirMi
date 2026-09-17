import type { Metadata } from "next";
import "./globals.css";
import "./premium-home.css";
import "./premium-home-refinements.css";

export const metadata: Metadata = {
  applicationName: "GüvenilirMi",
  title: {
    default: "GüvenilirMi — Bir siteye güvenmeden önce bak",
    template: "%s | GüvenilirMi",
  },
  description:
    "Web sitelerini AI kullanmadan; DNS, domain, TLS, yönlendirme, güvenlik başlıkları ve sayfa davranışı gibi açıklanabilir teknik sinyallerle analiz et.",
  keywords: [
    "site güvenilir mi",
    "web sitesi güvenlik kontrolü",
    "site analiz",
    "dolandırıcılık site kontrolü",
    "domain güvenlik analizi",
  ],
  category: "technology",
  creator: "GüvenilirMi",
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
