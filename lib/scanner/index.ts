import crypto from "node:crypto";
import { analyzeDns, analyzeHeaders, analyzePage, analyzeRdap, analyzeTransport } from "./analyzers";
import { safeFetchPage } from "./http";
import { normalizeInputUrl } from "./network";
import { calculateConfidence, calculateScore, sortSignals, verdictFor } from "./score";
import type { AnalysisResult } from "./types";

export async function analyzeSite(input: string): Promise<AnalysisResult> {
  const startedAt = Date.now();
  const initialUrl = normalizeInputUrl(input);

  const [pageFetch, dnsAnalysis, rdapAnalysis] = await Promise.all([
    safeFetchPage(initialUrl),
    analyzeDns(initialUrl.hostname),
    analyzeRdap(initialUrl.hostname),
  ]);

  const contentType = header(pageFetch.headers["content-type"]);
  const isHtml = !contentType || /text\/html|application\/xhtml\+xml/i.test(contentType);

  const pageAnalysis = isHtml
    ? analyzePage(
        pageFetch.body,
        pageFetch.finalUrl,
        pageFetch.statusCode,
        contentType,
        pageFetch.bodyTruncated,
      )
    : {
        summary: {
          title: null,
          statusCode: pageFetch.statusCode,
          contentType,
          forms: 0,
          passwordFields: 0,
          externalFormActions: [],
          externalIframes: 0,
          externalScripts: 0,
          hasContactLink: false,
          hasPrivacyLink: false,
          hasTermsLink: false,
          hasRefundLink: false,
          bodyTruncated: pageFetch.bodyTruncated,
        },
        signals: [
          {
            id: "non-html",
            category: "content" as const,
            label: "HTML dışı içerik",
            status: "info" as const,
            impact: 0,
            evidence: contentType ?? "Bilinmeyen içerik türü",
            explanation: "İçerik HTML olmadığı için sayfa davranışı sinyallerinin bir kısmı ölçülemedi. Bu durum puanı otomatik olarak düşürmez.",
          },
        ],
      };

  const signals = sortSignals([
    ...dnsAnalysis.signals,
    ...rdapAnalysis.signals,
    ...analyzeTransport(initialUrl, pageFetch.finalUrl, pageFetch.tls, pageFetch.redirects),
    ...analyzeHeaders(pageFetch.headers, pageFetch.finalUrl.protocol === "https:", pageAnalysis.summary.forms > 0),
    ...pageAnalysis.signals,
  ]);

  const score = calculateScore(signals);
  const confidence = calculateConfidence(signals);
  const verdict = verdictFor(score, confidence);

  return {
    id: crypto.randomUUID(),
    inputUrl: input,
    normalizedUrl: initialUrl.toString(),
    finalUrl: pageFetch.finalUrl.toString(),
    hostname: pageFetch.finalUrl.hostname,
    score,
    confidence,
    verdict,
    signals,
    redirects: pageFetch.redirects,
    dns: dnsAnalysis.summary,
    tls: pageFetch.tls,
    domain: rdapAnalysis.summary,
    page: pageAnalysis.summary,
    scannedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    disclaimer:
      "GüvenilirMi teknik ve herkese açık sinyalleri analiz eder. Sonuç; işletme, satıcı veya web sitesinin güvenilirliğine garanti, sertifika ya da hukuki değerlendirme değildir.",
  };
}

function header(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value.join(", ");
  return value ?? null;
}

export { ScannerInputError, normalizeInputUrl } from "./network";
export type * from "./types";
