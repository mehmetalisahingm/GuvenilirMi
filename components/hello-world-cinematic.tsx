"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { sourceStats } from "@/lib/stats";

const stages = [
  {
    index: "01",
    label: "YÜZEY",
    title: "Önce yalnızca bir ekran görürsün.",
    copy: "Bir site temiz görünebilir. Görüntü kanıt değildir; teknik izin içine girelim.",
    tone: "green",
  },
  {
    index: "02",
    label: "TARAYICI",
    title: "Ekran artık bir pencere değil.",
    copy: "Kamera MacBook'un içine yaklaşır. URL, bağlantı ve tarayıcı davranışı bütün sahneyi ele geçirir.",
    tone: "green",
  },
  {
    index: "03",
    label: "AĞ MOTORU",
    title: "DNS. TLS. HTTP. RDAP.",
    copy: "Tek bir rozet yerine bağımsız sinyaller. Her katman ölçülür ve ayrı kanıt üretir.",
    tone: "cyan",
  },
  {
    index: "04",
    label: "RİSK AĞI",
    title: "Şüpheli ilişkiler görünür olur.",
    copy: "Yeni domain, harici form hedefi ve yönlendirme zinciri birbirine bağlandığında risk bağlam kazanır.",
    tone: "red",
  },
  {
    index: "05",
    label: "KANIT ODASI",
    title: "23 neden 23?",
    copy: "Sonuç bir tahmin değil. Puanın hangi ölçülebilir sinyallerden oluştuğunu tek tek aç.",
    tone: "amber",
  },
  {
    index: "06",
    label: "CANLI ANALİZ",
    title: "Şimdi gerçek siteyi tara.",
    copy: "AI yok. Ücretli model yok. Deterministik kurallar ve açıklanabilir teknik sinyaller var.",
    tone: "green",
  },
] as const;

const engineNodes = [
  ["DNS", "PUBLIC IP"],
  ["TLS", "VALID"],
  ["HTTP", "200"],
  ["RDAP", "1248 D"],
  ["HEADERS", "6 / 7"],
  ["HTML", "SCAN"],
] as const;

function goToAnalysis(value: string) {
  const target = value.trim();
  if (!target) return;
  window.location.assign(`/analiz?url=${encodeURIComponent(target)}`);
}

function Keyboard() {
  return (
    <div className="hw-keyboard" aria-hidden="true">
      {Array.from({ length: 62 }).map((_, index) => (
        <i className={index > 51 && index < 57 ? "wide" : ""} key={index} />
      ))}
    </div>
  );
}

function MacBook({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "hw-mac hw-mac-compact" : "hw-mac"} aria-hidden="true">
      <div className="hw-screen-lid">
        <div className="hw-camera"><i /></div>
        <div className="hw-glass">
          <div className="hw-terminal-top">
            <div className="hw-lights"><i /><i /><i /></div>
            <span>trust-shell — zsh</span>
            <b>● secure session</b>
          </div>
          <div className="hw-terminal">
            <div className="hw-code-meta">GÜVENİRLİMİ / TRUST ENGINE</div>
            <div className="hw-command"><span>~</span> $ inspect --url guvenilirmi.com</div>
            <div className="hw-boot-seq">
              <div className="hw-bootline"><i /> booting deterministic engine</div>
              <div className="hw-bootline"><i /> dns resolver ............. ready</div>
              <div className="hw-bootline"><i /> tls verifier .............. ready</div>
              <div className="hw-bootline"><i /> http probe ................ ready</div>
            </div>
            <div className="hw-hello">hello, world<span className="hw-cursor">_</span></div>
            <div className="hw-terminal-status">
              <span><i /> DNS ready</span>
              <span><i /> TLS verified</span>
              <span><i /> HTTP reachable</span>
              <span><i /> headers parsing</span>
            </div>
          </div>
          <div className="hw-screen-reflection" />
        </div>
      </div>
      <div className="hw-hinge"><i /><i /></div>
      <div className="hw-deck">
        <Keyboard />
        <div className="hw-trackpad" />
      </div>
      <div className="hw-front-edge"><i /></div>
    </div>
  );
}

export function HelloWorldCinematic() {
  const storyRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [heroUrl, setHeroUrl] = useState("");
  const [finalUrl, setFinalUrl] = useState("");

  const { scrollYProgress } = useScroll({
    target: storyRef,
    offset: ["start start", "end end"],
  });

  const macScale = useTransform(scrollYProgress, [0, 0.10, 0.20, 0.31], [0.92, 1.04, 1.43, 2.18]);
  const macY = useTransform(scrollYProgress, [0, 0.18, 0.31], [30, -6, -82]);
  const macOpacity = useTransform(scrollYProgress, [0, 0.23, 0.35], [1, 1, 0]);
  const browserScale = useTransform(scrollYProgress, [0.13, 0.27, 0.42], [0.74, 1, 1.34]);
  const browserOpacity = useTransform(scrollYProgress, [0.13, 0.24, 0.40, 0.49], [0, 1, 1, 0]);
  const engineScale = useTransform(scrollYProgress, [0.32, 0.49, 0.63], [0.72, 1, 1.3]);
  const engineOpacity = useTransform(scrollYProgress, [0.30, 0.40, 0.57, 0.66], [0, 1, 1, 0]);
  const riskOpacity = useTransform(scrollYProgress, [0.54, 0.63, 0.75, 0.81], [0, 1, 1, 0]);
  const evidenceOpacity = useTransform(scrollYProgress, [0.72, 0.80, 0.91], [0, 1, 1]);
  const evidenceScale = useTransform(scrollYProgress, [0.72, 0.84, 0.96], [0.78, 1, 1.08]);
  const progress = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = Math.min(stages.length - 1, Math.floor(value * stages.length));
    setStage((current) => (current === next ? current : next));
  });

  function submitHero(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    goToAnalysis(heroUrl);
  }

  function submitFinal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    goToAnalysis(finalUrl);
  }

  const current = stages[stage];

  return (
    <main className="hw-page">
      <div className="hw-grain" aria-hidden="true" />
      <header className="hw-nav">
        <Link href="/" className="hw-brand"><span>✓</span><b>GüvenilirMi</b></Link>
        <div className="hw-nav-meta"><i /> EXPLAINABLE TRUST ENGINE</div>
        <Link href="/analiz" className="hw-nav-cta">Site tara <span>↗</span></Link>
      </header>

      <section className="hw-hero" id="top">
        <div className="hw-hero-grid" aria-hidden="true" />
        <div className="hw-hero-copy">
          <p className="hw-kicker"><i /> URL'DEN DAHA DERİNE</p>
          <h1>Bir siteye<br />güvenmeden<br /><em>önce içine bak.</em></h1>
          <p className="hw-lead">Yüzeyde temiz görünen bir site güvenli olmayabilir. DNS'ten TLS'e, yönlendirmeden form davranışına kadar teknik izi aç; skoru değil, kanıtı gör.</p>
          <form className="hw-search" onSubmit={submitHero}>
            <span>https://</span>
            <input value={heroUrl} onChange={(event) => setHeroUrl(event.target.value)} placeholder="ornek-site.com" inputMode="url" />
            <button type="submit">Analiz et <b>↗</b></button>
          </form>
          <div className="hw-micro"><span>AI YOK</span><i /><span>API KEY YOK</span><i /><span>AÇIKLANABİLİR SKOR</span></div>
        </div>

        <motion.div
          className="hw-hero-device"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 44, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="hw-halo" />
          <div className="hw-orbit hw-orbit-a" />
          <div className="hw-orbit hw-orbit-b" />
          <motion.div className="hw-float hw-float-a" animate={prefersReducedMotion ? undefined : { y: [0, -10, 0] }} transition={{ duration: 5.4, repeat: Infinity, ease: "easeInOut" }}><small>TLS</small><strong>VALID</strong><span>+8 signal</span></motion.div>
          <motion.div className="hw-float hw-float-b" animate={prefersReducedMotion ? undefined : { y: [0, 9, 0] }} transition={{ duration: 6.3, repeat: Infinity, ease: "easeInOut" }}><small>DOMAIN</small><strong>1248 DAYS</strong><span>stable history</span></motion.div>
          <MacBook />
        </motion.div>

        <a className="hw-scroll" href="#derinlik"><span>↓</span> SCROLL / İÇERİ GİR</a>
      </section>

      <section className="hw-depth" id="derinlik" ref={storyRef}>
        <div className={`hw-sticky hw-tone-${current.tone}`}>
          <div className="hw-depth-grid" />
          <div className="hw-depth-light" />
          <motion.div className="hw-progress" style={{ width: progress }} />

          <aside className="hw-story-copy">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.index}
                initial={prefersReducedMotion ? false : { opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, x: 18 }}
                transition={{ duration: 0.36 }}
              >
                <div className="hw-stage-label"><b>{current.index}</b><i />{current.label}</div>
                <h2>{current.title}</h2>
                <p>{current.copy}</p>
              </motion.div>
            </AnimatePresence>
            <div className="hw-dots">{stages.map((item, index) => <i className={index === stage ? "active" : ""} key={item.index} />)}</div>
          </aside>

          <div className="hw-world">
            <motion.div className="hw-world-mac" style={prefersReducedMotion ? undefined : { scale: macScale, y: macY, opacity: macOpacity }}>
              <MacBook compact />
            </motion.div>

            <motion.div className="hw-browser-world" style={prefersReducedMotion ? undefined : { scale: browserScale, opacity: browserOpacity }}>
              <div className="hw-browser-shell">
                <div className="hw-browser-top"><div><i /><i /><i /></div><code>guvenilirmi.com</code><span>LIVE SCAN</span></div>
                <div className="hw-browser-content">
                  <div className="hw-scan-glow" />
                  <div className="hw-scan-title"><small>TEKNİK GÜVEN SKORU</small><strong>94</strong><span>DÜŞÜK GÖZLEMLENEN RİSK</span></div>
                  <div className="hw-scan-list">
                    <article><b>TLS</b><span>Doğrulandı</span><em>+8</em></article>
                    <article><b>HEADERS</b><span>Güçlü</span><em>+7</em></article>
                    <article><b>REDIRECT</b><span>Temiz</span><em>+5</em></article>
                    <article><b>FORM</b><span>Aynı origin</span><em>+4</em></article>
                  </div>
                  <div className="hw-beam" />
                </div>
              </div>
            </motion.div>

            <motion.div className="hw-engine" style={prefersReducedMotion ? undefined : { scale: engineScale, opacity: engineOpacity }}>
              <div className="hw-engine-core"><small>INPUT</small><strong>URL</strong><span>deterministic</span></div>
              {engineNodes.map(([label, value], index) => (
                <div className={`hw-engine-node node-${index + 1}`} key={label}><i /><b>{label}</b><span>{value}</span></div>
              ))}
              <div className="hw-engine-ring r1" /><div className="hw-engine-ring r2" /><div className="hw-engine-ring r3" />
              <div className="hw-packet p1" /><div className="hw-packet p2" /><div className="hw-packet p3" />
            </motion.div>

            <motion.div className="hw-risk" style={{ opacity: riskOpacity }}>
              <div className="hw-risk-title"><small>RISK GRAPH</small><strong>3 ilişkili sinyal</strong></div>
              <svg viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">
                <path d="M140 300 C310 125 450 170 530 290" />
                <path d="M530 290 C670 110 820 185 870 320" />
                <path d="M530 290 C650 450 770 455 870 320" />
              </svg>
              <div className="hw-risk-node a"><small>DOMAIN AGE</small><b>7 gün</b><em>−18</em></div>
              <div className="hw-risk-node b"><small>FORM TARGET</small><b>external origin</b><em>−22</em></div>
              <div className="hw-risk-node c"><small>REDIRECT</small><b>3 host</b><em>−11</em></div>
            </motion.div>

            <motion.div className="hw-evidence" style={prefersReducedMotion ? undefined : { opacity: evidenceOpacity, scale: evidenceScale }}>
              <div className="hw-score-core"><strong>23</strong><span>/100</span><small>YÜKSEK GÖZLEMLENEN RİSK</small></div>
              <div className="hw-breakdown">
                <article><span>Harici form hedefi</span><i><b style={{ width: "92%" }} /></i><em>−22</em></article>
                <article><span>Domain geçmişi</span><i><b style={{ width: "76%" }} /></i><em>−18</em></article>
                <article><span>Redirect zinciri</span><i><b style={{ width: "55%" }} /></i><em>−11</em></article>
                <article className="positive"><span>TLS doğrulaması</span><i><b style={{ width: "38%" }} /></i><em>+8</em></article>
              </div>
            </motion.div>

            <form className="hw-final" onSubmit={submitFinal}>
              <small>CANLI ANALİZ</small>
              <h3>Kendi URL'ni gönder.</h3>
              <div><span>https://</span><input value={finalUrl} onChange={(event) => setFinalUrl(event.target.value)} placeholder="ornek-site.com" /><button>Analiz et ↗</button></div>
              <p>AI/LLM yok · teknik sinyaller · açıklanabilir sonuç</p>
            </form>
          </div>
        </div>
      </section>

      <section className="hw-proof">
        <div className="hw-proof-head"><p>GERÇEK PROBLEM / KAYNAKLI VERİ</p><h2>Güven hissi değil.<br />Kanıt.</h2></div>
        <div className="hw-stats">
          {sourceStats.map((stat) => (
            <a href={stat.sourceUrl} target="_blank" rel="noreferrer" key={stat.label}>
              <small>{stat.year} · {stat.sourceLabel}</small><strong>{stat.value}</strong><span>{stat.label}</span><p>{stat.detail}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="hw-end">
        <p>GÜVENİRLİMİ / EXPLAINABLE TRUST ENGINE</p>
        <h2>Bir URL'nin<br />içine bak.</h2>
        <Link href="/analiz">Canlı analize başla <span>↗</span></Link>
      </section>
    </main>
  );
}
