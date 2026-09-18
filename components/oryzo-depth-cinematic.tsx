"use client";

import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";
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
    label: "BOOT",
    title: "Önce cihaz uyanır.",
    copy: "Terminal yalnızca giriş kapısı. GüvenilirMi, URL'yi almadan önce analiz motorunu ve kanıt katmanlarını hazırlar.",
    tone: "green",
  },
  {
    index: "02",
    label: "MORPH",
    title: "Komut, ürüne dönüşür.",
    copy: "hello, world. kaybolurken terminal satırları tarayıcıya, URL çubuğuna ve canlı tarama arayüzüne dönüşür.",
    tone: "green",
  },
  {
    index: "03",
    label: "SCAN",
    title: "Yüzey ölçülmeye başlar.",
    copy: "DNS, TLS, HTTP, yönlendirme ve form davranışları aynı anda ölçülür. Her sonuç ayrı bir kanıt olarak tutulur.",
    tone: "cyan",
  },
  {
    index: "04",
    label: "ENGINE",
    title: "Skorun arkasında bir motor var.",
    copy: "Tek bir yapay zekâ tahmini yok. Bağımsız kontroller, ölçüm kapsamı ve kanıt güveni birlikte çalışır.",
    tone: "cyan",
  },
  {
    index: "05",
    label: "RISK GRAPH",
    title: "Tek sinyal değil, ilişki önemlidir.",
    copy: "Yeni domain, harici form hedefi ve yönlendirme zinciri birleştiğinde risk bağlam kazanır ve ağ üzerinde görünür olur.",
    tone: "red",
  },
  {
    index: "06",
    label: "EVIDENCE",
    title: "23 neden 23?",
    copy: "Skoru parçala. Hangi sinyalin ne kadar etkilediğini, neyin ölçülemediğini ve güven seviyesini ayrı ayrı gör.",
    tone: "amber",
  },
  {
    index: "07",
    label: "LIVE",
    title: "Şimdi gerçek URL'yi gönder.",
    copy: "Sinematik anlatı burada biter; aynı motor gerçek siteyi taramaya başlar.",
    tone: "green",
  },
] as const;

const engineNodes = [
  ["DNS", "PUBLIC IP", "12 ms"],
  ["TLS", "VALID", "TLS 1.3"],
  ["HTTP", "200", "2 hops"],
  ["RDAP", "1248 D", "stable"],
  ["HEADERS", "6 / 7", "strong"],
  ["HTML", "SCAN", "same origin"],
] as const;

const labSignals = [
  {
    id: "domain",
    label: "Domain geçmişi",
    detail: "Alan adı 7 gün önce kayıt edilmiş.",
    impact: -18,
    severity: "warn",
  },
  {
    id: "form",
    label: "Harici form hedefi",
    detail: "Ödeme formu farklı bir origin'e veri gönderiyor.",
    impact: -22,
    severity: "fail",
  },
  {
    id: "redirect",
    label: "Redirect zinciri",
    detail: "İstek üç farklı host üzerinden yönleniyor.",
    impact: -11,
    severity: "fail",
  },
  {
    id: "tls",
    label: "TLS doğrulaması",
    detail: "Sertifika zinciri geçerli ve hostname eşleşiyor.",
    impact: 8,
    severity: "pass",
  },
  {
    id: "headers",
    label: "Güvenlik başlıkları",
    detail: "HSTS, nosniff ve frame korumaları mevcut.",
    impact: 7,
    severity: "pass",
  },
] as const;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function goToAnalysis(raw: string) {
  const value = raw.trim();
  if (!value) return;
  window.location.assign(`/analiz?url=${encodeURIComponent(value)}`);
}

function Keyboard() {
  return (
    <div className="od-keyboard" aria-hidden="true">
      {Array.from({ length: 67 }).map((_, index) => (
        <i
          className={
            index === 61 ? "space" : index > 61 && index < 65 ? "wide" : ""
          }
          key={index}
        />
      ))}
    </div>
  );
}

function DeviceScreen({ story = false }: { story?: boolean }) {
  return (
    <div className={story ? "od-screen od-screen-story" : "od-screen"}>
      <div className="od-screen-chrome">
        <div className="od-traffic"><i /><i /><i /></div>
        <span>trust-shell — zsh</span>
        <b><i /> secure session</b>
      </div>

      <div className="od-terminal-layer">
        <p>GÜVENİRLİMİ / TRUST ENGINE</p>
        <code><em>~</em> $ inspect --url guvenilirmi.com</code>
        <div className="od-boot">
          <span><i /> boot deterministic engine</span>
          <span><i /> dns resolver ........ ready</span>
          <span><i /> tls verifier ........ ready</span>
          <span><i /> http probe .......... ready</span>
        </div>
        <strong className="od-hello">hello, world<span>_</span></strong>
        <div className="od-terminal-pills">
          <span><i /> DNS ready</span>
          <span><i /> TLS verified</span>
          <span><i /> HTTP reachable</span>
        </div>
      </div>

      {story && (
        <div className="od-screen-browser">
          <div className="od-screen-url">
            <span>https://</span>
            <b>guvenilirmi.com</b>
            <i>CANLI</i>
          </div>
          <div className="od-screen-score">
            <small>TEKNİK GÜVEN SKORU</small>
            <strong>94</strong>
            <span>DÜŞÜK GÖZLEMLENEN RİSK</span>
          </div>
          <div className="od-screen-signals">
            <article><b>TLS</b><span>Doğrulandı</span><em>+8</em></article>
            <article><b>HEADERS</b><span>Güçlü</span><em>+7</em></article>
            <article><b>REDIRECT</b><span>Temiz</span><em>+5</em></article>
          </div>
          <div className="od-screen-beam" />
        </div>
      )}

      <div className="od-screen-glass" />
    </div>
  );
}

function MacBook({ story = false }: { story?: boolean }) {
  return (
    <div className={story ? "od-mac od-mac-story" : "od-mac"} aria-hidden="true">
      <div className="od-lid">
        <div className="od-camera"><i /></div>
        <DeviceScreen story={story} />
      </div>
      <div className="od-hinge"><i /><i /></div>
      <div className="od-deck">
        <Keyboard />
        <div className="od-speaker od-speaker-left" />
        <div className="od-speaker od-speaker-right" />
        <div className="od-trackpad" />
      </div>
      <div className="od-edge"><i /></div>
      <div className="od-device-shadow" />
    </div>
  );
}

function TrustLab() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(labSignals.map((signal) => [signal.id, true])),
  );
  const [focus, setFocus] = useState(labSignals[1].id);

  const score = useMemo(() => {
    const impact = labSignals.reduce(
      (total, signal) => total + (enabled[signal.id] ? signal.impact : 0),
      0,
    );
    return clamp(65 + impact);
  }, [enabled]);

  const focused = labSignals.find((signal) => signal.id === focus) ?? labSignals[0];

  return (
    <section className="od-lab" id="lab">
      <div className="od-lab-heading">
        <p>INTERACTIVE TRUST LAB / OYNA</p>
        <h2>Skoru bize inanarak değil,<br /><em>kurcalayarak</em> anla.</h2>
        <span>Sinyalleri açıp kapat. Sonucun nasıl değiştiğini canlı gör.</span>
      </div>

      <div className="od-lab-grid">
        <div className="od-composer">
          <div className="od-lab-window-top">
            <span>SCORE COMPOSER</span>
            <b>deterministic / live</b>
          </div>
          <div className="od-composer-body">
            <div className="od-live-score">
              <small>ANLIK SKOR</small>
              <strong>{score}</strong>
              <span>/100</span>
              <p>{score >= 70 ? "düşük gözlemlenen risk" : score >= 45 ? "dikkat gerektiriyor" : "yüksek gözlemlenen risk"}</p>
            </div>
            <div className="od-signal-toggles">
              {labSignals.map((signal) => (
                <button
                  type="button"
                  key={signal.id}
                  className={`od-toggle ${signal.severity} ${enabled[signal.id] ? "active" : ""}`}
                  aria-pressed={enabled[signal.id]}
                  onClick={() =>
                    setEnabled((current) => ({
                      ...current,
                      [signal.id]: !current[signal.id],
                    }))
                  }
                  onMouseEnter={() => setFocus(signal.id)}
                  onFocus={() => setFocus(signal.id)}
                >
                  <i />
                  <span><b>{signal.label}</b><small>{signal.detail}</small></span>
                  <em>{signal.impact > 0 ? "+" : ""}{signal.impact}</em>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="od-microscope">
          <div className="od-lab-window-top">
            <span>SIGNAL MICROSCOPE</span>
            <b>hover / inspect</b>
          </div>
          <div className="od-map">
            <svg viewBox="0 0 700 520" aria-hidden="true">
              <path d="M80 285 C190 90 315 140 350 255" />
              <path d="M350 255 C450 85 585 130 635 275" />
              <path d="M350 255 C430 420 545 430 635 275" />
              <path d="M80 285 C200 435 290 410 350 255" />
            </svg>
            {labSignals.slice(0, 4).map((signal, index) => (
              <button
                type="button"
                className={`od-map-node n${index + 1} ${signal.severity} ${focus === signal.id ? "active" : ""}`}
                key={signal.id}
                onMouseEnter={() => setFocus(signal.id)}
                onFocus={() => setFocus(signal.id)}
                onClick={() => setFocus(signal.id)}
              >
                <small>{signal.label}</small>
                <strong>{signal.impact > 0 ? "+" : ""}{signal.impact}</strong>
              </button>
            ))}
            <div className="od-lens">
              <span>INSPECTING</span>
              <strong>{focused.label}</strong>
              <p>{focused.detail}</p>
              <b>{focused.impact > 0 ? "+" : ""}{focused.impact} SCORE IMPACT</b>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function OryzoDepthCinematic() {
  const storyRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [heroUrl, setHeroUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");

  const { scrollYProgress } = useScroll({
    target: storyRef,
    offset: ["start start", "end end"],
  });

  const deviceScale = useTransform(scrollYProgress, [0, .08, .18, .28], [.9, 1.02, 1.42, 2.18]);
  const deviceY = useTransform(scrollYProgress, [0, .17, .28], [26, -8, -95]);
  const deviceOpacity = useTransform(scrollYProgress, [0, .22, .31], [1, 1, 0]);
  const browserScale = useTransform(scrollYProgress, [.18, .31, .43], [.78, 1, 1.28]);
  const browserOpacity = useTransform(scrollYProgress, [.17, .25, .41, .48], [0, 1, 1, 0]);
  const engineScale = useTransform(scrollYProgress, [.34, .49, .60], [.72, 1, 1.22]);
  const engineOpacity = useTransform(scrollYProgress, [.32, .40, .58, .64], [0, 1, 1, 0]);
  const riskOpacity = useTransform(scrollYProgress, [.54, .62, .73, .79], [0, 1, 1, 0]);
  const evidenceScale = useTransform(scrollYProgress, [.69, .80, .92], [.82, 1, 1.08]);
  const evidenceOpacity = useTransform(scrollYProgress, [.68, .77, .90, .96], [0, 1, 1, 0]);
  const liveOpacity = useTransform(scrollYProgress, [.88, .95, 1], [0, 1, 1]);
  const liveScale = useTransform(scrollYProgress, [.88, .98], [.88, 1]);
  const progress = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = Math.min(stages.length - 1, Math.floor(value * stages.length));
    setStage((current) => (current === next ? current : next));
  });

  function submitHero(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    goToAnalysis(heroUrl);
  }

  function submitLive(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    goToAnalysis(liveUrl);
  }

  const current = stages[stage];

  return (
    <main className="od-page">
      <div className="od-grain" aria-hidden="true" />
      <header className="od-nav">
        <Link href="/" className="od-brand"><span>✓</span><b>GüvenilirMi</b></Link>
        <div className="od-nav-meta"><i /> EXPLAINABLE TRUST ENGINE</div>
        <Link href="/analiz" className="od-nav-cta">Site tara <span>↗</span></Link>
      </header>

      <section className="od-hero" id="top">
        <div className="od-grid" aria-hidden="true" />
        <div className="od-desk-plane" aria-hidden="true">
          <i className="od-desk-line a" /><i className="od-desk-line b" />
          <span className="od-desk-tag">FORENSIC DESK / SESSION 7F-A3</span>
        </div>

        <div className="od-hero-copy">
          <p className="od-kicker"><i /> URL'DEN DAHA DERİNE</p>
          <h1>Bir siteye<br />güvenmeden<br /><em>önce içine bak.</em></h1>
          <p className="od-lead">
            Bir site güvenli görünmek için tasarlanabilir. Biz görünüşü değil; DNS, TLS,
            yönlendirme ve sayfa davranışını ölçüyoruz.
          </p>
          <form className="od-search" onSubmit={submitHero}>
            <span>https://</span>
            <input
              value={heroUrl}
              onChange={(event) => setHeroUrl(event.target.value)}
              placeholder="ornek-site.com"
              inputMode="url"
              aria-label="Analiz edilecek site"
            />
            <button type="submit">Analiz et <b>↗</b></button>
          </form>
          <div className="od-micro">
            <span>AI YOK</span><i /><span>API KEY YOK</span><i /><span>AÇIKLANABİLİR SKOR</span>
          </div>
        </div>

        <motion.div
          className="od-hero-device"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 48, scale: .95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="od-hero-light" />
          <div className="od-orbit a" /><div className="od-orbit b" />
          <motion.div className="od-float f1" animate={prefersReducedMotion ? undefined : { y: [0, -9, 0] }} transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}>
            <small>TLS</small><strong>VALID</strong><span>+8</span>
          </motion.div>
          <motion.div className="od-float f2" animate={prefersReducedMotion ? undefined : { y: [0, 8, 0] }} transition={{ duration: 6.7, repeat: Infinity, ease: "easeInOut" }}>
            <small>DOMAIN AGE</small><strong>1248 DAYS</strong><span>stable</span>
          </motion.div>
          <MacBook />
        </motion.div>

        <a href="#story" className="od-scroll"><span>↓</span> SCROLL / İÇERİ GİR</a>
      </section>

      <section className="od-story" ref={storyRef} id="story">
        <div className={`od-sticky od-tone-${current.tone} od-stage-${stage}`}>
          <div className="od-story-grid" />
          <div className="od-story-ambient" />
          <motion.div className="od-progress" style={{ width: progress }} />

          <aside className="od-story-copy">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.index}
                initial={prefersReducedMotion ? false : { opacity: 0, x: -24, filter: "blur(8px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, x: 20, filter: "blur(8px)" }}
                transition={{ duration: .42 }}
              >
                <div className="od-stage-label"><b>{current.index}</b><i />{current.label}</div>
                <h2>{current.title}</h2>
                <p>{current.copy}</p>
              </motion.div>
            </AnimatePresence>
            <div className="od-stage-dots">
              {stages.map((item, index) => <i className={index === stage ? "active" : ""} key={item.index} />)}
            </div>
          </aside>

          <div className="od-world">
            <motion.div
              className="od-world-device"
              style={prefersReducedMotion ? undefined : { scale: deviceScale, y: deviceY, opacity: deviceOpacity }}
            >
              <MacBook story />
            </motion.div>

            <motion.div
              className="od-browser"
              style={prefersReducedMotion ? undefined : { scale: browserScale, opacity: browserOpacity }}
            >
              <div className="od-browser-shell">
                <div className="od-browser-top">
                  <div><i /><i /><i /></div>
                  <code>https://guvenilirmi.com</code>
                  <span>LIVE SCAN</span>
                </div>
                <div className="od-browser-body">
                  <div className="od-browser-grid" />
                  <div className="od-browser-heading">
                    <small>CANLI TEKNİK TARAMA</small>
                    <strong>94</strong>
                    <span>DÜŞÜK GÖZLEMLENEN RİSK</span>
                  </div>
                  <div className="od-browser-signals">
                    <article><b>TLS</b><span>Doğrulandı</span><em>+8</em></article>
                    <article><b>HEADERS</b><span>Güçlü</span><em>+7</em></article>
                    <article><b>REDIRECT</b><span>Temiz</span><em>+5</em></article>
                    <article><b>FORM</b><span>Aynı origin</span><em>+4</em></article>
                  </div>
                  <div className="od-browser-beam" />
                  <div className="od-browser-pulse p1" /><div className="od-browser-pulse p2" />
                </div>
              </div>
            </motion.div>

            <motion.div
              className="od-engine"
              style={prefersReducedMotion ? undefined : { scale: engineScale, opacity: engineOpacity }}
            >
              <div className="od-engine-title"><small>DETERMINISTIC TRUST ENGINE</small><span>6 PARALLEL CHECKS</span></div>
              <div className="od-engine-core"><span>URL</span><strong>SCORE</strong><small>explainable</small></div>
              {engineNodes.map(([label, value, meta], index) => (
                <div className={`od-engine-node n${index + 1}`} key={label}>
                  <i /><b>{label}</b><strong>{value}</strong><small>{meta}</small>
                </div>
              ))}
              <div className="od-ring r1" /><div className="od-ring r2" /><div className="od-ring r3" />
              <div className="od-packet p1" /><div className="od-packet p2" /><div className="od-packet p3" /><div className="od-packet p4" />
            </motion.div>

            <motion.div className="od-risk" style={{ opacity: riskOpacity }}>
              <div className="od-risk-head"><small>CORRELATED RISK GRAPH</small><strong>3 sinyal birlikte risk oluşturuyor.</strong></div>
              <svg viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true">
                <path d="M110 320 C270 125 430 165 505 295" />
                <path d="M505 295 C650 115 820 170 895 320" />
                <path d="M505 295 C635 480 780 465 895 320" />
                <path d="M110 320 C250 470 390 430 505 295" />
              </svg>
              <div className="od-risk-core"><span>23</span><small>/100</small></div>
              <div className="od-risk-node a"><small>DOMAIN AGE</small><b>7 gün</b><em>−18</em></div>
              <div className="od-risk-node b critical"><small>FORM TARGET</small><b>external origin</b><em>−22</em></div>
              <div className="od-risk-node c"><small>REDIRECT</small><b>3 host</b><em>−11</em></div>
              <div className="od-risk-node d positive"><small>TLS</small><b>valid</b><em>+8</em></div>
            </motion.div>

            <motion.div
              className="od-evidence"
              style={prefersReducedMotion ? undefined : { opacity: evidenceOpacity, scale: evidenceScale }}
            >
              <div className="od-evidence-score">
                <div className="od-score-ring"><strong>23</strong><span>/100</span></div>
                <p>YÜKSEK GÖZLEMLENEN RİSK</p>
                <small>coverage 92% · confidence high</small>
              </div>
              <div className="od-evidence-stack">
                <article><span>Harici form hedefi</span><i><b style={{ width: "94%" }} /></i><em>−22</em></article>
                <article><span>Domain geçmişi</span><i><b style={{ width: "78%" }} /></i><em>−18</em></article>
                <article><span>Redirect zinciri</span><i><b style={{ width: "58%" }} /></i><em>−11</em></article>
                <article className="positive"><span>TLS doğrulaması</span><i><b style={{ width: "38%" }} /></i><em>+8</em></article>
                <div className="od-evidence-note"><b>BİLİNMEYEN ≠ RİSK</b><span>Ölçülemeyen sinyal otomatik eksi puan almaz.</span></div>
              </div>
            </motion.div>

            <motion.form
              className="od-live"
              style={prefersReducedMotion ? undefined : { opacity: liveOpacity, scale: liveScale }}
              onSubmit={submitLive}
            >
              <small>CANLI ANALİZ / GERÇEK MOTOR</small>
              <h3>Şimdi senin URL'in.</h3>
              <p>Demo bitti. Aynı deterministik scanner gerçek siteyi ölçsün.</p>
              <div>
                <span>https://</span>
                <input value={liveUrl} onChange={(event) => setLiveUrl(event.target.value)} placeholder="ornek-site.com" />
                <button type="submit">Analiz et <b>↗</b></button>
              </div>
              <footer><i /> AI/LLM yok <i /> açıklanabilir skor <i /> private IP koruması</footer>
            </motion.form>
          </div>
        </div>
      </section>

      <TrustLab />

      <section className="od-proof">
        <div className="od-proof-head">
          <p>GERÇEK PROBLEM / KAYNAKLI VERİ</p>
          <h2>Güven hissi değil.<br /><em>Ölçülebilir kanıt.</em></h2>
        </div>
        <div className="od-stats">
          {sourceStats.map((stat) => (
            <a href={stat.sourceUrl} target="_blank" rel="noreferrer" key={stat.label}>
              <small>{stat.year} · {stat.sourceLabel}</small>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
              <p>{stat.detail}</p>
              <b>Kaynağı aç ↗</b>
            </a>
          ))}
        </div>
      </section>

      <section className="od-end">
        <p>GÜVENİRLİMİ / EXPLAINABLE TRUST ENGINE</p>
        <h2>Bir URL'nin<br />içine bak.</h2>
        <Link href="/analiz">Canlı analize başla <span>↗</span></Link>
      </section>
    </main>
  );
}
