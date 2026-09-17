"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnalysisErrorPayload, AnalysisResult, AnalysisSignal } from "@/lib/scanner";
import styles from "./analyzer.module.css";

type AnalyzerProps = {
  initialUrl?: string;
};

type Phase = "idle" | "normalizing" | "dns" | "transport" | "content" | "scoring" | "done";

const phaseLabels: Array<{ key: Phase; label: string }> = [
  { key: "normalizing", label: "Hedef doğrulanıyor" },
  { key: "dns", label: "DNS ve domain geçmişi" },
  { key: "transport", label: "TLS ve yönlendirmeler" },
  { key: "content", label: "Sayfa davranışı" },
  { key: "scoring", label: "Kanıtlar puanlanıyor" },
];

const categoryLabels: Record<AnalysisSignal["category"], string> = {
  domain: "Alan adı",
  dns: "DNS",
  transport: "Bağlantı",
  redirect: "Yönlendirme",
  headers: "Güvenlik başlıkları",
  content: "Sayfa davranışı",
  identity: "Şeffaflık",
};

export function Analyzer({ initialUrl = "" }: AnalyzerProps) {
  const [url, setUrl] = useState(initialUrl);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<AnalysisErrorPayload | null>(null);
  const [filter, setFilter] = useState<"all" | AnalysisSignal["status"]>("all");
  const [copied, setCopied] = useState(false);
  const autoStarted = useRef(false);
  const phaseTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPhaseTimer = useCallback(() => {
    if (phaseTimer.current) clearInterval(phaseTimer.current);
    phaseTimer.current = null;
  }, []);

  const runAnalysis = useCallback(
    async (target: string) => {
      const trimmed = target.trim();
      if (!trimmed) return;

      stopPhaseTimer();
      setError(null);
      setResult(null);
      setFilter("all");
      setPhase("normalizing");

      const phases: Phase[] = ["dns", "transport", "content", "scoring"];
      let phaseIndex = 0;
      phaseTimer.current = setInterval(() => {
        setPhase(phases[Math.min(phaseIndex, phases.length - 1)]);
        phaseIndex += 1;
      }, 700);

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmed }),
        });

        const payload = (await response.json()) as AnalysisResult | AnalysisErrorPayload;
        if (!response.ok || "error" in payload) {
          setError(payload as AnalysisErrorPayload);
          setPhase("idle");
          return;
        }

        setResult(payload as AnalysisResult);
        setPhase("done");
        window.history.replaceState(null, "", `/analiz?url=${encodeURIComponent(trimmed)}`);
        try {
          localStorage.setItem("guvenilirmi:last-url", trimmed);
        } catch {
          // Storage may be unavailable in privacy mode; analysis still works.
        }
      } catch {
        setError({
          error: "Tarama servisine bağlanılamadı. Bağlantını kontrol edip tekrar dene.",
          code: "INTERNAL_ERROR",
        });
        setPhase("idle");
      } finally {
        stopPhaseTimer();
      }
    },
    [stopPhaseTimer],
  );

  useEffect(() => {
    if (initialUrl && !autoStarted.current) {
      autoStarted.current = true;
      void runAnalysis(initialUrl);
    }
    return stopPhaseTimer;
  }, [initialUrl, runAnalysis, stopPhaseTimer]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runAnalysis(url);
  }

  const isLoading = phase !== "idle" && phase !== "done";
  const filteredSignals = useMemo(() => {
    if (!result) return [];
    return filter === "all" ? result.signals : result.signals.filter((signal) => signal.status === filter);
  }, [filter, result]);

  const counts = useMemo(() => {
    const source = result?.signals ?? [];
    return {
      fail: source.filter((signal) => signal.status === "fail").length,
      warn: source.filter((signal) => signal.status === "warn").length,
      pass: source.filter((signal) => signal.status === "pass").length,
      info: source.filter((signal) => signal.status === "info").length,
    };
  }, [result]);

  async function copyReport() {
    if (!result) return;
    const lines = [
      `GüvenilirMi raporu — ${result.hostname}`,
      `Skor: ${result.score}/100`,
      `Sonuç: ${result.verdict.title}`,
      `Güven düzeyi: %${result.confidence}`,
      "",
      ...result.signals.slice(0, 8).map((signal) => `${signal.status.toUpperCase()} ${signal.label}: ${signal.evidence}`),
      "",
      result.disclaimer,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <header className={styles.header}>
        <a href="/" className={styles.brand} aria-label="GüvenilirMi ana sayfa">
          <span>G</span>
          GüvenilirMi
        </a>
        <div className={styles.headerTrust}><i /> AI yok · ölçülebilir sinyaller</div>
      </header>

      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>CANLI TEKNİK ANALİZ</p>
          <h1>Siteyi gir. <em>Kanıtları gör.</em></h1>
          <p className={styles.lead}>
            DNS, domain geçmişi, TLS, yönlendirmeler, güvenlik başlıkları ve görünür sayfa davranışı tek raporda.
          </p>
        </div>

        <form className={styles.search} onSubmit={submit}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="ornek-site.com"
            aria-label="Analiz edilecek site"
            autoComplete="url"
            spellCheck={false}
          />
          <button disabled={isLoading} type="submit">
            {isLoading ? "Analiz ediliyor…" : "Güvenilir mi?"}
          </button>
        </form>

        <p className={styles.privacyNote}>Hesap gerekmez · AI kullanılmaz · Hassas form verisi gönderme</p>
      </section>

      {isLoading && <ScanningState phase={phase} />}

      {error && (
        <section className={styles.errorCard} role="alert">
          <span>!</span>
          <div>
            <strong>Bu adres analiz edilemedi.</strong>
            <p>{error.error}</p>
            <small>Hata kodu: {error.code}</small>
          </div>
        </section>
      )}

      {result && (
        <>
          <section className={`${styles.overview} ${styles[`tone_${result.verdict.level}`]}`}>
            <div className={styles.scorePanel}>
              <div className={styles.scoreRing} style={{ "--score": `${result.score * 3.6}deg` } as React.CSSProperties}>
                <div>
                  <strong>{result.score}</strong>
                  <span>/100</span>
                </div>
              </div>
              <div>
                <p className={styles.resultEyebrow}>GÖZLEMLENEN TEKNİK RİSK</p>
                <h2>{result.verdict.title}</h2>
                <p>{result.verdict.summary}</p>
              </div>
            </div>

            <div className={styles.metaPanel}>
              <div><span>Analiz edilen</span><strong>{result.hostname}</strong></div>
              <div><span>Kanıt güveni</span><strong>%{result.confidence}</strong></div>
              <div><span>Süre</span><strong>{formatDuration(result.durationMs)}</strong></div>
              <div><span>Yönlendirme</span><strong>{result.redirects.length}</strong></div>
              <button onClick={copyReport} type="button">{copied ? "Kopyalandı ✓" : "Raporu kopyala"}</button>
            </div>
          </section>

          <section className={styles.signalSection}>
            <div className={styles.sectionTitle}>
              <div>
                <p className={styles.kicker}>SKORUN İÇİ</p>
                <h2>Sonucu oluşturan sinyaller</h2>
              </div>
              <div className={styles.filters} aria-label="Sinyal filtreleri">
                <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label={`Tümü ${result.signals.length}`} />
                <FilterButton active={filter === "fail"} onClick={() => setFilter("fail")} label={`Kritik ${counts.fail}`} tone="fail" />
                <FilterButton active={filter === "warn"} onClick={() => setFilter("warn")} label={`Uyarı ${counts.warn}`} tone="warn" />
                <FilterButton active={filter === "pass"} onClick={() => setFilter("pass")} label={`Olumlu ${counts.pass}`} tone="pass" />
              </div>
            </div>

            <div className={styles.signalList}>
              {filteredSignals.map((signal) => (
                <article className={`${styles.signal} ${styles[`status_${signal.status}`]}`} key={`${signal.id}-${signal.evidence}`}>
                  <div className={styles.signalStatus}>{signal.status === "pass" ? "✓" : signal.status === "fail" ? "×" : signal.status === "warn" ? "!" : "i"}</div>
                  <div className={styles.signalBody}>
                    <div className={styles.signalTop}>
                      <span>{categoryLabels[signal.category]}</span>
                      <b className={signal.impact > 0 ? styles.positive : signal.impact < 0 ? styles.negative : ""}>
                        {signal.impact > 0 ? `+${signal.impact}` : signal.impact === 0 ? "0" : signal.impact} puan
                      </b>
                    </div>
                    <h3>{signal.label}</h3>
                    <strong>{signal.evidence}</strong>
                    <p>{signal.explanation}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.technicalGrid}>
            <DetailCard title="Domain">
              <DetailRow label="Kayıt tarihi" value={formatDate(result.domain.registrationDate)} />
              <DetailRow label="Domain yaşı" value={result.domain.ageDays === null ? "Bilinmiyor" : `${result.domain.ageDays} gün`} />
              <DetailRow label="DNSSEC" value={result.domain.dnssec === null ? "Bilinmiyor" : result.domain.dnssec ? "İmzalı" : "İmzasız"} />
            </DetailCard>
            <DetailCard title="Bağlantı">
              <DetailRow label="HTTPS / TLS" value={result.tls.used ? result.tls.protocol ?? "TLS" : "HTTP"} />
              <DetailRow label="Sertifika" value={result.tls.authorized === null ? "Yok" : result.tls.authorized ? "Doğrulandı" : "Doğrulanamadı"} />
              <DetailRow label="Sona kalan" value={result.tls.daysRemaining === null ? "Bilinmiyor" : `${result.tls.daysRemaining} gün`} />
            </DetailCard>
            <DetailCard title="Sayfa">
              <DetailRow label="HTTP durum" value={String(result.page.statusCode)} />
              <DetailRow label="Form" value={String(result.page.forms)} />
              <DetailRow label="Harici script" value={String(result.page.externalScripts)} />
            </DetailCard>
            <DetailCard title="DNS">
              <DetailRow label="Public IP" value={String(result.dns.addresses.length)} />
              <DetailRow label="Nameserver" value={String(result.dns.nameservers.length)} />
              <DetailRow label="MX" value={String(result.dns.mxCount)} />
            </DetailCard>
          </section>

          {result.redirects.length > 0 && (
            <section className={styles.redirects}>
              <p className={styles.kicker}>YÖNLENDİRME ZİNCİRİ</p>
              <h2>Tarayıcı nereye götürülüyor?</h2>
              <div>
                {result.redirects.map((hop, index) => (
                  <article key={`${hop.url}-${index}`}>
                    <span>{index + 1}</span>
                    <code>{hop.url}</code>
                    <b>HTTP {hop.status}</b>
                    <i>→</i>
                    <code>{hop.location}</code>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className={styles.disclaimer}>
            <span>i</span>
            <div>
              <strong>Bu bir “güvenli site sertifikası” değildir.</strong>
              <p>{result.disclaimer}</p>
            </div>
          </section>
        </>
      )}

      {!result && !isLoading && !error && (
        <section className={styles.emptyState}>
          <div className={styles.radar} aria-hidden="true"><i /><i /><span /></div>
          <div>
            <h2>Bir URL yaz ve gerçek taramayı başlat.</h2>
            <p>Sunucu yalnızca herkese açık web katmanını okur; exploit, brute force veya oturum açma işlemi yapmaz.</p>
          </div>
        </section>
      )}
    </main>
  );
}

function ScanningState({ phase }: { phase: Phase }) {
  const activeIndex = phaseLabels.findIndex((item) => item.key === phase);
  return (
    <section className={styles.scanning} aria-live="polite">
      <div className={styles.scanVisual}><span /><i /></div>
      <div>
        <p className={styles.kicker}>TARAMA DEVAM EDİYOR</p>
        <h2>{activeIndex >= 0 ? phaseLabels[activeIndex].label : "Analiz hazırlanıyor"}</h2>
        <div className={styles.phaseList}>
          {phaseLabels.map((item, index) => (
            <div className={index <= activeIndex ? styles.phaseDone : ""} key={item.key}>
              <span>{index < activeIndex ? "✓" : index === activeIndex ? "•" : ""}</span>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FilterButton({ active, onClick, label, tone }: { active: boolean; onClick: () => void; label: string; tone?: string }) {
  return <button className={`${active ? styles.filterActive : ""} ${tone ? styles[`filter_${tone}`] : ""}`} onClick={onClick} type="button">{label}</button>;
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <article className={styles.detailCard}><h3>{title}</h3><div>{children}</div></article>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <p><span>{label}</span><strong>{value}</strong></p>;
}

function formatDate(value: string | null): string {
  if (!value) return "Bilinmiyor";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Bilinmiyor";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatDuration(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} sn` : `${ms} ms`;
}
