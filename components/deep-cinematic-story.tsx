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

const scenes = [
  {
    index: "01",
    label: "FİZİKSEL DÜNYA",
    title: "Önce cihazın karşısındasın.",
    copy: "Gerçek bir laptop, gerçek bir tarayıcı ve tek soru: bu siteye güvenilir mi?",
  },
  {
    index: "02",
    label: "EKRANIN İÇİ",
    title: "Sonra ekranın içine giriyorsun.",
    copy: "URL, bağlantı ve ilk teknik sinyaller bütün ekranı ele geçiriyor. Donanım geride kalıyor, ürün deneyimi öne geliyor.",
  },
  {
    index: "03",
    label: "AĞ KATMANI",
    title: "Bir kat daha derine: ağın içine.",
    copy: "DNS, TLS, HTTP ve RDAP ayrı veri akışları olarak çözülüyor. Kullanıcı sadece skoru değil, skorun beslendiği yolu görüyor.",
  },
  {
    index: "04",
    label: "RİSK HARİTASI",
    title: "Şüpheli davranışlar ayrışıyor.",
    copy: "Yeni domain, harici form hedefi, yönlendirme zinciri ve zayıf güvenlik başlıkları kırmızı bir risk haritasına dönüşüyor.",
  },
  {
    index: "05",
    label: "KANIT ODASI",
    title: "Kararın içine kadar gir.",
    copy: "Her artı ve eksi puan, kanıt güveni ve belirsizlik oranıyla birlikte açılıyor. Bilinmeyen veri otomatik suçlama sayılmıyor.",
  },
  {
    index: "06",
    label: "CANLI ANALİZ",
    title: "Şimdi kendi siteni gönder.",
    copy: "Sinematik akış burada gerçek ürüne bağlanıyor. Girdiğin URL doğrudan çalışan analiz motoruna gider.",
  },
] as const;

const engineNodes = ["DNS", "TLS", "HTTP", "RDAP", "HEADERS", "HTML"];

function goToAnalysis(raw: string) {
  const value = raw.trim();
  if (!value) return;
  window.location.href = `/analiz?url=${encodeURIComponent(value)}`;
}

export function DeepCinematicStory() {
  const prefersReducedMotion = useReducedMotion();
  const depthRef = useRef<HTMLElement>(null);
  const [scene, setScene] = useState(0);
  const [heroUrl, setHeroUrl] = useState("");
  const [finalUrl, setFinalUrl] = useState("");

  const { scrollYProgress } = useScroll({
    target: depthRef,
    offset: ["start start", "end end"],
  });

  const physicalScale = useTransform(scrollYProgress, [0, 0.11, 0.24, 0.34], [0.88, 1.05, 1.7, 2.8]);
  const physicalY = useTransform(scrollYProgress, [0, 0.24, 0.34], [18, -20, -120]);
  const physicalOpacity = useTransform(scrollYProgress, [0, 0.22, 0.36], [1, 1, 0]);
  const screenScale = useTransform(scrollYProgress, [0.08, 0.22, 0.38], [0.62, 1.05, 2.2]);
  const screenOpacity = useTransform(scrollYProgress, [0.05, 0.14, 0.36, 0.47], [0, 1, 1, 0]);
  const engineScale = useTransform(scrollYProgress, [0.28, 0.45, 0.62], [0.62, 1, 1.42]);
  const engineOpacity = useTransform(scrollYProgress, [0.28, 0.39, 0.56, 0.67], [0, 1, 1, 0]);
  const evidenceScale = useTransform(scrollYProgress, [0.58, 0.76, 0.91], [0.78, 1, 1.16]);
  const railWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = Math.min(5, Math.floor(value * 6));
    setScene((current) => (current === next ? current : next));
  });

  function submitHero(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    goToAnalysis(heroUrl);
  }

  function submitFinal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    goToAnalysis(finalUrl);
  }

  return (
    <main className="dv-home">
      <div className="dv-noise" aria-hidden="true" />
      <header className="dv-nav">
        <a href="#top" className="dv-brand" aria-label="GüvenilirMi ana sayfa">
          <span>G</span>
          <b>GüvenilirMi</b>
        </a>
        <div className="dv-nav-center">
          <span>6 katmanlı teknik analiz deneyimi</span>
        </div>
        <a href="/analiz" className="dv-nav-cta">Canlı analiz ↗</a>
      </header>

      <section className="dv-hero" id="top">
        <div className="dv-hero-copy">
          <p className="dv-kicker"><i /> BİR URL'DEN DAHA DERİNE</p>
          <h1>
            Güvenilir mi?
            <em>İçine gir, kanıtı gör.</em>
          </h1>
          <p>
            Sadece bir skor göstermiyoruz. Siteyi katman katman açıp ağdan sayfa davranışına kadar her teknik izi görünür hale getiriyoruz.
          </p>
          <form className="dv-hero-search" onSubmit={submitHero}>
            <span>https://</span>
            <input
              value={heroUrl}
              onChange={(event) => setHeroUrl(event.target.value)}
              placeholder="ornek-site.com"
              aria-label="Analiz edilecek site"
              autoComplete="url"
              spellCheck={false}
            />
            <button type="submit">Güvenilir mi? <b>↗</b></button>
          </form>
          <div className="dv-hero-meta">
            <span><i /> AI yok</span>
            <span><i /> Ücretli model API yok</span>
            <span><i /> Açıklanabilir skor</span>
          </div>
        </div>

        <motion.div
          className="dv-real-device-wrap"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 40, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="dv-hero-light" aria-hidden="true" />
          <div className="dv-photo-shell">
            <img
              src="https://images.unsplash.com/photo-1776243365820-f64005e4a204?auto=format&fit=crop&fm=jpg&q=86&w=1800"
              alt="Karanlık ortamda açık bir dizüstü bilgisayar"
              className="dv-real-laptop-photo"
            />
            <div className="dv-photo-vignette" />
            <div className="dv-photo-screen-ui">
              <div className="dv-browser-mini">
                <span /><span /><span />
                <code>guvenilirmi.com</code>
              </div>
              <div className="dv-screen-score">
                <small>TEKNİK RİSK</small>
                <strong>94</strong>
                <span>/100</span>
              </div>
              <div className="dv-screen-status"><i /> düşük gözlemlenen risk</div>
            </div>
          </div>
          <div className="dv-float-chip dv-chip-a"><small>TLS</small><strong>Doğrulandı</strong></div>
          <div className="dv-float-chip dv-chip-b"><small>DOMAIN</small><strong>1.248 gün</strong></div>
          <div className="dv-float-chip dv-chip-c"><small>REDIRECT</small><strong>0 host değişimi</strong></div>
          <div className="dv-photo-credit">Fotoğraf: Jayasahan Hansana / Unsplash</div>
        </motion.div>
      </section>

      <section className="dv-depth" ref={depthRef} id="derinlik">
        <div className={`dv-depth-sticky dv-stage-${scene}`}>
          <div className="dv-depth-grid" aria-hidden="true" />
          <div className="dv-stage-progress"><motion.i style={{ width: railWidth }} /></div>

          <aside className="dv-scene-copy">
            <AnimatePresence mode="wait">
              <motion.div
                key={scenes[scene].index}
                initial={prefersReducedMotion ? false : { opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, x: 20 }}
                transition={{ duration: 0.42 }}
              >
                <span className="dv-scene-index">{scenes[scene].index}</span>
                <p>{scenes[scene].label}</p>
                <h2>{scenes[scene].title}</h2>
                <div>{scenes[scene].copy}</div>
              </motion.div>
            </AnimatePresence>
            <div className="dv-scene-dots" aria-hidden="true">
              {scenes.map((item, index) => <span className={index === scene ? "active" : ""} key={item.index} />)}
            </div>
          </aside>

          <div className="dv-world">
            <motion.div
              className="dv-world-photo"
              style={prefersReducedMotion ? undefined : { scale: physicalScale, y: physicalY, opacity: physicalOpacity }}
            >
              <img
                src="https://images.unsplash.com/photo-1776243365820-f64005e4a204?auto=format&fit=crop&fm=jpg&q=86&w=1800"
                alt=""
              />
              <div className="dv-world-photo-ui">
                <code>https://guvenilirmi.com</code>
                <strong>94</strong><span>/100</span>
              </div>
            </motion.div>

            <motion.div
              className="dv-browser-world"
              style={prefersReducedMotion ? undefined : { scale: screenScale, opacity: screenOpacity }}
            >
              <div className="dv-browser-top">
                <div><i /><i /><i /></div>
                <code>https://kampanya-firsat.example</code>
                <span>CANLI TARAMA</span>
              </div>
              <div className="dv-browser-content">
                <div className="dv-browser-score"><small>GÖZLEMLENEN TEKNİK RİSK</small><strong>23</strong><span>/100</span></div>
                <div className="dv-browser-signals">
                  <article className="fail"><b>×</b><div><small>Ödeme formu</small><strong>Harici hedef</strong></div><em>−22</em></article>
                  <article className="warn"><b>!</b><div><small>Domain yaşı</small><strong>7 gün</strong></div><em>−18</em></article>
                  <article className="pass"><b>✓</b><div><small>TLS</small><strong>Doğrulandı</strong></div><em>+8</em></article>
                  <article className="fail"><b>×</b><div><small>Redirect zinciri</small><strong>3 domain</strong></div><em>−11</em></article>
                </div>
                <div className="dv-scan-beam" />
              </div>
            </motion.div>

            <motion.div
              className="dv-engine-world"
              style={prefersReducedMotion ? undefined : { scale: engineScale, opacity: engineOpacity }}
            >
              <div className="dv-engine-core">
                <span>URL</span>
                <strong>SCORE</strong>
                <small>deterministik motor</small>
              </div>
              {engineNodes.map((node, index) => (
                <div className={`dv-engine-node node-${index + 1}`} key={node}>
                  <i />
                  <span>{node}</span>
                  <small>{index % 2 === 0 ? "PASS" : "MEASURE"}</small>
                </div>
              ))}
              <div className="dv-engine-orbit orbit-a" />
              <div className="dv-engine-orbit orbit-b" />
              <div className="dv-engine-orbit orbit-c" />
              <div className="dv-packet p1" /><div className="dv-packet p2" /><div className="dv-packet p3" />
            </motion.div>

            <div className="dv-risk-world">
              <div className="dv-risk-glow" />
              <div className="dv-risk-head"><small>RISK GRAPH</small><strong>4 kritik bağlantı</strong><span>yüksek korelasyon</span></div>
              <svg className="dv-risk-lines" viewBox="0 0 1000 600" role="img" aria-label="Risk ilişkileri görselleştirmesi">
                <path d="M160 310 C320 140 430 160 520 270" />
                <path d="M520 270 C650 120 790 180 860 315" />
                <path d="M520 270 C610 430 750 470 860 315" />
                <path d="M160 310 C340 470 450 410 520 270" />
              </svg>
              <div className="dv-risk-node rn-a"><small>DOMAIN</small><strong>7 gün</strong></div>
              <div className="dv-risk-node rn-b critical"><small>FORM ACTION</small><strong>pay-gateway.example</strong></div>
              <div className="dv-risk-node rn-c"><small>REDIRECT</small><strong>3 host</strong></div>
              <div className="dv-risk-node rn-d critical"><small>POLICY</small><strong>eksik</strong></div>
            </div>

            <motion.div className="dv-evidence-world" style={prefersReducedMotion ? undefined : { scale: evidenceScale }}>
              <div className="dv-evidence-score"><span>23</span><small>/100</small><b>YÜKSEK GÖZLEMLENEN RİSK</b></div>
              <div className="dv-evidence-bars">
                <article><span>Form davranışı</span><i><b style={{ width: "92%" }} /></i><em>−22</em></article>
                <article><span>Domain geçmişi</span><i><b style={{ width: "76%" }} /></i><em>−18</em></article>
                <article><span>Redirect zinciri</span><i><b style={{ width: "58%" }} /></i><em>−11</em></article>
                <article className="positive"><span>TLS doğrulaması</span><i><b style={{ width: "38%" }} /></i><em>+8</em></article>
              </div>
              <div className="dv-confidence"><span>KANIT GÜVENİ</span><strong>%87</strong><small>Bilinmeyen veri puanı otomatik düşürmez.</small></div>
            </motion.div>

            <div className="dv-final-world">
              <p className="dv-kicker"><i /> SON KATMAN</p>
              <h3>Kendi URL&apos;ni şimdi gerçekten tara.</h3>
              <form onSubmit={submitFinal}>
                <span>https://</span>
                <input value={finalUrl} onChange={(event) => setFinalUrl(event.target.value)} placeholder="siteadresin.com" aria-label="Canlı analiz URL" />
                <button type="submit">Analizi başlat ↗</button>
              </form>
              <div className="dv-final-foot"><span>DNS</span><i /><span>TLS</span><i /><span>HTTP</span><i /><span>HTML</span><i /><span>SCORE</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="dv-proof">
        <div className="dv-proof-intro">
          <p className="dv-kicker"><i /> PROBLEM GERÇEK</p>
          <h2>Güven hissi değil, doğrulanabilir bağlam.</h2>
          <p>İstatistik kartlarında sahte sayaç kullanmıyoruz. Yıl ve kaynak doğrudan kullanıcıya açık.</p>
        </div>
        <div className="dv-stats">
          {sourceStats.map((stat, index) => (
            <motion.a
              href={stat.sourceUrl}
              target="_blank"
              rel="noreferrer"
              key={`${stat.value}-${stat.label}`}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12%" }}
              transition={{ delay: index * 0.08, duration: 0.55 }}
            >
              <small>{stat.year} · Kaynağı aç ↗</small>
              <strong>{stat.value}</strong>
              <h3>{stat.label}</h3>
              <p>{stat.detail}</p>
            </motion.a>
          ))}
        </div>
      </section>

      <footer className="dv-footer">
        <div><span className="dv-brandmark">G</span><strong>GüvenilirMi</strong></div>
        <p>AI tahmini değil. Ölçülebilir teknik sinyaller.</p>
        <a href="/analiz">Canlı analize geç ↗</a>
      </footer>
    </main>
  );
}
