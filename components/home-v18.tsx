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

const VILLA_IMAGE =
  "https://images.unsplash.com/photo-1747512281554-1e259aab3cd2?auto=format&fit=crop&w=2200&q=86";

const stages = [
  {
    no: "01",
    label: "BROWSER",
    title: "Site açılır.",
    copy: "Önce ziyaretçinin gördüğünü görürüz. Güzel fotoğraf, güven veren marka, kusursuz rezervasyon ekranı.",
  },
  {
    no: "02",
    label: "X-RAY",
    title: "Arayüz susar. Davranış konuşur.",
    copy: "Görsel katmanı geri çekeriz; form hedefi, domain yaşı, yönlendirmeler ve güvenlik başlıkları görünür olur.",
  },
  {
    no: "03",
    label: "TRACE",
    title: "Ödeme başka yere gidiyor.",
    copy: "Rezervasyon formu sitenin kendi origin'inden ayrılıyor. Tek başına karar değil; ama güçlü ve açıklanabilir bir sinyal.",
  },
  {
    no: "04",
    label: "BREACH VIEW",
    title: "Normal görünen sayfa parçalanır.",
    copy: "İlişkili riskler tek sahnede birleşir. Redirect, yeni domain ve harici form hedefi artık ayrı kutular değil; aynı hikâyenin parçalarıdır.",
  },
  {
    no: "05",
    label: "EVIDENCE",
    title: "Skor en son gelir.",
    copy: "Önce kanıt. Sonra ağırlık. En son 0–100 skor. Bilinmeyen sinyal otomatik olarak risk sayılmaz.",
  },
  {
    no: "06",
    label: "LIVE",
    title: "Şimdi gerçek URL.",
    copy: "Demo bitti. Aynı deterministik tarayıcı gerçek siteyi analiz etmeye hazır.",
  },
] as const;

function goToAnalysis(raw: string) {
  const value = raw.trim();
  if (!value) return;
  window.location.assign(`/analiz?url=${encodeURIComponent(value)}`);
}

function BrowserChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="gv-browser">
      <div className="gv-browser-tabs">
        <div className="gv-lights"><i /><i /><i /></div>
        <div className="gv-active-tab"><span>◇</span><b>AURELIA — Private Stays</b><i>×</i></div>
        <span className="gv-new-tab">＋</span>
      </div>
      <div className="gv-addressbar">
        <div className="gv-browser-controls"><span>‹</span><span>›</span><span>↻</span></div>
        <div className="gv-address"><i>⌁</i><span>https://aurelia-stays.example</span><b>•••</b></div>
        <div className="gv-browser-actions"><span>☆</span><span>◌</span></div>
      </div>
      <div className="gv-page">{children}</div>
    </div>
  );
}

function BookingSite({ mode = "normal" }: { mode?: "normal" | "xray" | "breach" }) {
  return (
    <div className={`gv-booking gv-mode-${mode}`}>
      <div className="gv-villa-photo" style={{ backgroundImage: `url("${VILLA_IMAGE}")` }} />
      <div className="gv-villa-shade" />

      <header className="gv-site-nav">
        <strong>AURELIA</strong>
        <nav><span>Stays</span><span>Journal</span><span>Concierge</span></nav>
        <div><span>TR</span><button type="button">Reserve</button></div>
      </header>

      <div className="gv-villa-copy">
        <small>MEDITERRANEAN / PRIVATE STAY 07</small>
        <h3>Somewhere<br />slower.</h3>
        <p>Seven quiet nights above the sea. Private pool, private transfer, no itinerary required.</p>
      </div>

      <div className="gv-booking-card">
        <small>PRIVATE STAY</small>
        <strong>Serene House 07</strong>
        <div className="gv-booking-fields">
          <label><span>CHECK IN</span><b>18 SEP</b></label>
          <label><span>NIGHTS</span><b>07</b></label>
          <label><span>GUESTS</span><b>02</b></label>
        </div>
        <div className="gv-price"><span>Total</span><b>€4,860</b></div>
        <button type="button">Continue to payment</button>
      </div>

      <div className="gv-site-footer"><span>36.3932° N</span><i /><span>25.4615° E</span></div>

      {mode !== "normal" && (
        <>
          <div className="gv-xray-grid" />
          <div className="gv-risk-tag gv-risk-domain"><small>DOMAIN AGE</small><b>7 DAYS</b><em>NEW</em></div>
          <div className="gv-risk-tag gv-risk-form"><small>FORM ACTION</small><b>pay-gateway.example</b><em>EXTERNAL</em></div>
          <div className="gv-risk-tag gv-risk-redirect"><small>REDIRECT</small><b>3 HOSTS</b><em>CHAIN</em></div>
          <div className="gv-risk-tag gv-risk-csp"><small>CONTENT SECURITY</small><b>CSP missing</b><em>WARN</em></div>
          <svg className="gv-traces" viewBox="0 0 1200 720" preserveAspectRatio="none" aria-hidden="true">
            <path d="M190 145 C320 130 440 210 598 365" />
            <path d="M1040 155 C865 150 760 220 598 365" />
            <path d="M1060 580 C840 560 740 470 598 365" />
            <path d="M170 575 C360 560 480 465 598 365" />
          </svg>
          <div className="gv-trace-core"><small>CHECKOUT</small><strong>→</strong><b>external origin</b></div>
        </>
      )}

      {mode === "breach" && (
        <>
          <div className="gv-breach-wash" />
          <div className="gv-slice s1" />
          <div className="gv-slice s2" />
          <div className="gv-slice s3" />
          <div className="gv-alert"><i>!</i><b>TRUST X-RAY ACTIVE</b><span>4 correlated signals</span></div>
          <div className="gv-rain" aria-hidden="true">
            {Array.from({ length: 18 }).map((_, index) => (
              <i key={index}>{index % 3 === 0 ? "FORM→EXT" : index % 3 === 1 ? "302→HOST" : "AGE:7D"}</i>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LaptopPhoto() {
  return (
    <div className="gv-photo-device" aria-hidden="true">
      <div className="gv-photo-vignette" />
      <img
        src="https://images.unsplash.com/photo-1542393545-10f5cde2c810?auto=format&fit=crop&w=1800&q=86"
        alt=""
      />
      <div className="gv-photo-caption"><span>LOCAL SESSION</span><b>09:41</b></div>
      <div className="gv-mini-window">
        <div className="gv-mini-bar"><i /><i /><i /><span>aurelia-stays.example</span></div>
        <div className="gv-mini-site" style={{ backgroundImage: `url("${VILLA_IMAGE}")` }}>
          <b>AURELIA</b>
          <span>Somewhere slower.</span>
        </div>
      </div>
    </div>
  );
}

function EvidenceCard() {
  return (
    <div className="gv-evidence">
      <div className="gv-score-side">
        <small>TECHNICAL TRUST SCORE</small>
        <div><strong>23</strong><span>/100</span></div>
        <b>HIGH OBSERVED RISK</b>
        <p>coverage 92% · confidence high</p>
      </div>
      <div className="gv-breakdown">
        <article><span>External checkout target</span><i><b style={{ width: "96%" }} /></i><em>−22</em></article>
        <article><span>Domain age</span><i><b style={{ width: "79%" }} /></i><em>−18</em></article>
        <article><span>Redirect chain</span><i><b style={{ width: "58%" }} /></i><em>−11</em></article>
        <article className="good"><span>TLS verification</span><i><b style={{ width: "36%" }} /></i><em>+8</em></article>
        <div className="gv-evidence-note">
          <b>UNKNOWN ≠ RISK</b>
          <span>Ölçülemeyen sinyal otomatik eksi puan almaz.</span>
        </div>
      </div>
    </div>
  );
}

export function HomeV18() {
  const storyRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [url, setUrl] = useState("");

  const { scrollYProgress } = useScroll({
    target: storyRef,
    offset: ["start start", "end end"],
  });

  const deviceOpacity = useTransform(scrollYProgress, [0, .10, .20], [1, 1, 0]);
  const deviceScale = useTransform(scrollYProgress, [0, .10, .20], [1, 1.04, 1.12]);
  const browserOpacity = useTransform(scrollYProgress, [.08, .18, .46], [0, 1, 1]);
  const browserScale = useTransform(scrollYProgress, [.08, .18, .32], [.36, .72, 1]);
  const xrayOpacity = useTransform(scrollYProgress, [.27, .38, .54], [0, 1, 1]);
  const breachOpacity = useTransform(scrollYProgress, [.47, .58, .73], [0, 1, 1]);
  const evidenceOpacity = useTransform(scrollYProgress, [.69, .79, .90], [0, 1, 1]);
  const evidenceScale = useTransform(scrollYProgress, [.69, .81, .90], [.90, 1, 1.02]);
  const liveOpacity = useTransform(scrollYProgress, [.87, .95, 1], [0, 1, 1]);
  const liveScale = useTransform(scrollYProgress, [.87, .97], [.94, 1]);
  const progress = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = Math.min(stages.length - 1, Math.floor(value * stages.length));
    setStage((current) => (current === next ? current : next));
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    goToAnalysis(url);
  }

  return (
    <main className="gv-home">
      <div className="gv-grain" aria-hidden="true" />
      <header className="gv-nav">
        <Link href="/" className="gv-brand"><span>✓</span><b>GüvenilirMi</b></Link>
        <div className="gv-nav-center">EXPLAINABLE TRUST ENGINE</div>
        <Link href="/analiz" className="gv-nav-link">Site tara <span>↗</span></Link>
      </header>

      <section className="gv-story" ref={storyRef}>
        <div className={`gv-sticky gv-stage-${stage}`}>
          <motion.div className="gv-progress" style={{ width: progress }} />

          <div className="gv-intro">
            <p><i /> SITE TRUST / TECHNICAL EVIDENCE</p>
            <h1>Bir siteye<br />güvenmeden<br /><em>önce içine bak.</em></h1>
            <span>Görünüşe değil davranışa bak. DNS, TLS, redirect, form hedefleri ve sayfa sinyalleri tek akışta.</span>
            <form onSubmit={submit}>
              <b>https://</b>
              <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="ornek-site.com" />
              <button type="submit">Analiz et ↗</button>
            </form>
          </div>

          <AnimatePresence mode="wait">
            <motion.aside
              key={stages[stage].no}
              className="gv-stage-copy"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: .32 }}
            >
              <p><b>{stages[stage].no}</b><i />{stages[stage].label}</p>
              <h2>{stages[stage].title}</h2>
              <span>{stages[stage].copy}</span>
            </motion.aside>
          </AnimatePresence>

          <div className="gv-scene">
            <div className="gv-layer gv-device-layer">
              <motion.div style={prefersReducedMotion ? undefined : { opacity: deviceOpacity, scale: deviceScale }}>
                <LaptopPhoto />
              </motion.div>
            </div>

            <div className="gv-layer gv-browser-layer">
              <motion.div className="gv-frame" style={prefersReducedMotion ? undefined : { opacity: browserOpacity, scale: browserScale }}>
                <BrowserChrome><BookingSite mode="normal" /></BrowserChrome>
              </motion.div>
            </div>

            <div className="gv-layer gv-xray-layer">
              <motion.div className="gv-frame" style={{ opacity: xrayOpacity }}>
                <BrowserChrome><BookingSite mode="xray" /></BrowserChrome>
              </motion.div>
            </div>

            <div className="gv-layer gv-breach-layer">
              <motion.div className="gv-frame" style={{ opacity: breachOpacity }}>
                <BrowserChrome><BookingSite mode="breach" /></BrowserChrome>
              </motion.div>
            </div>

            <div className="gv-layer gv-evidence-layer">
              <motion.div style={prefersReducedMotion ? undefined : { opacity: evidenceOpacity, scale: evidenceScale }}>
                <EvidenceCard />
              </motion.div>
            </div>

            <div className="gv-layer gv-live-layer">
              <motion.form
                className="gv-live"
                onSubmit={submit}
                style={prefersReducedMotion ? undefined : { opacity: liveOpacity, scale: liveScale }}
              >
                <small>LIVE ANALYSIS / REAL ENGINE</small>
                <h3>Şimdi senin URL'in.</h3>
                <p>Demo burada biter. Aynı deterministik scanner gerçek siteyi ölçer.</p>
                <div>
                  <b>https://</b>
                  <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="ornek-site.com" />
                  <button type="submit">Analiz et ↗</button>
                </div>
                <footer><span>AI yok</span><i /><span>hesap gerekmez</span><i /><span>açıklanabilir skor</span></footer>
              </motion.form>
            </div>
          </div>

          <div className="gv-stage-rail">
            {stages.map((item, index) => <i key={item.no} className={index === stage ? "active" : ""} />)}
          </div>
        </div>
      </section>

      <section className="gv-after">
        <p>GÜVENİRLİMİ / TECHNICAL TRUST ENGINE</p>
        <h2>Görünüşü değil.<br /><em>davranışı incele.</em></h2>
        <Link href="/analiz">Canlı analize başla ↗</Link>
      </section>
    </main>
  );
}
