"use client";

import type { CSSProperties } from "react";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sourceStats } from "@/lib/stats";
import { TrustPlayground } from "@/components/trust-playground";

const LAPTOP_PHOTO =
  "https://images.unsplash.com/photo-1644792863360-40fa85ea52e7?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=88&w=3000";

const chapters = [
  {
    id: "01",
    label: "İLK KONTROL",
    title: "Bir siteye güvenmeden önce, kanıtına bak.",
    body: "URL'yi gir. Teknik sinyalleri gör. Skorun neden oluştuğunu adım adım incele.",
  },
  {
    id: "02",
    label: "EKRANIN İÇİ",
    title: "Tarayıcı artık pencere değil.",
    body: "Ekran bütün sahneyi kaplar; URL teknik parçalara ayrılır.",
  },
  {
    id: "03",
    label: "AĞ MOTORU",
    title: "DNS. TLS. HTTP. RDAP.",
    body: "Bağlantının arkasındaki bağımsız sinyaller tek tek görünür olur.",
  },
  {
    id: "04",
    label: "RİSK AĞI",
    title: "Şüpheli ilişkiyi izle.",
    body: "Harici form, yeni domain ve yönlendirme zinciri birbirine bağlanır.",
  },
  {
    id: "05",
    label: "KANIT ODASI",
    title: "23 neden 23?",
    body: "Skoru tek bir rozet değil, açıklanabilir kanıtların toplamı oluşturur.",
  },
  {
    id: "06",
    label: "CANLI ANALİZ",
    title: "Şimdi gerçek siteyi tara.",
    body: "AI tahmini yok. Ölçülebilir teknik sinyaller var.",
  },
] as const;

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function phase(value: number, start: number, end: number) {
  return clamp((value - start) / Math.max(end - start, 0.001));
}

const nodes = [
  { label: "DNS", x: 13, y: 32, tone: "good" },
  { label: "TLS", x: 31, y: 18, tone: "good" },
  { label: "HTTP", x: 47, y: 47, tone: "info" },
  { label: "RDAP", x: 67, y: 24, tone: "warn" },
  { label: "FORM", x: 77, y: 66, tone: "bad" },
  { label: "REDIRECT", x: 43, y: 77, tone: "bad" },
] as const;

export function RealLaptopHome() {
  const storyRef = useRef<HTMLElement>(null);
  const [chapter, setChapter] = useState(0);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const update = () => {
      const story = storyRef.current;
      if (!story) return;

      const rect = story.getBoundingClientRect();
      const travel = Math.max(rect.height - window.innerHeight, 1);
      const progress = clamp(-rect.top / travel);
      const entry = phase(progress, 0.025, 0.20);
      const browser = phase(progress, 0.15, 0.34);
      const network = phase(progress, 0.31, 0.50);
      const risk = phase(progress, 0.48, 0.66);
      const evidence = phase(progress, 0.64, 0.81);
      const final = phase(progress, 0.80, 0.96);

      story.style.setProperty("--p", String(progress));
      story.style.setProperty("--entry", String(entry));
      story.style.setProperty("--browser", String(browser));
      story.style.setProperty("--network", String(network));
      story.style.setProperty("--risk", String(risk));
      story.style.setProperty("--evidence", String(evidence));
      story.style.setProperty("--final", String(final));

      const next = Math.min(chapters.length - 1, Math.floor(progress * chapters.length));
      setChapter((current) => (current === next ? current : next));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = url.trim();
    if (!target) return;
    window.location.assign(`/analiz?url=${encodeURIComponent(target)}`);
  }

  const current = chapters[chapter];

  return (
    <main className="rl-page">
      <section ref={storyRef} className="rl-story">
        <div className="rl-sticky">
          <header className="rl-nav">
            <Link href="/" className="rl-brand">
              <span>✓</span> GüvenilirMi
            </Link>
            <span className="rl-nav-center">EXPLAINABLE TRUST ENGINE</span>
            <Link href="/analiz" className="rl-nav-cta">Site tara</Link>
          </header>

          <div className="rl-photo-stage" aria-hidden="true">
            <div
              className="rl-photo"
              style={{ "--photo": `url(${LAPTOP_PHOTO})` } as CSSProperties}
            />
            <div className="rl-photo-shade" />

            <div className="rl-hero-demo">
              <div className="rl-hero-demo-bar">
                <div className="rl-hero-dots"><i /><i /><i /></div>
                <div className="rl-hero-address"><span>⌕</span> guvenilirmi.com</div>
                <div className="rl-hero-live"><i /> CANLI</div>
              </div>
              <div className="rl-hero-demo-body">
                <div className="rl-hero-demo-glow" />
                <div className="rl-hero-score">
                  <small>TEKNİK GÜVEN SKORU</small>
                  <strong>94</strong>
                  <span>DÜŞÜK GÖZLEMLENEN RİSK</span>
                </div>
                <div className="rl-hero-signal-grid">
                  <div><span>TLS</span><b>Doğrulandı</b><em>+8</em></div>
                  <div><span>HEADERS</span><b>Güçlü</b><em>+7</em></div>
                  <div><span>REDIRECT</span><b>Temiz</b><em>+5</em></div>
                </div>
                <div className="rl-hero-demo-foot">
                  <span>DNS · TLS · HTTP · RDAP · HTML</span>
                  <b>AI YOK · AÇIKLANABİLİR SKOR</b>
                </div>
              </div>
            </div>

            <div className="rl-photo-label">
              <i /> ÖLÇÜLEBİLİR SİNYALLER / AÇIKLANABİLİR SONUÇ
            </div>
          </div>

          <div className="rl-browser-world" aria-hidden="true">
            <div className="rl-browser-shell">
              <div className="rl-browser-top">
                <div className="rl-dots"><i /><i /><i /></div>
                <div className="rl-address"><span>⌕</span> guvenilirmi.com</div>
                <div className="rl-secure-pill">TLS VALID</div>
              </div>
              <div className="rl-scan-screen">
                <div className="rl-scan-grid" />
                <div className="rl-scan-beam" />
                <div className="rl-score-copy">
                  <small>CANLI TEKNİK TARAMA</small>
                  <strong>94</strong>
                  <span>DÜŞÜK GÖZLEMLENEN RİSK</span>
                </div>
                <div className="rl-scan-rows">
                  <div><b>TLS</b><span>Doğrulandı</span><em>+8</em></div>
                  <div><b>HEADERS</b><span>Güçlü</span><em>+7</em></div>
                  <div><b>REDIRECT</b><span>Temiz</span><em>+5</em></div>
                </div>
              </div>
            </div>
          </div>

          <div className="rl-network-world" aria-hidden="true">
            <div className="rl-network-core"><span>URL</span><strong>SCAN</strong></div>
            <svg className="rl-network-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M50 50 C39 38 26 35 13 32" />
              <path d="M50 50 C42 28 35 20 31 18" />
              <path d="M50 50 C61 36 64 29 67 24" />
              <path className="danger" d="M50 50 C61 53 69 60 77 66" />
              <path className="danger" d="M50 50 C49 61 46 70 43 77" />
              <path className="danger" d="M67 24 C72 39 75 52 77 66" />
            </svg>
            {nodes.map((node) => (
              <div
                className={`rl-node rl-node-${node.tone}`}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                key={node.label}
              >
                <i />
                <b>{node.label}</b>
                <span>{node.tone === "bad" ? "risk" : node.tone === "warn" ? "watch" : "verified"}</span>
              </div>
            ))}
            <div className="rl-packet rl-packet-a" />
            <div className="rl-packet rl-packet-b" />
            <div className="rl-packet rl-packet-c" />
          </div>

          <div className="rl-risk-world" aria-hidden="true">
            <div className="rl-risk-glow" />
            <div className="rl-risk-title"><small>CROSS-ORIGIN BEHAVIOUR</small><strong>3 risk signals connected.</strong></div>
            <div className="rl-risk-card rl-risk-card-a"><span>DOMAIN AGE</span><b>7 gün</b><em>-18</em></div>
            <div className="rl-risk-card rl-risk-card-b"><span>FORM TARGET</span><b>external origin</b><em>-22</em></div>
            <div className="rl-risk-card rl-risk-card-c"><span>REDIRECT</span><b>3 hostnames</b><em>-11</em></div>
          </div>

          <div className="rl-evidence-world" aria-hidden="true">
            <div className="rl-evidence-ring"><i /><i /><i /><i /><strong>23</strong><span>/100</span></div>
            <div className="rl-evidence-list">
              <small>EXPLAINABLE SCORE</small>
              <div><span>Domain yaşı</span><b>-18</b></div>
              <div><span>Harici form hedefi</span><b>-22</b></div>
              <div><span>TLS zinciri</span><b className="good">+8</b></div>
              <div><span>Bilinmeyen veri</span><b className="neutral">0</b></div>
              <p>Eksik veri otomatik olarak risk sayılmaz.</p>
            </div>
          </div>

          <form className="rl-final-search" onSubmit={submit}>
            <label>Gerçek bir siteyi teknik sinyallerle tara</label>
            <div>
              <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="ornek.com" inputMode="url" />
              <button type="submit">Analiz et</button>
            </div>
            <small>AI / LLM YOK · ÜCRETLİ MODEL API'Sİ YOK</small>
          </form>

          <div className={`rl-copy rl-copy-${chapter}`} key={current.id}>
            <div className="rl-kicker"><b>{current.id}</b><i />{current.label}</div>
            <h1>{current.title}</h1>
            <p>{current.body}</p>
          </div>

          <div className="rl-progress"><i /></div>
          <div className="rl-scroll-cue"><span>↓</span> İÇERİ GİR</div>
        </div>
      </section>

      <section className="rl-proof">
        <div className="rl-proof-head">
          <p>GERÇEK PROBLEM / KAYNAKLI VERİ</p>
          <h2>Güven hissi yetmez.<br />Kanıt gerekir.</h2>
        </div>
        <div className="rl-proof-grid">
          {sourceStats.map((stat) => (
            <a href={stat.sourceUrl} target="_blank" rel="noreferrer" key={stat.label}>
              <small>{stat.year} · {stat.sourceLabel}</small>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
              <p>{stat.detail}</p>
            </a>
          ))}
        </div>
      </section>

      <TrustPlayground />

      <section className="rl-end">
        <p>GÜVENİRLİMİ / CANLI ANALİZ</p>
        <h2>Bir siteye güvenmeden<br />önce içine bak.</h2>
        <Link href="/analiz">Analize başla →</Link>
      </section>
    </main>
  );
}
