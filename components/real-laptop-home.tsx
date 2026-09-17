"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { sourceStats } from "@/lib/stats";
import { TrustPlayground } from "@/components/trust-playground";

const MODEL_URL = "https://cdn.3dassets.dev/assets/26895/v1/model.glb";

const chapters = [
  { id: "01", label: "GERÇEK CİHAZ", title: "Bir site, ekranda masum görünür.", body: "Biz görünüşe değil ölçülebilir sinyallere bakıyoruz." },
  { id: "02", label: "EKRANIN İÇİ", title: "Tarayıcının içine gir.", body: "URL artık bir metin değil; DNS, TLS, HTTP ve domain geçmişine ayrılıyor." },
  { id: "03", label: "AĞ KATMANI", title: "Bağlantıları tek tek izle.", body: "Redirect zinciri, dış origin'ler ve form hedefleri görünür hale geliyor." },
  { id: "04", label: "RİSK HARİTASI", title: "Kırmızı olan şey dekor değil.", body: "Yalnızca ölçülen risk sinyalleri kırmızıya dönüyor." },
  { id: "05", label: "KANIT", title: "94 neden 94?", body: "Her puan artışı ve düşüşü bir kanıta bağlı." },
  { id: "06", label: "CANLI ANALİZ", title: "Şimdi kendi URL'ni tara.", body: "AI yok. Model tahmini yok. Açıklanabilir teknik sinyaller var." },
] as const;

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function createScreenTexture(mode: "safe" | "risk") {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context unavailable");

  const safe = mode === "safe";
  const accent = safe ? "#6ff2a0" : "#ff6d73";
  const glow = safe ? "rgba(70,255,137,.22)" : "rgba(255,70,84,.20)";

  ctx.fillStyle = "#060a08";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const grad = ctx.createRadialGradient(800, 500, 50, 800, 500, 760);
  grad.addColorStop(0, glow);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1600, 1000);

  ctx.fillStyle = "#0d1410";
  ctx.fillRect(0, 0, 1600, 90);
  ctx.fillStyle = "#1d2821";
  roundRect(ctx, 150, 24, 1300, 44, 22, true);
  ctx.fillStyle = "#93a096";
  ctx.font = "500 22px Inter, Arial";
  ctx.fillText(safe ? "guvenilirmi.com" : "kampanya-firsat.example", 190, 54);

  ctx.fillStyle = "rgba(255,255,255,.48)";
  ctx.font = "700 24px Inter, Arial";
  ctx.textAlign = "center";
  ctx.fillText("CANLI TEKNİK TARAMA", 800, 205);

  ctx.fillStyle = accent;
  ctx.font = "800 118px Inter, Arial";
  ctx.fillText(safe ? "94" : "23", 800, 355);
  ctx.fillStyle = "rgba(255,255,255,.56)";
  ctx.font = "700 26px Inter, Arial";
  ctx.fillText(safe ? "DÜŞÜK GÖZLEMLENEN RİSK" : "YÜKSEK GÖZLEMLENEN RİSK", 800, 405);

  const rows = safe
    ? [["TLS", "Doğrulandı", "+8"], ["HEADERS", "Güçlü", "+7"], ["REDIRECT", "Temiz", "+5"]]
    : [["DOMAIN", "7 günlük", "-18"], ["FORM", "Harici hedef", "-22"], ["REDIRECT", "3 hostname", "-11"]];

  rows.forEach((row, index) => {
    const y = 500 + index * 110;
    ctx.fillStyle = "rgba(255,255,255,.055)";
    roundRect(ctx, 220, y, 1160, 76, 18, true);
    ctx.textAlign = "left";
    ctx.font = "700 20px ui-monospace, monospace";
    ctx.fillStyle = "rgba(255,255,255,.34)";
    ctx.fillText(row[0], 260, y + 47);
    ctx.fillStyle = "rgba(255,255,255,.70)";
    ctx.fillText(row[1], 520, y + 47);
    ctx.textAlign = "right";
    ctx.fillStyle = accent;
    ctx.fillText(row[2], 1330, y + 47);
  });

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,.22)";
  ctx.font = "500 18px ui-monospace, monospace";
  ctx.fillText("DNS  •  TLS  •  HTTP  •  RDAP  •  HTML", 220, 900);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill = false,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  if (fill) ctx.fill();
}

function containsLaptop(object: THREE.Object3D) {
  let match = false;
  object.traverse((child) => {
    if (/laptop/i.test(child.name)) match = true;
  });
  return match;
}

function attachScreenTexture(root: THREE.Object3D, texture: THREE.Texture) {
  let screen: THREE.Mesh | null = null;
  root.traverse((child) => {
    if (screen || !(child instanceof THREE.Mesh)) return;
    if (/screen|display/i.test(child.name)) screen = child;
  });

  if (!screen) return null;
  const mesh = screen as THREE.Mesh;
  mesh.geometry.computeBoundingBox();
  const box = mesh.geometry.boundingBox;
  if (!box) return null;

  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const values = [size.x, size.y, size.z];
  const thinAxis = values.indexOf(Math.min(...values));
  let width = size.x;
  let height = size.y;
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
  );

  plane.position.copy(center);
  if (thinAxis === 2) {
    width = size.x;
    height = size.y;
    plane.position.z += Math.max(size.z * .65, .004);
  } else if (thinAxis === 1) {
    width = size.x;
    height = size.z;
    plane.rotation.x = -Math.PI / 2;
    plane.position.y += Math.max(size.y * .65, .004);
  } else {
    width = size.z;
    height = size.y;
    plane.rotation.y = Math.PI / 2;
    plane.position.x += Math.max(size.x * .65, .004);
  }
  plane.scale.set(width * .92, height * .90, 1);
  plane.renderOrder = 20;
  mesh.add(plane);
  return plane;
}

function LaptopCanvas({ progressRef, onReady }: { progressRef: React.MutableRefObject<number>; onReady: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050807, 0.055);
    const camera = new THREE.PerspectiveCamera(34, 1, .05, 100);
    camera.position.set(0, 1.5, 7.8);

    const rig = new THREE.Group();
    scene.add(rig);

    const hemi = new THREE.HemisphereLight(0xb8d8c7, 0x090b0a, 1.55);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xe9fff1, 5.2);
    key.position.set(4.5, 7, 5.5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    scene.add(key);
    const rim = new THREE.PointLight(0x5ef59b, 26, 12, 1.8);
    rim.position.set(-3.8, 2.6, 1.4);
    scene.add(rim);
    const blueRim = new THREE.PointLight(0x69b9ff, 14, 11, 2);
    blueRim.position.set(4, 1.3, -1.2);
    scene.add(blueRim);

    const floorMat = new THREE.MeshStandardMaterial({ color: 0x111715, roughness: .3, metalness: .48 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.34;
    floor.receiveShadow = true;
    scene.add(floor);

    const back = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 12),
      new THREE.MeshStandardMaterial({ color: 0x070b09, roughness: .82, metalness: .08 }),
    );
    back.position.set(0, 3, -5.8);
    scene.add(back);

    const safeTexture = createScreenTexture("safe");
    const riskTexture = createScreenTexture("risk");
    let screenPlane: THREE.Mesh | null = null;
    let laptop: THREE.Object3D | null = null;
    let cancelled = false;

    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL,
      (gltf) => {
        if (cancelled) return;
        const source = gltf.scene.children.find(containsLaptop) ?? gltf.scene;
        laptop = source.clone(true);
        rig.add(laptop);

        laptop.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          child.castShadow = true;
          child.receiveShadow = true;
          const material = child.material;
          if (material instanceof THREE.MeshStandardMaterial) {
            material.envMapIntensity = 1.1;
            material.roughness = Math.min(material.roughness ?? .55, .56);
          }
        });

        const box = new THREE.Box3().setFromObject(laptop);
        const size = new THREE.Vector3();
        box.getSize(size);
        const targetWidth = 5.35;
        const scale = targetWidth / Math.max(size.x, .001);
        laptop.scale.setScalar(scale);
        laptop.updateMatrixWorld(true);
        const scaledBox = new THREE.Box3().setFromObject(laptop);
        const center = new THREE.Vector3();
        scaledBox.getCenter(center);
        laptop.position.sub(center);
        laptop.position.y -= .22;
        laptop.position.x = 1.18;
        laptop.rotation.y = -.08;
        laptop.updateMatrixWorld(true);

        screenPlane = attachScreenTexture(laptop, safeTexture);
        onReady();
      },
      undefined,
      () => onReady(),
    );

    const pointer = new THREE.Vector2();
    const onPointer = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth - .5) * 2;
      pointer.y = (event.clientY / window.innerHeight - .5) * 2;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const resize = () => {
      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    let frame = 0;
    const clock = new THREE.Clock();
    const target = new THREE.Vector3(.35, .35, 0);

    const render = () => {
      const elapsed = clock.getElapsedTime();
      const p = progressRef.current;
      const zoom = THREE.MathUtils.smoothstep(p, .08, .72);
      const risk = THREE.MathUtils.smoothstep(p, .56, .76);

      camera.position.x = THREE.MathUtils.lerp(0.05, .2, zoom) + pointer.x * .09 * (1 - zoom);
      camera.position.y = THREE.MathUtils.lerp(1.55, .88, zoom) - pointer.y * .055 * (1 - zoom);
      camera.position.z = THREE.MathUtils.lerp(7.7, 2.35, zoom);
      target.x = THREE.MathUtils.lerp(.55, .08, zoom);
      target.y = THREE.MathUtils.lerp(.45, .72, zoom);
      camera.lookAt(target);

      if (laptop) {
        laptop.rotation.y = -.08 + pointer.x * .028 * (1 - zoom);
        laptop.rotation.x = pointer.y * .012 * (1 - zoom);
        laptop.position.x = THREE.MathUtils.lerp(1.18, .02, zoom);
        laptop.position.y = -.22 + Math.sin(elapsed * .55) * .008 * (1 - zoom);
      }

      rim.color.setHex(risk > .45 ? 0xff5f68 : 0x5ef59b);
      rim.intensity = THREE.MathUtils.lerp(26, 33, risk);
      if (screenPlane) {
        const material = screenPlane.material as THREE.MeshBasicMaterial;
        material.map = risk > .48 ? riskTexture : safeTexture;
        material.needsUpdate = true;
      }

      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointer);
      safeTexture.dispose();
      riskTexture.dispose();
      renderer.dispose();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
    };
  }, [onReady, progressRef]);

  return <canvas ref={canvasRef} className="rl-canvas" aria-hidden="true" />;
}

export function RealLaptopHome() {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const [chapter, setChapter] = useState(0);
  const [ready, setReady] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const onScroll = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(rect.height - window.innerHeight, 1);
      const progress = clamp(-rect.top / travel);
      progressRef.current = progress;
      const next = Math.min(chapters.length - 1, Math.floor(progress * chapters.length));
      setChapter((current) => current === next ? current : next);
      section.style.setProperty("--story-progress", String(progress));
      section.style.setProperty("--screen-takeover", String(clamp((progress - .28) / .33)));
      section.style.setProperty("--risk-progress", String(clamp((progress - .56) / .18)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
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
      <section ref={sectionRef} className="rl-story">
        <div className="rl-sticky">
          <header className="rl-nav">
            <Link href="/" className="rl-brand"><span>✓</span> GüvenilirMi</Link>
            <span className="rl-nav-center">EXPLAINABLE TRUST ENGINE</span>
            <Link href="/analiz" className="rl-nav-cta">Site tara</Link>
          </header>

          <div className="rl-light rl-light-green" />
          <div className="rl-light rl-light-blue" />
          <LaptopCanvas progressRef={progressRef} onReady={() => setReady(true)} />

          <div className={`rl-copy rl-copy-${chapter}`} key={current.id}>
            <div className="rl-kicker"><b>{current.id}</b><i />{current.label}</div>
            <h1>{current.title}</h1>
            <p>{current.body}</p>
          </div>

          {!ready && <div className="rl-loading"><i /> Gerçek 3D cihaz yükleniyor</div>}

          <div className="rl-signal-stack" aria-hidden="true">
            <span><b>DNS</b><em>public network</em></span>
            <span><b>TLS</b><em>valid chain</em></span>
            <span><b>RDAP</b><em>domain history</em></span>
            <span><b>HTTP</b><em>redirect map</em></span>
          </div>

          <div className="rl-risk-overlay" aria-hidden="true">
            <div className="rl-risk-node rl-risk-a">FORM</div>
            <div className="rl-risk-node rl-risk-b">REDIRECT</div>
            <div className="rl-risk-node rl-risk-c">DOMAIN</div>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M18 68 C35 32 52 82 82 35" /><path d="M17 68 C48 60 67 46 82 35" /></svg>
          </div>

          <div className="rl-evidence" aria-hidden="true">
            <small>SKOR AYRIŞIMI</small>
            <strong>23</strong><span>/100</span>
            <ul><li>Domain yaşı <b>-18</b></li><li>Harici form <b>-22</b></li><li>TLS <b className="good">+8</b></li><li>Bilinmeyen <b className="neutral">0</b></li></ul>
          </div>

          <form className="rl-final-search" onSubmit={submit}>
            <label>Gerçek bir siteyi teknik sinyallerle tara</label>
            <div><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="ornek.com" inputMode="url" /><button type="submit">Analiz et</button></div>
            <small>AI / LLM YOK · ÜCRETLİ MODEL API'Sİ YOK</small>
          </form>

          <div className="rl-progress"><i /></div>
          <div className="rl-scroll-cue"><span>↓</span> SCROLL TO ENTER</div>
        </div>
      </section>

      <section className="rl-proof">
        <div className="rl-proof-head"><p>GERÇEK PROBLEM / KAYNAKLI VERİ</p><h2>Güven hissi yetmez.<br/>Kanıt gerekir.</h2></div>
        <div className="rl-proof-grid">
          {sourceStats.map((stat) => <a href={stat.sourceUrl} target="_blank" rel="noreferrer" key={stat.label}><small>{stat.year} · {stat.sourceLabel}</small><strong>{stat.value}</strong><span>{stat.label}</span><p>{stat.detail}</p></a>)}
        </div>
      </section>

      <TrustPlayground />

      <section className="rl-end">
        <p>GÜVENİRLİMİ / CANLI ANALİZ</p>
        <h2>Bir siteye güvenmeden<br/>önce içine bak.</h2>
        <Link href="/analiz">Analize başla →</Link>
      </section>
    </main>
  );
}
