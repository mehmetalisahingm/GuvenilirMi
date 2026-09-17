import type { Metadata } from "next";
import { Analyzer } from "@/components/analyzer";

export const metadata: Metadata = {
  title: "Site Analizi | GüvenilirMi",
  description: "Bir web sitesinin DNS, domain, TLS, yönlendirme, güvenlik başlıkları ve sayfa davranışı sinyallerini ücretsiz incele.",
  robots: {
    index: true,
    follow: true,
  },
};

type PageProps = {
  searchParams: Promise<{ url?: string | string[] }>;
};

export default async function AnalysisPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialUrl = Array.isArray(params.url) ? params.url[0] ?? "" : params.url ?? "";
  return <Analyzer initialUrl={initialUrl} />;
}
