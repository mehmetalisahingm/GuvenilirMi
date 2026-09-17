"use client";

import { FormEvent, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { sourceStats } from "@/lib/stats";

type DemoStage = {
  eyebrow: string;
  domain: string;
  score: number;
  verdict: string;
  tone: "safe" | "danger" | "deep";
  summary: string;
  signals: Array<{
    label: string;
    value: string;
    state: "pass" | "warn" | "fail";
  }>;
};

const demoStages: DemoStage[] = [
  {
    eyebrow: "DEMO 01 · DÜŞÜK GÖZLEMLENEN RİSK",
    domain: "guvenilirmi.com",
    score: 94,
    verdict: "Sinyaller temiz görünüyor",
    tone: "safe",
    summary:
      "Bu ekran ürün davranışını göstermek için hazırlanmış sentetik bir demodur; gerçek tarama sonucu değildir.",
    signals: [
      { label: "HTTPS / TLS", value: "Geçerli", state: "pass" },
      { label: "Redirect zinciri", value: "Temiz", state: "pass" },
      { label: "Güvenlik başlıkları", value: "Güçlü", state: "pass" },
      { label: "Form hedefleri", value: "Aynı domain", state: "pass" },
    ],
  },
  {
    eyebrow: "DEMO 02 · YÜKSEK GÖZLEMLENEN RİSK",
    domain: "kampanya-firsat.example",
    score: 23,
    verdict: "Birden fazla risk sinyali var",
    tone: "danger",
    summary:
      ".example uzantısı yalnızca demo amacıyla kullanılır. Buradaki risk bulguları sentetiktir ve gerçek bir işletme hakkında iddia değildir.",
    signals: [
      { label: "Domain yaşı", value: "7 gün", state: "warn" },
      { label: "Ödeme formu", value: "Harici hedef", state: "fail" },
      { label: "CSP", value: "Bulunamadı", state: "warn" },
      { label: "Redirect zinciri", value: "3 domain", state: "fail" },
    ],
  },
  {
    eyebrow: "DEMO 03 · SKORUN İÇİNE BAK",
    domain: "kampanya-firsat.example",
    score: 23,
    verdict: "Skor değil, kanıt önemli",
    tone: "deep",
    summary:
      "GüvenilirMi tek bir kırmızı sayı bırakmaz. Her sinyalin ne olduğunu, puanı nasıl etkilediğini ve hangi noktada belirsizlik bulunduğunu açıklar.",
    signals: [
      { label: "Domain sinyali", value: "−18 puan", state: "warn" },
      { label: "Form davranışı", value: "−22 puan", state: "fail" },
      { label: "TLS", value: "+8 puan", state: "pass" },
      { label: "Belirsiz veri", value: "Ceza yok", state: "pass" },
    ],
  },
];

const principles = [
  ["01", "Alan adı", "DNS, RDAP ve hostname yapısı tek başına karar vermez; bağlam üretir."],
  ["02", "Bağlantı", "TLS, HTTPS zorlaması ve redirect zinciri teknik güven sinyalleridir."],
  ["03", "Sayfa davranışı", "Formlar, hedef domainler, iframe ve script ilişkileri kontrollü biçimde incelenir."],
  ["04", "Açıklanabilir skor", "Her artı ve eksi puanın kullanıcıya gösterilebilir bir nedeni vardır."],
];

export function InteractiveStory() {
  const storyRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [url, setUrl] = useState("");
  const { scrollYProgress } = useScroll({
    target: storyRef,
    offset: ["start start", "end end"],
  });

  const laptopScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 0.94]);
  const laptopRotate = useTransform(scrollYProgress, [0, 0.5, 1], [7, 0, -4]);
  const railProgress = useTransform(scrollYProgress, [0, 1], [0, 100]);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = value < 0.34 ? 0 : value < 0.68 ? 1 : 2;
    setStage((current) => (current === next ? current : next));
  });

  const current = demoStages[stage];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    document.getElementById("urun-demosu")?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="GüvenilirMi ana sayfa">
          <span className="brand-mark">G</span>
          <span>GüvenilirMi</span>
        </a>
        <div className="topbar-meta">
          <span className="live-dot" />
          AI yok · açıklanabilir sinyaller
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <motion.div
          className="hero-orb hero-orb-a"
          animate={prefersReducedMotion ? undefined : { x: [0, 30, -12, 0], y: [0, -18, 16, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="hero-orb hero-orb-b"
          animate={prefersReducedMotion ? undefined : { x: [0, -24, 18, 0], y: [0, 28, -12, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="hero-copy">
          <div className="kicker"><span /> Tıklamadan önce kontrol et</div>
          <h1>
            Bir site gerçekten
            <span className="hero-accent"> güvenilir mi?</span>
          </h1>
          <p>
            Alan adı, bağlantı, yönlendirme ve sayfa davranışlarını ölçülebilir teknik sinyallerle inceleyen bağımsız bir güven katmanı.
          </p>

          <form className="url-box" onSubmit={handleSubmit}>
            <div className="url-prefix">https://</div>
            <input
              aria-label="Kontrol edilecek web sitesi"
              placeholder="ornek-site.com"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              inputMode="url"
            />
            <button type="submit">Deneyimi gör <span>↗</span></button>
          </form>
          <div className="hero-note">
            <span className="shield-mini">✓</span>
            İlk prototipte yukarıdaki alan ürün demosuna götürür. Gerçek tarama motoru P2 aşamasında bağlanacak.
          </div>
        </div>

        <div className="hero-bottomline">
          <span>Scroll ile ürünün içine gir</span>
          <span className="scroll-line"><i /></span>
        </div>
      </section>

      <section className="story" ref={storyRef} id="urun-demosu">
        <div className="story-sticky">
          <div className="story-copy">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.eyebrow}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
              >
                <div className={`stage-index tone-${current.tone}`}>0{stage + 1}</div>
                <p className="stage-eyebrow">{current.eyebrow}</p>
                <h2>
                  {stage === 0 && <>Önce yüzeye bak.</>}
                  {stage === 1 && <>Sonra davranışı sorgula.</>}
                  {stage === 2 && <>En son kanıtı aç.</>}
                </h2>
                <p>{current.summary}</p>
              </motion.div>
            </AnimatePresence>

            <div className="story-steps" aria-label="Demo aşamaları">
              {demoStages.map((item, index) => (
                <div className={index === stage ? "story-step active" : "story-step"} key={item.eyebrow}>
                  <span>{index + 1}</span>
                  <i />
                </div>
              ))}
            </div>
          </div>

          <motion.div
            className="laptop-wrap"
            style={prefersReducedMotion ? undefined : { scale: laptopScale, rotateX: laptopRotate }}
          >
            <div className={`ambient-glow tone-${current.tone}`} />
            <div className="laptop">
              <div className="camera-dot" />
              <div className={`laptop-screen tone-${current.tone}`}>
                <div className="browser-bar">
                  <div className="traffic-lights"><span /><span /><span /></div>
                  <div className="browser-address">{current.domain}</div>
                  <div className="browser-lock">⌁</div>
                </div>

                <div className="scan-ui">
                  <div className="scan-head">
                    <div>
                      <span className="scan-demo-label">ETKİLEŞİMLİ DEMO</span>
                      <h3>{current.domain}</h3>
                    </div>
                    <div className={`score-ring tone-${current.tone}`}>
                      <strong>{current.score}</strong>
                      <span>/100</span>
                    </div>
                  </div>

                  <div className="verdict-row">
                    <span className={`verdict-dot tone-${current.tone}`} />
                    <b>{current.verdict}</b>
                  </div>

                  <div className="signal-grid">
                    {current.signals.map((signal) => (
                      <motion.div
                        layout
                        className={`signal-card state-${signal.state}`}
                        key={`${current.domain}-${signal.label}-${signal.value}`}
                      >
                        <span className="signal-icon">
                          {signal.state === "pass" ? "✓" : signal.state === "warn" ? "!" : "×"}
                        </span>
                        <div>
                          <small>{signal.label}</small>
                          <strong>{signal.value}</strong>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="scan-footer">
                    <span>DNS</span><i />
                    <span>TLS</span><i />
                    <span>HTTP</span><i />
                    <span>HTML</span>
                  </div>
                  {!prefersReducedMotion && <div className="scanner-line" aria-hidden="true" />}
                </div>
              </div>
              <div className="laptop-chin"><span>GüvenilirMi</span></div>
            </div>
            <div className="laptop-base"><span /></div>
          </motion.div>

          <div className="progress-rail" aria-hidden="true">
            <motion.i style={{ height: railProgress }} />
          </div>
        </div>
      </section>

      <section className="proof-section">
        <div className="section-heading">
          <p className="kicker"><span /> Bir skor yetmez</p>
          <h2>Güven, tek bir rozetten daha derin.</h2>
          <p>
            “HTTPS var” demek güvenilir demek değildir. GüvenilirMi farklı teknik katmanları ayrı ayrı gösterir ve hiçbir bilinmeyen veriyi otomatik suçlama olarak kullanmaz.
          </p>
        </div>

        <div className="principle-grid">
          {principles.map(([index, title, copy]) => (
            <motion.article
              className="principle-card"
              key={index}
              whileHover={prefersReducedMotion ? undefined : { y: -8 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
              <span>{index}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
              <div className="card-corner">↗</div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="data-section">
        <div className="data-intro">
          <p className="kicker"><span /> Problem gerçek</p>
          <h2>Rakamlar korkutmak için değil, bağlam vermek için burada.</h2>
          <p>
            Sahte sayaç yok. Her veri, yılı ve kaynağıyla birlikte gösterilir. Ürün güven istiyorsa önce kendi iddiaları denetlenebilir olmalı.
          </p>
        </div>

        <div className="stat-stack">
          {sourceStats.map((stat, index) => (
            <motion.a
              className="stat-card"
              href={stat.sourceUrl}
              target="_blank"
              rel="noreferrer"
              key={`${stat.value}-${stat.label}`}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12%" }}
              transition={{ duration: 0.55, delay: index * 0.08 }}
            >
              <div className="stat-topline"><span>{stat.year}</span><span>Kaynağı aç ↗</span></div>
              <strong>{stat.value}</strong>
              <h3>{stat.label}</h3>
              <p>{stat.detail}</p>
              <small>{stat.sourceLabel}</small>
            </motion.a>
          ))}
        </div>
      </section>

      <section className="engine-section">
        <div className="engine-orbit" aria-hidden="true">
          <span className="orbit-core">URL</span>
          <span className="orbit-node node-a">DNS</span>
          <span className="orbit-node node-b">TLS</span>
          <span className="orbit-node node-c">HTTP</span>
          <span className="orbit-node node-d">HTML</span>
          <span className="orbit-node node-e">RDAP</span>
        </div>
        <div className="engine-copy">
          <p className="kicker"><span /> Motorun içinde</p>
          <h2>Model tahmini yok. Kurallar var.</h2>
          <p>
            Tarama motoru siteyi kontrollü biçimde ziyaret edecek, ölçülebilir sinyalleri çıkaracak ve aynı veriye aynı puanı verecek. Sonuç değişirse nedeni de değişmiş olacaktır.
          </p>
          <div className="engine-list">
            <span><b>01</b> URL güvenlik doğrulaması</span>
            <span><b>02</b> DNS ve IP kontrolleri</span>
            <span><b>03</b> TLS / redirect analizi</span>
            <span><b>04</b> Sayfa sinyalleri</span>
            <span><b>05</b> Açıklanabilir skor</span>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="final-orbit" aria-hidden="true" />
        <p className="kicker"><span /> Güvenmeden önce doğrula</p>
        <h2>Kontrol etmeden<br />tıklama.</h2>
        <button onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" })}>
          URL alanına dön <span>↑</span>
        </button>
      </section>

      <footer>
        <a className="brand" href="#top"><span className="brand-mark">G</span><span>GüvenilirMi</span></a>
        <p>AI tahmini değil. Ölçülebilir sinyaller.</p>
        <span>Prototype · 2026</span>
      </footer>
    </main>
  );
}
