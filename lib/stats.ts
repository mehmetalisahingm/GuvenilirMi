export type SourceStat = {
  value: string;
  label: string;
  detail: string;
  sourceLabel: string;
  sourceUrl: string;
  year: string;
};

export const sourceStats: SourceStat[] = [
  {
    value: "%3,5",
    label: "bilişim suçu mağduriyeti",
    detail:
      "TÜİK'in 2025 Suç Mağduriyeti Araştırması'nda 15 yaş ve üzeri bireylerin son bir yıldaki bilişim suçu mağduriyeti yaygınlık hızı.",
    sourceLabel: "TÜİK — Türkiye Suç Mağduriyeti Araştırması",
    sourceUrl: "https://veriportali.tuik.gov.tr/tr/press/62061",
    year: "2025",
  },
  {
    value: "%2,8",
    label: "tüketici dolandırıcılığı mağduriyeti",
    detail:
      "Aynı araştırmada son bir yıldaki tüketici dolandırıcılığı mağduriyeti yaygınlık hızı.",
    sourceLabel: "TÜİK — Türkiye Suç Mağduriyeti Araştırması",
    sourceUrl: "https://veriportali.tuik.gov.tr/tr/press/62061",
    year: "2025",
  },
  {
    value: "$15,9 milyar",
    label: "bildirilen dolandırıcılık kaybı",
    detail:
      "FTC'nin 2025 için bildirdiği yaklaşık 3 milyon fraud raporundaki toplam bildirilen kayıp.",
    sourceLabel: "U.S. FTC — Consumer Sentinel / JEC testimony",
    sourceUrl:
      "https://www.ftc.gov/news-events/news/press-releases/2026/03/ftc-testifies-joint-economic-committee-agencys-efforts-combat-fraud",
    year: "2025",
  },
];
