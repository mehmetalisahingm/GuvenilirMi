"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

const stages = [
  {
    no: "01",
    label: "NORMAL",
    title: "Her şey normal görünür.",
    copy: "Temiz bir mağaza. Güzel ürünler. Güven veren renkler. Bir ziyaretçinin gördüğü yalnızca bu.",
    tone: "neutral",
  },
  {
    no: "02",
    label: "X-RAY",
    title: "Görüntüyü kapat. Davranışı gör.",
    copy: "GüvenilirMi sayfayı görsel olarak değil, teknik davranış katmanlarıyla okumaya başlar.",
    tone: "blue",
  },
  {
    no: "03",
    label: "FORM TRACE",
    title: "Ödeme formu dışarı çıkıyor.",
    copy: "Checkout formu mağazanın kendi origin'inde değil. Bu tek başına hüküm değildir; ama güçlü bir risk sinyalidir.",
    tone: "red",
  },
  {
    no: "04",
    label: "BREACH VIEW",
    title: "Sayfanın iç yüzü parçalanır.",
    copy: "Yönlendirmeler, form hedefleri ve domain geçmişi aynı sahnede bağlanınca normal görünen arayüzün altındaki risk görünür olur.",
    tone: "red",
  },
  {
    no: "05",
    label: "EVIDENCE",
    title: "Sonuç değil, kanıt.",
    copy: "Skor en son gelir. Önce hangi sinyallerin ölçüldüğünü ve hangilerinin sonucu değiştirdiğini görürsün.",
    tone: "amber",
  },
  {
    no: "06",
    label: "LIVE",
    title: "Şimdi gerçek URL'yi gönder.",
    copy: "Demo biter; aynı deterministik motor gerçek siteyi analiz eder.",
    tone: "neutral",
  },
] as const;

function goToAnalysis(raw: string) {
  const value = raw.trim();
  if (!value) return;
  window.location.assign(`/analiz?url=${encodeURIComponent(value)}`);
}

function FakeShop({ story = false }: { story?: boolean }) {
  return (
    <div className={story ? "bv-shop bv-shop-story" : "bv-shop"}>
      <header className="bv-shop-nav">
        <strong>NOCTRA</strong>
        <nav><span>Objects</span><span>Archive</span><span>Journal</span></nav>
        <div><i>Search</i><i>Bag 01</i></div>
      </header>

      <div className="bv-lux-hero">
        <div className="bv-lux-copy">
          <small>OBJECT 01 / LIMITED EDITION</small>
          <h3>Time,<br />reframed.</h3>
          <p>A sculptural timepiece built from brushed titanium, sapphire glass and obsessive restraint.</p>
          <div className="bv-lux-actions">
            <button type="button">Explore Object 01</button>
            <span>₺18.900</span>
          </div>
        </div>

        <div className="bv-watch-stage" aria-hidden="true">
          <div className="bv-watch-halo" />
          <svg className="bv-watch" viewBox="0 0 480 520">
            <defs>
              <linearGradient id="strap" x1="0" x2="1">
                <stop offset="0" stopColor="#1b1d21" />
                <stop offset=".5" stopColor="#555b62" />
                <stop offset="1" stopColor="#15171a" />
              </linearGradient>
              <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#e7eaee" />
                <stop offset=".32" stopColor="#838992" />
                <stop offset=".62" stopColor="#f7f8f9" />
                <stop offset="1" stopColor="#656b72" />
              </linearGradient>
              <radialGradient id="dial">
                <stop offset="0" stopColor="#262a30" />
                <stop offset=".7" stopColor="#090a0d" />
                <stop offset="1" stopColor="#020304" />
              </radialGradient>
              <filter id="soft">
                <feGaussianBlur stdDeviation="10" />
              </filter>
            </defs>
            <ellipse cx="245" cy="446" rx="132" ry="26" fill="rgba(23,18,30,.22)" filter="url(#soft)" />
            <rect x="192" y="14" width="106" height="190" rx="48" fill="url(#strap)" />
            <rect x="192" y="318" width="106" height="188" rx="48" fill="url(#strap)" />
            <rect x="154" y="150" width="182" height="222" rx="58" fill="url(#metal)" />
            <rect x="166" y="162" width="158" height="198" rx="49" fill="#14171b" />
            <ellipse cx="245" cy="261" rx="71" ry="89" fill="url(#dial)" stroke="#717780" strokeWidth="2" />
            <circle cx="245" cy="261" r="55" fill="none" stroke="#2b3036" strokeWidth="1" />
            <line x1="245" y1="261" x2="245" y2="213" stroke="#eef0f2" strokeWidth="5" strokeLinecap="round" />
            <line x1="245" y1="261" x2="286" y2="281" stroke="#c8ccd0" strokeWidth="4" strokeLinecap="round" />
            <circle cx="245" cy="261" r="6" fill="#f5f6f7" />
            <rect x="338" y="222" width="15" height="78" rx="7" fill="#7b8188" />
            <path d="M177 177 C216 153 289 150 315 187" fill="none" stroke="rgba(255,255,255,.42)" strokeWidth="5" />
          </svg>
          <div className="bv-watch-spec left"><small>CASE</small><b>42 mm</b></div>
          <div className="bv-watch-spec right"><small>MATERIAL</small><b>Titanium</b></div>
          <span className="bv-object-id">NOCTRA / O1 — 2026</span>
        </div>
      </div>

      <div className="bv-lux-strip">
        <article><small>01</small><b>Sapphire crystal</b><span>Scratch resistant</span></article>
        <article><small>02</small><b>Automatic movement</b><span>72 h reserve</span></article>
        <article><small>03</small><b>Water resistance</b><span>10 ATM</span></article>
      </div>

      <div className="bv-checkout-card">
        <small>QUICK RESERVE</small>
        <strong>Object 01</strong>
        <div><span>•••• •••• •••• 4812</span><em>09/28</em></div>
        <button type="button">Reserve — ₺18.900</button>
      </div>

      {story && (
        <>
          <div className="bv-xray-grid" />
          <div className="bv-xray-box x1"><b>FORM ACTION</b><span>pay-secure.example</span><em>EXTERNAL</em></div>
          <div className="bv-xray-box x2"><b>DOMAIN AGE</b><span>7 gün</span><em>NEW</em></div>
          <div className="bv-xray-box x3"><b>REDIRECT</b><span>3 host</span><em>CHAIN</em></div>
          <div className="bv-xray-box x4"><b>CSP</b><span>bulunamadı</span><em>MISSING</em></div>
          <svg className="bv-trace-lines" viewBox="0 0 1200 700" preserveAspectRatio="none" aria-hidden="true">
            <path d="M190 170 C340 130 460 180 585 350" />
            <path d="M1020 155 C830 150 760 230 585 350" />
            <path d="M1080 540 C870 520 760 440 585 350" />
            <path d="M180 555 C360 545 450 470 585 350" />
          </svg>
          <div className="bv-breach-center"><span>FORM</span><strong>→</strong><b>external origin</b></div>
          <div className="bv-glitch-slice s1" />
          <div className="bv-glitch-slice s2" />
          <div className="bv-glitch-slice s3" />
        </>
      )}
    </div>
  );
}

function BrowserWindow({ story = false }: { story?: boolean }) {
  return (
    <div className={story ? "bv-browser bv-browser-story" : "bv-browser"}>
      <div className="bv-browser-top">
        <div className="bv-dots"><i /><i /><i /></div>
        <div className="bv-tab"><span>◈</span><b>NOCTRA / Object 01</b><i>×</i></div>
        <button type="button">+</button>
      </div>
      <div className="bv-address">
        <div className="bv-controls"><span>‹</span><span>›</span><span>↻</span></div>
        <div className="bv-url"><i>⌁</i><span>https://noctra-atelier.example</span><b>•••</b></div>
        <div className="bv-browser-actions"><span>☆</span><span>⌘</span></div>
      </div>
      <div className="bv-browser-page">
        <FakeShop story={story} />
      </div>
    </div>
  );
}

function DesktopScene({ story = false }: { story?: boolean }) {
  return (
    <div className={story ? "bv-desktop bv-desktop-story" : "bv-desktop"}>
      <div className="bv-wallpaper">
        <div className="aurora a" /><div className="aurora b" /><div className="aurora c" />
      </div>
      <div className="bv-menu-bar">
        <div><b>●</b><span>Finder</span><span>Dosya</span><span>Düzen</span></div>
        <div><span>Wi‑Fi</span><span>100%</span><span>09:41</span></div>
      </div>
      <div className="bv-browser-launch">
        <BrowserWindow story={story} />
      </div>
      <div className="bv-cursor">➤</div>
      <div className="bv-dock">
        <i className="finder">◫</i>
        <i className="safari">◉</i>
        <i>✉</i>
        <i>♫</i>
        <i>⚙</i>
      </div>
    </div>
  );
}

function Laptop({ story = false }: { story?: boolean }) {
  return (
    <div className={story ? "bv-laptop bv-laptop-story" : "bv-laptop"}>
      <div className="bv-lid">
        <div className="bv-camera"><i /></div>
        <div className="bv-screen">
          <DesktopScene story={story} />
          <div className="bv-screen-reflection" />
        </div>
      </div>
      <div className="bv-hinge"><i /><i /></div>
      <div className="bv-base">
        <div className="bv-keyboard">
          {Array.from({ length: 66 }).map((_, i) => <i key={i} className={i === 61 ? "space" : ""} />)}
        </div>
        <div className="bv-speaker left" /><div className="bv-speaker right" />
        <div className="bv-trackpad" />
      </div>
      <div className="bv-edge"><i /></div>
      <div className="bv-shadow" />
    </div>
  );
}

function EvidencePanel() {
  return (
    <div className="bv-evidence-panel">
      <div className="bv-evidence-score">
        <small>TEKNİK GÜVEN SKORU</small>
        <strong>23</strong>
        <span>/100</span>
        <p>yüksek gözlemlenen risk</p>
      </div>
      <div className="bv-evidence-list">
        <article><span>Harici form hedefi</span><i><b style={{ width: "94%" }} /></i><em>−22</em></article>
        <article><span>Domain geçmişi</span><i><b style={{ width: "79%" }} /></i><em>−18</em></article>
        <article><span>Redirect zinciri</span><i><b style={{ width: "58%" }} /></i><em>−11</em></article>
        <article className="good"><span>TLS doğrulaması</span><i><b style={{ width: "36%" }} /></i><em>+8</em></article>
      </div>
      <footer><b>92%</b><span>analysis coverage</span><i /><b>HIGH</b><span>confidence</span></footer>
    </div>
  );
}

export function BrowserBreachCinematic() {
  const storyRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [url, setUrl] = useState("");

  const { scrollYProgress } = useScroll({
    target: storyRef,
    offset: ["start start", "end end"],
  });

  const laptopScale = useTransform(scrollYProgress, [0, .10, .21, .30], [.98, 1.04, 1.16, 1.34]);
  const laptopY = useTransform(scrollYProgress, [0, .15, .25, .31], [6, -2, -12, -28]);
  const laptopOpacity = useTransform(scrollYProgress, [0, .25, .34], [1, 1, 0]);
  const browserScale = useTransform(scrollYProgress, [.17, .29, .44], [.96, 1, 1.035]);
  const browserOpacity = useTransform(scrollYProgress, [.15, .24, .44, .50], [0, 1, 1, 0]);
  const breachOpacity = useTransform(scrollYProgress, [.40, .50, .71, .79], [0, 1, 1, 0]);
  const breachScale = useTransform(scrollYProgress, [.40, .56, .72], [.97, 1, 1.012]);
  const evidenceOpacity = useTransform(scrollYProgress, [.67, .78, .90], [0, 1, 1]);
  const evidenceScale = useTransform(scrollYProgress, [.67, .81, .95], [.82, 1, 1.05]);
  const finalOpacity = useTransform(scrollYProgress, [.88, .96, 1], [0, 1, 1]);
  const finalScale = useTransform(scrollYProgress, [.88, .98], [.9, 1]);
  const progress = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = Math.min(stages.length - 1, Math.floor(value * stages.length));
    setStage((current) => current === next ? current : next);
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    goToAnalysis(url);
  }

  const current = stages[stage];

  return (
    <main className="bv-page">
      <div className="bv-noise" aria-hidden="true" />
      <header className="bv-nav">
        <Link href="/" className="bv-brand"><span>✓</span><b>GüvenilirMi</b></Link>
        <div className="bv-nav-meta">TECHNICAL TRUST / NO AI</div>
        <Link href="/analiz" className="bv-nav-cta">Site tara ↗</Link>
      </header>

      <section className="bv-hero">
        <div className="bv-hero-copy">
          <p><i /> BİR SİTENİN İÇİNE BAK</p>
          <h1>Güzel görünmek,<br /><em>güvenli olmak</em><br />değil.</h1>
          <span>MacBook'ta tarayıcı açılır, site yüklenir ve teknik katmanları tek tek sökülür. Sonuçtan önce kanıtı gör.</span>
          <form onSubmit={submit}>
            <b>https://</b>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="ornek-site.com" />
            <button type="submit">Analiz et ↗</button>
          </form>
          <div className="bv-tags"><span>AI YOK</span><i /><span>AÇIKLANABİLİR</span><i /><span>TEKNİK SİNYAL</span></div>
        </div>

        <motion.div
          className="bv-hero-laptop"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 42, scale: .95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="bv-room-light" />
          <Laptop />
        </motion.div>

        <a href="#hikaye" className="bv-scroll"><span>↓</span> SCROLL / HİKÂYEYİ BAŞLAT</a>
      </section>

      <section className="bv-story" id="hikaye" ref={storyRef}>
        <div className={`bv-sticky bv-tone-${current.tone} bv-stage-${stage}`}>
          <motion.div className="bv-progress" style={{ width: progress }} />
          <div className="bv-story-grid" />

          <aside className="bv-story-copy">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.no}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 18, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -12, filter: "blur(8px)" }}
                transition={{ duration: .38 }}
              >
                <p><b>{current.no}</b><i />{current.label}</p>
                <h2>{current.title}</h2>
                <span>{current.copy}</span>
              </motion.div>
            </AnimatePresence>
            <div className="bv-stage-dots">{stages.map((s, i) => <i key={s.no} className={i === stage ? "active" : ""} />)}</div>
          </aside>

          <div className="bv-world">
            <motion.div
              className="bv-world-laptop"
              style={prefersReducedMotion ? undefined : { scale: laptopScale, y: laptopY, opacity: laptopOpacity }}
            >
              <Laptop story />
            </motion.div>

            <motion.div
              className="bv-world-browser"
              style={prefersReducedMotion ? undefined : { scale: browserScale, opacity: browserOpacity }}
            >
              <BrowserWindow story />
            </motion.div>

            <motion.div
              className="bv-breach-world"
              style={prefersReducedMotion ? undefined : { scale: breachScale, opacity: breachOpacity }}
            >
              <BrowserWindow story />
              <div className="bv-warning-banner"><i>!</i><b>TRUST X-RAY ACTIVE</b><span>4 suspicious relationships detected</span></div>
              <div className="bv-data-rain">{Array.from({length: 14}).map((_, i) => <i key={i}>{i % 2 ? "FORM→EXT" : "302→HOST"}</i>)}</div>
            </motion.div>

            <motion.div
              className="bv-world-evidence"
              style={prefersReducedMotion ? undefined : { opacity: evidenceOpacity, scale: evidenceScale }}
            >
              <EvidencePanel />
            </motion.div>

            <motion.form
              className="bv-live-card"
              onSubmit={submit}
              style={prefersReducedMotion ? undefined : { opacity: finalOpacity, scale: finalScale }}
            >
              <small>CANLI ANALİZ / GERÇEK MOTOR</small>
              <h3>Şimdi senin URL'in.</h3>
              <p>Bu sefer demo değil. DNS, TLS, HTTP, redirect ve sayfa sinyalleri gerçekten ölçülsün.</p>
              <div><b>https://</b><input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="ornek-site.com" /><button>Analiz et ↗</button></div>
              <footer><span>AI yok</span><i /><span>deterministik skor</span><i /><span>SSRF koruması</span></footer>
            </motion.form>
          </div>
        </div>
      </section>

      <section className="bv-after">
        <p>GÜVENİRLİMİ / TECHNICAL TRUST ENGINE</p>
        <h2>Görünüşü değil.<br /><em>Davranışı incele.</em></h2>
        <Link href="/analiz">Canlı analize başla ↗</Link>
      </section>
    </main>
  );
}
