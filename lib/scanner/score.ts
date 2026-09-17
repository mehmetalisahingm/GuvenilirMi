import type { AnalysisSignal, AnalysisVerdict, VerdictLevel } from "./types";

const BASE_SCORE = 58;

export function calculateScore(signals: AnalysisSignal[]): number {
  const total = signals.reduce((score, signal) => score + signal.impact, BASE_SCORE);
  return Math.max(0, Math.min(100, Math.round(total)));
}

export function calculateConfidence(signals: AnalysisSignal[]): number {
  const categories = new Set(signals.map((signal) => signal.category));
  const measured = signals.filter((signal) => signal.status !== "info").length;
  const categoryPart = (categories.size / 7) * 62;
  const measuredPart = Math.min(38, measured * 3.8);
  return Math.max(20, Math.min(100, Math.round(categoryPart + measuredPart)));
}

export function verdictFor(score: number, confidence: number): AnalysisVerdict {
  if (confidence < 45) {
    return {
      level: "insufficient",
      title: "Yeterli veri yok",
      summary: "Bu taramada kesin yorum üretmek için yeterli teknik sinyal toplanamadı. Bilinmeyen veri otomatik olarak risk kabul edilmedi.",
    };
  }

  const level: VerdictLevel = score >= 80 ? "low" : score >= 62 ? "guarded" : score >= 42 ? "mixed" : "high";

  if (level === "low") {
    return {
      level,
      title: "Düşük gözlemlenen risk",
      summary: "İncelenen teknik sinyallerin çoğu olumlu. Bu sonuç sitenin veya satıcının güvenilirliğine garanti vermez.",
    };
  }

  if (level === "guarded") {
    return {
      level,
      title: "Temkinli görünüm",
      summary: "Olumlu sinyaller baskın olsa da dikkat edilmesi gereken noktalar var. İşlem öncesinde rapordaki uyarıları kontrol et.",
    };
  }

  if (level === "mixed") {
    return {
      level,
      title: "Karışık sinyaller",
      summary: "Olumlu ve olumsuz teknik bulgular birlikte görülüyor. Özellikle kırmızı ve sarı bulgular doğrulanmadan hassas bilgi paylaşma.",
    };
  }

  return {
    level,
    title: "Yüksek gözlemlenen risk",
    summary: "Birden fazla güçlü teknik risk sinyali bulundu. Raporu incelemeden giriş, ödeme veya kişisel veri paylaşımı yapmamak daha güvenli olur.",
  };
}

export function sortSignals(signals: AnalysisSignal[]): AnalysisSignal[] {
  const order = { fail: 0, warn: 1, pass: 2, info: 3 } as const;
  return [...signals].sort((a, b) => {
    const byStatus = order[a.status] - order[b.status];
    if (byStatus !== 0) return byStatus;
    return Math.abs(b.impact) - Math.abs(a.impact);
  });
}
