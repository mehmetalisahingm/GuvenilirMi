"use client";

import { PointerEvent, useMemo, useState } from "react";

type SignalKey = "tls" | "age" | "redirect" | "form" | "headers";

type Signal = {
  key: SignalKey;
  label: string;
  detail: string;
  impact: number;
  kind: "positive" | "negative";
};

const signals: Signal[] = [
  { key: "tls", label: "TLS doğrulandı", detail: "Sertifika zinciri geçerli ve hostname eşleşiyor.", impact: 8, kind: "positive" },
  { key: "age", label: "Domain 7 günlük", detail: "Çok yeni kayıt, diğer risklerle beraber kuvvetlenir.", impact: -18, kind: "negative" },
  { key: "redirect", label: "3 hostname redirect", detail: "Kullanıcı farklı origin'ler arasında taşınıyor.", impact: -11, kind: "negative" },
  { key: "form", label: "Harici form hedefi", detail: "Form verisi mevcut hostname dışına gönderiliyor.", impact: -22, kind: "negative" },
  { key: "headers", label: "Güçlü security headers", detail: "Temel tarayıcı güvenlik politikaları gözlemleniyor.", impact: 7, kind: "positive" },
];

const layers = [
  ["DNS", "A kaydı", "104.21.14.33", "PUBLIC NETWORK"],
  ["TLS", "Issuer", "Let's Encrypt R13", "VALID CHAIN"],
  ["HTTP", "Redirect", "3 hostname", "CROSS ORIGIN"],
  ["RDAP", "Created", "7 days ago", "NEW DOMAIN"],
  ["HTML", "form[action]", "pay-gateway.example", "EXTERNAL TARGET"],
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function TrustPlayground() {
  const [cursor, setCursor] = useState({ x: 50, y: 48 });
  const [active, setActive] = useState<SignalKey[]>(signals.map((signal) => signal.key));
  const [layer, setLayer] = useState(2);
  const [scenario, setScenario] = useState<"safe" | "risk">("risk");

  const score = useMemo(() => {
    const base = scenario === "safe" ? 76 : 66;
    const impact = signals
      .filter((signal) => active.includes(signal.key))
      .reduce((total, signal) => total + (scenario === "safe" && signal.kind === "negative" ? Math.round(signal.impact * .22) : signal.impact), 0);
    return clamp(base + impact, 0, 100);
  }, [active, scenario]);

  function moveLens(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setCursor({
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 4, 96),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 6, 94),
    });
  }

  function toggleSignal(key: SignalKey) {
    setActive((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }

  return (
    <section className="tp-shell" aria-label="Etkileşimli güven laboratuvarı">
      <header className="tp-intro">
        <p><span /> INTERACTIVE TRUST LAB</p>
        <h2>Güveni sadece gösterme. <em>Parçala, değiştir, test et.</em></h2>
        <div>
          <strong>03</strong>
          <span>canlı deney</span>
        </div>
      </header>

      <article className="tp-experiment tp-microscope">
        <div className="tp-copy">
          <span>EXPERIMENT 01 / RISK MICROSCOPE</span>
          <h3>İmleci yüzeyde gezdir.</h3>
          <p>Risk tek bir noktada yaşamaz. Lens hareket ettikçe görünmeyen bağlantılar, origin değişimleri ve form hedefleri ortaya çıkar.</p>
          <div className="tp-mini-readout">
            <small>SCAN POSITION</small>
            <b>{cursor.x.toFixed(0)} : {cursor.y.toFixed(0)}</b>
          </div>
        </div>

        <div className="tp-map" onPointerMove={moveLens}>
          <div className="tp-map-grid" />
          <svg viewBox="0 0 1000 650" preserveAspectRatio="none" aria-hidden="true">
            <path d="M90 500 C240 420 260 190 430 240 S650 520 830 315 940 165 980 160" />
            <path d="M120 150 C250 250 335 90 470 165 S650 400 920 490" />
            <path className="danger" d="M240 530 C410 470 405 320 570 340 S720 190 920 215" />
          </svg>
          {[
            [16,71,"DNS"], [31,34,"TLS"], [47,52,"HTTP"], [63,27,"FORM"], [76,64,"RDAP"], [88,38,"PAY"],
          ].map(([x,y,label]) => (
            <span className={label === "FORM" || label === "PAY" ? "tp-node danger" : "tp-node"} style={{ left: `${x}%`, top: `${y}%` }} key={label}>{label}</span>
          ))}
          <div className="tp-lens" style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}>
            <i />
            <span>LIVE TRACE</span>
          </div>
          <div className="tp-map-caption"><span>kampanya-firsat.example</span><b>6 linked signals</b></div>
        </div>
      </article>

      <article className="tp-experiment tp-composer">
        <div className="tp-composer-head">
          <div>
            <span>EXPERIMENT 02 / SCORE COMPOSER</span>
            <h3>Skoru kendin oluştur.</h3>
          </div>
          <div className="tp-scenario-switch" role="group" aria-label="Senaryo">
            <button className={scenario === "safe" ? "active" : ""} onClick={() => setScenario("safe")}>Temiz senaryo</button>
            <button className={scenario === "risk" ? "active danger" : ""} onClick={() => setScenario("risk")}>Riskli senaryo</button>
          </div>
        </div>

        <div className="tp-composer-body">
          <div className={`tp-live-score ${score < 45 ? "danger" : score < 70 ? "amber" : "safe"}`}>
            <small>LIVE TRUST SCORE</small>
            <strong>{score}</strong>
            <span>/100</span>
            <div className="tp-score-orbit"><i /><i /><i /></div>
            <p>{score < 45 ? "Kuvvetli risk sinyalleri" : score < 70 ? "Karışık teknik sinyaller" : "Düşük gözlemlenen teknik risk"}</p>
          </div>

          <div className="tp-signals">
            {signals.map((signal) => {
              const enabled = active.includes(signal.key);
              return (
                <button className={`${enabled ? "active" : ""} ${signal.kind}`} onClick={() => toggleSignal(signal.key)} key={signal.key}>
                  <span className="tp-toggle"><i /></span>
                  <span className="tp-signal-copy"><b>{signal.label}</b><small>{signal.detail}</small></span>
                  <strong>{signal.impact > 0 ? `+${signal.impact}` : signal.impact}</strong>
                </button>
              );
            })}
          </div>
        </div>
      </article>

      <article className="tp-experiment tp-evidence">
        <div className="tp-copy">
          <span>EXPERIMENT 03 / EVIDENCE STACK</span>
          <h3>Raporun kabuğunu soy.</h3>
          <p>Her katman farklı bir teknik soruyu cevaplar. Katmana tıkla; ham kanıtı ve yorumlanan sinyali aynı yerde gör.</p>
        </div>

        <div className="tp-stack-wrap">
          <div className="tp-stack">
            {layers.map((item, index) => (
              <button
                key={item[0]}
                className={index === layer ? "active" : ""}
                onClick={() => setLayer(index)}
                style={{ "--stack-index": index } as React.CSSProperties}
              >
                <small>{String(index + 1).padStart(2, "0")}</small>
                <strong>{item[0]}</strong>
                <span>{item[3]}</span>
              </button>
            ))}
          </div>
          <div className="tp-terminal">
            <div className="tp-terminal-top"><i /><i /><i /><span>evidence://{layers[layer][0].toLowerCase()}</span></div>
            <div className="tp-terminal-body">
              <small>{layers[layer][0]} SIGNAL</small>
              <h4>{layers[layer][1]}</h4>
              <strong>{layers[layer][2]}</strong>
              <div className="tp-code-lines">
                <span style={{ width: "88%" }} /><span style={{ width: "64%" }} /><span style={{ width: "76%" }} /><span style={{ width: "48%" }} />
              </div>
              <p>Bu ham veri tek başına hüküm değildir; diğer teknik sinyallerle birlikte skor motoruna girer.</p>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
