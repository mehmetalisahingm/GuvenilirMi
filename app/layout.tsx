import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GüvenilirMi — Bir siteye güvenmeden önce bak",
  description:
    "Web sitelerini AI kullanmadan, açıklanabilir teknik sinyallerle analiz eden güvenilirlik platformu.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
