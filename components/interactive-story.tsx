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

type Tone = "safe" | "danger" | "deep";

type DemoStage = {
  label: string;
  heading: string;
  copy: string;
  domain: string;
  score: number;
  verdict: string;
  tone: Tone;
  signals: Array<{
    label: string;
    value: string;
    impact: string;
    state: "pass" | "warn" | "fail";
  }>;
};

const demoStages: DemoStage[] = [
  {
    label: "01 · YÜZEY",
    heading: "Önce görüneni ölç.",
    copy: "Bağlantı güvenliği, sertifika, yönlendirme zinciri ve temel web sinyalleri ilk katmanda görünür hale gelir.",
    domain: "guvenilirmi.com",
    score: 94,
    verdict: "Düşük gözlemlenen teknik risk",
    tone: "safe",
    signals: [
      { label: "HTTPS / TLS", value: "Doğrulandı", impact: "+8", state: "pass" },
      { label: "Redirect zinciri", value: "Temiz", impact: "+5", state: "pass" },
      { label: "Security headers", value: "Güçlü", impact: "+7", state: "pass" },
      { label: "Form hedefleri", value: "Aynı domain", impact: "+4", state: "pass" },
    ],
  },
  {
    label: "02 · DAVRANIŞ",
    heading: "Sonra şüpheli izi aç.",
    copy: "Yeni domain, farklı hedefe giden form, eksik politikalar ve çoklu yönlendirmeler birlikte değerlendirildiğinde risk görünür olur.",
    domain: "kampanya-firsat.example",
    score: 23,
    verdict: "Birden fazla kuvvetli risk sinyali",
    tone: "danger",
    signals: [
      { label: "Domain yaşı", value: "7 gün", impact: "−18", state: "warn" },
      { label: "Ödeme formu", value: "Harici hedef", impact: "−22", state: "fail" },
      { label: "CSP", value: "Bulunamadı", impact: "−6", state: "warn" },
      { label: "Redirect zinciri", value: "3 domain", impact: "−11", state: "fail" },
    ],
  },
  {
    label: "03 · KANIT",
    heading: "En son kararın içini göster.",
    copy: "Kırmızı ya da yeşil bir rozet bırakmıyoruz. Kullanıcı puanın hangi kanıtlardan oluştuğunu ve hangi verinin bilinmediğini görebiliyor.",
    domain: "kampanya-firsat.example",
    score: 23,
    verdict: "Skor açıklanabilir kanıtlardan oluşur",
    tone: "deep",
    signals: [
      { label: "Domain sinyali", value: "Kuvvetli risk", impact: "−18", state: "warn" },
      { label: "Form davranışı", value: "Kritik", impact: "−22", state: "fail" },
      { label: "TLS", value: "Doğrulandı", impact: "+8", state: "pass" },
      { label: "Bilinmeyen veri", value: "Ceza yok", impact: "0", state: "pass" },
    ],
  },
];

const trustBlocks = [
  ["01 · ÜCRETSİZ", "API anahtarı istemez", "İlk ürün akışı ücretli model veya LLM servisine bağlı değil."],
  ["02 · AÇIKLANABİLİR", "Her puanın nedeni var", "Artı ve eksi sinyaller raporda ayrı ayrı görülebilir."],
  ["03 · GÜVENLİ", "SSRF koruması temel özellik", "Özel ağlar, localhost ve şüpheli yönlendirmeler tarayıcı tarafından engellenir."],
  ["04 · SINIRLI İDDİA", "Sertifika değil, risk analizi", "Ürün hiçbir siteye mutlak güvenlik garantisi vermez."],
];

const labCards = [
  ["DNS", "Alan adı izi", "Public IP, nameserver ve çözümleme yapısı ölçülür.", "NETWORK SIGNAL"],
  ["TLS", "Bağlantı sağlığı", "Sertifika doğrulaması, protokol ve kalan süre görünür hale gelir.", "TRANSPORT SIGNAL"],
  ["HTTP", "Yönlendirme davranışı", "Zincirin kaç adım sürdüğü ve hostname değişimleri takip edilir.", "ROUTING SIGNAL"],
  ["HTML", "Sayfa davranışı", "Form hedefleri, parola alanları, script ve iframe ilişkileri incelenir.", "CONTENT SIGNAL"],
];

function goToAnalysis(raw: string) {
  const value = raw.trim();
  if (!value) return;
  window.location.href = `/analiz?url=${encodeURIComponent(value)}`;
}

export function InteractiveStory() {
  const prefersReducedMotion = useReducedMotion();
  const storyRef = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(0);
  const [heroUrl, setHeroUrl] = useState("");
  const [finalUrl, setFinalUrl] = useState("");

  const { scrollYProgress } = useScroll({
    target: storyRef,
    offset: ["start start", "end end"],
  });

  const deviceScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.91, 1.02, 0.94]);
  const deviceY = useTransform(scrollYProgress, [0, 0.5, 1], [20, -10, 15]);
  const deviceRotate = useTransform(scrollYProgress, [0, 0.5, 1], [5, 0, -4]);
  const railHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = value < 0.34 ? 0 : value < 0.69 ? 1 : 2;
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

  const current = demoStages[stage];

  return (
    <main className="gm-home">
      <div className="gm-noise" aria-hidden="true" />

      <header className="gm-nav">
        <a className="gm-brand" href="#top" aria-label="GüvenilirMi ana sayfa">
          <span className="gm-brandmark">G</span>
          <span>GüvenilirMi</span>
        </a>
        <nav className="gm-navlinks" aria-label="Ana navigasyon">
          <a href="#demo">Demo</a>
          <a href="#sinyaller">Sinyaller</a>
          <a href="#veri">Veri</a>
          <a href="#motor">Motor</a>
        </nav>
        <div className="gm-navright">
          <span className="gm-navdot" />
          <span>AI yok · ölçülebilir sinyaller</span>
          <a className="gm-navcta" href="/analiz">Canlı analiz ↗</a>
        </div>
      </header>

      <section className="gm-hero" id="top">
        <div className="gm-hero-inner">
          <motion.div
            className="gm-hero-copy"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="gm-eyebrow"><i /> Tıklamadan önce teknik izi gör</p>
            <h1>
              Bir site gerçekten
              <em>güvenilir mi?</em>
            </h1>
            <p className="gm-hero-lead">
              Bir URL ver. DNS&apos;ten TLS&apos;e, yönlendirmeden sayfa davranışına kadar ölçülebilir sinyalleri tek raporda gör.
            </p>

            <form className="gm-search" onSubmit={submitHero}>
              <span className="gm-search-prefix">https://</span>
              <input
                value={heroUrl}
                onChange={(event) => setHeroUrl(event.target.value)}
                placeholder="ornek-site.com"
                aria-label="Analiz edilecek site"
                autoComplete="url"
                spellCheck={false}
              />
              <button type="submit">Güvenilir mi? <span>↗</span></button>
            </form>
            <div className="gm-hero-micro">
              <span><i /> Hesap gerekmez</span>
              <span><i /> LLM kullanılmaz</span>
              <span><i /> Sonuç açıklanabilir</span>
            </div>
          </motion.div>

          <motion.div
            className="gm-device-stage"
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.94, y: 35 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="gm-stage-halo" aria-hidden="true" />
            <div className="gm-stage-ring" aria-hidden="true" />
            <motion.div
              className="gm-float-card gm-float-a"
              animate={prefersReducedMotion ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <small>TLS CERTIFICATE</small><strong>Doğrulandı</strong><span>+8 güven sinyali</span>
            </motion.div>
            <motion.div
              className="gm-float-card gm-float-b"
              animate={prefersReducedMotion ? undefined : { y: [0, 9, 0], x: [0, 4, 0] }}
              transition={{ duration: 6.3, repeat: Infinity, ease: "easeInOut" }}
            >
              <small>DOMAIN AGE</small><strong>1.248 gün</strong><span>istikrarlı geçmiş</span>
            </motion.div>
            <motion.div
              className="gm-float-card gm-float-c gm-float-amber"
              animate={prefersReducedMotion ? undefined : { y: [0, 8, 0] }}
              transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <small>REDIRECT</small><strong>0 hostname değişimi</strong><span>zincir temiz</span>
            </motion.div>
            <motion.div
              className="gm-float-card gm-float-d"
              animate={prefersReducedMotion ? undefined : { y: [0, -8, 0], x: [0, -4, 0] }}
              transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <small>FORM ACTION</small><strong>Aynı origin</strong><span>hedef tutarlı</span>
            </motion.div>
            <MacDevice mode="hero" />
          </motion.div>
        </div>
      </section>

      <section className="gm-trust-strip" aria-label="Ürün ilkeleri">
        {trustBlocks.map(([index, title, copy]) => (
          <article key={index}>
            <small>{index}</small>
            <strong>{title}</strong>
            <p>{copy}</p>
          </article>
        ))}
      </section>

      <section className="gm-story" ref={storyRef} id="demo">
        <div className="gm-story-sticky">
          <div className="gm-story-copy">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.label}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -16 }}
                transition={{ duration: 0.4 }}
              >
                <span className="gm-stage-num">0{stage + 1}</span>
                <p className="gm-stage-label">{current.label}</p>
                <h2>{current.heading}</h2>
                <p>{current.copy}</p>
              </motion.div>
            </AnimatePresence>
            <div className="gm-story-tabs" aria-hidden="true">
              {demoStages.map((item, index) => (
                <span className={index === stage ? "gm-story-tab active" : "gm-story-tab"} key={item.label} />
              ))}
            </div>
          </div>

          <motion.div
            className="gm-story-device"
            style={prefersReducedMotion ? undefined : { scale: deviceScale, y: deviceY, rotateX: deviceRotate }}
          >
            <div className={`gm-story-light ${current.tone}`} aria-hidden="true" />
            <StoryMac stage={current} />
          </motion.div>

          <div className="gm-story-rail" aria-hidden="true"><motion.i style={{ height: railHeight }} /></div>
        </div>
      </section>

      <section className="gm-section" id="sinyaller">
        <div className="gm-section-head">
          <div>
            <p className="gm-eyebrow"><i /> Tek rozet değil, çok katmanlı kanıt</p>
            <h2>Güvenin arkasındaki teknik laboratuvar.</h2>
          </div>
          <p>
            “HTTPS var” tek başına güvenilirlik anlamına gelmez. GüvenilirMi birbirinden bağımsız sinyalleri toplar, ağırlıklandırır ve sonucu kullanıcıya açıklayabilir halde sunar.
          </p>
        </div>

        <div className="gm-lab-grid">
          {labCards.map(([code, title, copy, footer], index) => (
            <motion.article
              className="gm-lab-card"
              key={code}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12%" }}
              whileHover={prefersReducedMotion ? undefined : { y: -8 }}
              transition={{ duration: 0.5, delay: index * 0.06 }}
            >
              <span>{code}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
              <footer>{footer}<i /></footer>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="gm-data" id="veri">
        <div className="gm-data-inner">
          <div className="gm-data-copy">
            <p className="gm-eyebrow"><i /> Problem gerçek</p>
            <h2>İddia değil. Kaynaklı veri.</h2>
            <p>
              Güven ürünü önce kendi söylemini kanıtlamalı. Bu yüzden gösterdiğimiz problem verileri yıl ve kaynak bilgisiyle birlikte açılabilir.
            </p>
          </div>
          <div className="gm-stats">
            {sourceStats.map((stat, index) => (
              <motion.a
                className="gm-stat"
                href={stat.sourceUrl}
                target="_blank"
                rel="noreferrer"
                key={`${stat.value}-${stat.label}`}
                initial={prefersReducedMotion ? false : { opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-12%" }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <strong className="gm-stat-value">{stat.value}</strong>
                <div>
                  <h3>{stat.label}</h3>
                  <p>{stat.detail}</p>
                  <small>{stat.year} · {stat.sourceLabel}</small>
                </div>
                <span className="gm-stat-arrow">↗</span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      <section className="gm-engine" id="motor">
        <div className="gm-engine-visual" aria-hidden="true">
          <motion.div
            className="gm-engine-core"
            animate={prefersReducedMotion ? undefined : { boxShadow: ["0 0 70px rgba(73,201,112,.08)", "0 0 115px rgba(73,201,112,.19)", "0 0 70px rgba(73,201,112,.08)"] }}
            transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <div><strong>SCORE</strong><small>DETERMINISTIC</small></div>
          </motion.div>
          <motion.span className="gm-node gm-node-a" animate={prefersReducedMotion ? undefined : { y: [0,-9,0] }} transition={{ duration:5,repeat:Infinity }}>DNS</motion.span>
          <motion.span className="gm-node gm-node-b" animate={prefersReducedMotion ? undefined : { y: [0,8,0] }} transition={{ duration:5.6,repeat:Infinity }}>TLS</motion.span>
          <motion.span className="gm-node gm-node-c" animate={prefersReducedMotion ? undefined : { x: [0,-7,0] }} transition={{ duration:6.1,repeat:Infinity }}>HTTP</motion.span>
          <motion.span className="gm-node gm-node-d" animate={prefersReducedMotion ? undefined : { x: [0,7,0] }} transition={{ duration:5.4,repeat:Infinity }}>HTML</motion.span>
          <motion.span className="gm-node gm-node-e" animate={prefersReducedMotion ? undefined : { y: [0,-6,0] }} transition={{ duration:6.3,repeat:Infinity }}>RDAP</motion.span>
          <motion.span className="gm-node gm-node-f" animate={prefersReducedMotion ? undefined : { y: [0,7,0] }} transition={{ duration:5.8,repeat:Infinity }}>HEADERS</motion.span>
        </div>

        <div className="gm-engine-copy">
          <p className="gm-eyebrow"><i /> Motorun içinde</p>
          <h2>Model tahmini yok. Kurallar var.</h2>
          <p>
            Aynı teknik bulgular aynı sonucu üretir. Bilinmeyen veri otomatik suçlama sayılmaz ve her ağırlık kullanıcıya açıklanabilir.
          </p>
          <div className="gm-engine-list">
            <div><span>✓</span><b>Public hedef doğrulama</b><small>SSRF guard</small></div>
            <div><span>✓</span><b>DNS + RDAP çözümleme</b><small>domain context</small></div>
            <div><span>✓</span><b>TLS + redirect analizi</b><small>transport context</small></div>
            <div><span>✓</span><b>HTML davranış sinyalleri</b><small>content context</small></div>
            <div><span>✓</span><b>Açıklanabilir skor</b><small>0–100 + confidence</small></div>
          </div>
        </div>
      </section>

      <section className="gm-final">
        <div className="gm-final-grid" aria-hidden="true" />
        <div className="gm-final-content">
          <p className="gm-eyebrow"><i /> Şimdi gerçek siteyi tara</p>
          <h2>URL&apos;yi ver.<br />Kanıtı biz açalım.</h2>
          <p>Ücretsiz. Hesapsız. AI olmadan. Sonucun altında hangi sinyalin neden etkili olduğunu görebileceğin canlı teknik analiz.</p>
          <form className="gm-search" onSubmit={submitFinal}>
            <span className="gm-search-prefix">https://</span>
            <input
              value={finalUrl}
              onChange={(event) => setFinalUrl(event.target.value)}
              placeholder="kontrol-etmek-istedigin-site.com"
              aria-label="Analiz edilecek site"
              autoComplete="url"
              spellCheck={false}
            />
            <button type="submit">Analizi başlat <span>↗</span></button>
          </form>
          <p className="gm-final-note">GüvenilirMi bir güvenlik sertifikası değil; gözlemlenebilir teknik risk sinyallerini açıklayan bir karar destek aracıdır.</p>
        </div>
      </section>

      <footer className="gm-footer">
        <strong>GüvenilirMi</strong>
        <div><span>AI yok</span><span>Ücretli analiz API&apos;si yok</span><span>Açıklanabilir skor</span></div>
        <span>© 2026</span>
      </footer>
    </main>
  );
}

function MacDevice({ mode }: { mode: "hero" }) {
  return (
    <div className="gm-mac" data-mode={mode}>
      <div className="gm-mac-screen-shell">
        <div className="gm-mac-screen">
          <div className="gm-browser">
            <div className="gm-browser-top">
              <div className="gm-dots"><span /><span /><span /></div>
              <div className="gm-address">guvenilirmi.com</div>
              <div className="gm-browser-status">LIVE SCAN</div>
            </div>
            <div className="gm-screen-content">
              <div className="gm-screen-title">
                <small>TEKNİK GÜVEN ANALİZİ</small>
                <h3>guvenilirmi.com</h3>
                <p>7 bağımsız sinyal grubu tarandı.<br />Kritik risk bulunmadı.</p>
                <div className="gm-score-orb"><div><strong>94</strong><span>/ 100</span></div></div>
              </div>
              <div className="gm-screen-signals">
                <MiniSignal label="TLS sertifikası" value="Doğrulandı" impact="+8" />
                <MiniSignal label="Domain geçmişi" value="İstikrarlı" impact="+9" />
                <MiniSignal label="Yönlendirme" value="Temiz zincir" impact="+5" />
                <MiniSignal label="Form hedefleri" value="Aynı origin" impact="+4" />
              </div>
            </div>
            <div className="gm-screen-footer"><span>DNS</span><i /><span>TLS</span><i /><span>HTTP</span><i /><span>HTML</span><i /><span>SCORE</span></div>
            <div className="gm-screen-scanline" aria-hidden="true" />
          </div>
        </div>
      </div>
      <div className="gm-mac-base" />
      <div className="gm-mac-shadow" />
    </div>
  );
}

function MiniSignal({ label, value, impact }: { label: string; value: string; impact: string }) {
  return (
    <div className="gm-mini-signal">
      <span className="gm-mini-icon">✓</span>
      <div><small>{label}</small><b>{value}</b></div>
      <em>{impact}</em>
    </div>
  );
}

function StoryMac({ stage }: { stage: DemoStage }) {
  return (
    <div className="gm-mac">
      <div className="gm-mac-screen-shell">
        <div className={`gm-mac-screen ${stage.tone}`}>
          <div className="gm-demo-layout">
            <div className="gm-demo-left">
              <div>
                <div className="gm-demo-domain">{stage.domain}</div>
                <div className="gm-demo-kicker">GÖZLEMLENEN TEKNİK RİSK</div>
                <div className="gm-demo-score">{stage.score}<span>/100</span></div>
                <div className="gm-demo-verdict">{stage.verdict}</div>
              </div>
              <div className={`gm-demo-meter ${stage.tone}`}><i style={{ width: `${stage.score}%` }} /></div>
            </div>
            <div className="gm-demo-signals">
              {stage.signals.map((signal) => (
                <motion.div
                  layout
                  className={`gm-demo-signal ${signal.state}`}
                  key={`${stage.domain}-${signal.label}-${signal.value}`}
                >
                  <span>{signal.state === "pass" ? "✓" : signal.state === "warn" ? "!" : "×"}</span>
                  <div><small>{signal.label}</small><b>{signal.value}</b></div>
                  <em>{signal.impact}</em>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="gm-screen-scanline" aria-hidden="true" />
        </div>
      </div>
      <div className="gm-mac-base" />
      <div className="gm-mac-shadow" />
    </div>
  );
}
