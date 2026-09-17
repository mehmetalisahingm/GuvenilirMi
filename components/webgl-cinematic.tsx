"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Phase = {
  index: string;
  eyebrow: string;
  title: string;
  copy: string;
  tone: "green" | "cyan" | "red" | "amber";
};

const phases: Phase[] = [
  {
    index: "01",
    eyebrow: "FİZİKSEL YÜZEY",
    title: "Bir URL, önce sakin görünür.",
    copy: "Biz yüzeyde kalmıyoruz. Scroll ettikçe cihazın, ekranın ve bağlantının içine gir.",
    tone: "green",
  },
  {
    index: "02",
    eyebrow: "EKRANIN İÇİ",
    title: "Tarayıcı artık bir pencere değil.",
    copy: "Kamera ekranın içine geçer. URL, teknik sinyallere ayrılmaya başlar.",
    tone: "cyan",
  },
  {
    index: "03",
    eyebrow: "AĞ MOTORU",
    title: "DNS. TLS. HTTP. RDAP.",
    copy: "Her paket ayrı bir kanıt. Sistem tek bir rozete değil, bağımsız sinyallere bakar.",
    tone: "cyan",
  },
  {
    index: "04",
    eyebrow: "RİSK AĞI",
    title: "Şüpheli ilişki görünür olur.",
    copy: "Harici form hedefleri, ani yönlendirmeler ve yeni domain davranışları risk haritasına düşer.",
    tone: "red",
  },
  {
    index: "05",
    eyebrow: "KANIT ODASI",
    title: "Skorun içine kadar gir.",
    copy: "Puanın hangi sinyallerden oluştuğunu, neyin bilinmediğini ve güven seviyesini ayrı ayrı gör.",
    tone: "amber",
  },
  {
    index: "06",
    eyebrow: "CANLI ANALİZ",
    title: "Şimdi gerçek siteyi tara.",
    copy: "AI tahmini yok. Ücretli model yok. Ölçülebilir sinyaller ve açıklanabilir sonuç var.",
    tone: "green",
  },
];

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / Math.max(0.0001, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

type Mat4 = Float32Array;

const M = {
  identity(): Mat4 {
    const out = new Float32Array(16);
    out[0] = out[5] = out[10] = out[15] = 1;
    return out;
  },
  multiply(a: Mat4, b: Mat4): Mat4 {
    const out = new Float32Array(16);
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        out[col * 4 + row] =
          a[0 * 4 + row] * b[col * 4 + 0] +
          a[1 * 4 + row] * b[col * 4 + 1] +
          a[2 * 4 + row] * b[col * 4 + 2] +
          a[3 * 4 + row] * b[col * 4 + 3];
      }
    }
    return out;
  },
  perspective(fov: number, aspect: number, near: number, far: number): Mat4 {
    const f = 1 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    const out = new Float32Array(16);
    out[0] = f / aspect;
    out[5] = f;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[14] = 2 * far * near * nf;
    return out;
  },
  translation(x: number, y: number, z: number): Mat4 {
    const out = M.identity();
    out[12] = x;
    out[13] = y;
    out[14] = z;
    return out;
  },
  scale(x: number, y: number, z: number): Mat4 {
    const out = M.identity();
    out[0] = x;
    out[5] = y;
    out[10] = z;
    return out;
  },
  rotateX(r: number): Mat4 {
    const out = M.identity();
    const c = Math.cos(r);
    const s = Math.sin(r);
    out[5] = c;
    out[6] = s;
    out[9] = -s;
    out[10] = c;
    return out;
  },
  rotateY(r: number): Mat4 {
    const out = M.identity();
    const c = Math.cos(r);
    const s = Math.sin(r);
    out[0] = c;
    out[2] = -s;
    out[8] = s;
    out[10] = c;
    return out;
  },
  rotateZ(r: number): Mat4 {
    const out = M.identity();
    const c = Math.cos(r);
    const s = Math.sin(r);
    out[0] = c;
    out[1] = s;
    out[4] = -s;
    out[5] = c;
    return out;
  },
  lookAt(eye: [number, number, number], target: [number, number, number]): Mat4 {
    let zx = eye[0] - target[0];
    let zy = eye[1] - target[1];
    let zz = eye[2] - target[2];
    let len = Math.hypot(zx, zy, zz) || 1;
    zx /= len; zy /= len; zz /= len;

    let xx = zz;
    let xy = 0;
    let xz = -zx;
    len = Math.hypot(xx, xy, xz) || 1;
    xx /= len; xy /= len; xz /= len;

    const yx = zy * xz - zz * xy;
    const yy = zz * xx - zx * xz;
    const yz = zx * xy - zy * xx;

    const out = M.identity();
    out[0] = xx; out[1] = yx; out[2] = zx;
    out[4] = xy; out[5] = yy; out[6] = zy;
    out[8] = xz; out[9] = yz; out[10] = zz;
    out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
    out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
    out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
    return out;
  },
  model(position: [number, number, number], rotation: [number, number, number], scale: [number, number, number]): Mat4 {
    let out = M.translation(...position);
    out = M.multiply(out, M.rotateX(rotation[0]));
    out = M.multiply(out, M.rotateY(rotation[1]));
    out = M.multiply(out, M.rotateZ(rotation[2]));
    return M.multiply(out, M.scale(...scale));
  },
};

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Shader oluşturulamadı");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "Shader derlenemedi");
  }
  return shader;
}

function makeProgram(gl: WebGLRenderingContext, vertex: string, fragment: string) {
  const program = gl.createProgram();
  if (!program) throw new Error("WebGL programı oluşturulamadı");
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "WebGL programı linklenemedi");
  }
  return program;
}

const boxPositions = new Float32Array([
  -1,-1, 1,  1,-1, 1,  1, 1, 1, -1, 1, 1,
   1,-1,-1, -1,-1,-1, -1, 1,-1,  1, 1,-1,
  -1, 1, 1,  1, 1, 1,  1, 1,-1, -1, 1,-1,
  -1,-1,-1,  1,-1,-1,  1,-1, 1, -1,-1, 1,
   1,-1, 1,  1,-1,-1,  1, 1,-1,  1, 1, 1,
  -1,-1,-1, -1,-1, 1, -1, 1, 1, -1, 1,-1,
]);

const boxNormals = new Float32Array([
   0,0,1, 0,0,1, 0,0,1, 0,0,1,
   0,0,-1,0,0,-1,0,0,-1,0,0,-1,
   0,1,0,0,1,0,0,1,0,0,1,0,
   0,-1,0,0,-1,0,0,-1,0,0,-1,0,
   1,0,0,1,0,0,1,0,0,1,0,0,
  -1,0,0,-1,0,0,-1,0,0,-1,0,0,
]);

const boxIndices = new Uint16Array([
  0,1,2, 0,2,3, 4,5,6, 4,6,7, 8,9,10, 8,10,11,
  12,13,14, 12,14,15, 16,17,18, 16,18,19, 20,21,22, 20,22,23,
]);

const planePositions = new Float32Array([-1,-1,0, 1,-1,0, 1,1,0, -1,1,0]);
const planeUvs = new Float32Array([0,1, 1,1, 1,0, 0,0]);
const planeIndices = new Uint16Array([0,1,2, 0,2,3]);

function uploadBuffer(gl: WebGLRenderingContext, target: number, data: BufferSource) {
  const buffer = gl.createBuffer();
  if (!buffer) throw new Error("Buffer oluşturulamadı");
  gl.bindBuffer(target, buffer);
  gl.bufferData(target, data, gl.STATIC_DRAW);
  return buffer;
}

function drawScreenTexture(canvas: HTMLCanvasElement, phase: number, time: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const red = phase >= 3 && phase <= 4;
  const accent = red ? "#ff5f67" : phase === 4 ? "#ffc766" : "#73f59d";

  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#07100c");
  g.addColorStop(0.55, red ? "#16080a" : "#08140f");
  g.addColorStop(1, "#020503");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(255,255,255,.055)";
  ctx.fillRect(0, 0, w, 54);
  ctx.fillStyle = "#ff5f57"; ctx.beginPath(); ctx.arc(24, 27, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#febc2e"; ctx.beginPath(); ctx.arc(47, 27, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#28c840"; ctx.beginPath(); ctx.arc(70, 27, 7, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.roundRect(110, 13, w - 150, 28, 14);
  ctx.fill();
  ctx.font = "500 13px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "rgba(232,245,236,.78)";
  ctx.fillText(phase >= 3 ? "kampanya-firsat.example" : "guvenilirmi.com", 132, 32);

  ctx.strokeStyle = "rgba(255,255,255,.05)";
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 44) { ctx.beginPath(); ctx.moveTo(x, 54); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 54; y < h; y += 44) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

  const pulse = 0.45 + Math.sin(time * 0.002) * 0.1;
  const halo = ctx.createRadialGradient(w * .5, h * .48, 20, w * .5, h * .48, 280);
  halo.addColorStop(0, red ? `rgba(255,70,80,${pulse})` : `rgba(80,255,145,${pulse})`);
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 54, w, h - 54);

  ctx.textAlign = "center";
  ctx.font = "700 20px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "rgba(235,248,239,.66)";
  ctx.fillText(phase === 4 ? "KANIT MOTORU" : red ? "RİSK SİNYALLERİ" : "CANLI TEKNİK TARAMA", w / 2, 145);
  ctx.font = "800 116px Arial, sans-serif";
  ctx.fillStyle = accent;
  ctx.fillText(phase === 4 ? "23" : red ? "23" : "94", w / 2, 285);
  ctx.font = "600 18px Arial, sans-serif";
  ctx.fillStyle = "rgba(238,248,241,.7)";
  ctx.fillText(red ? "YÜKSEK GÖZLEMLENEN RİSK" : "DÜŞÜK GÖZLEMLENEN RİSK", w / 2, 320);

  const items = red
    ? [["DOMAIN", "7 gün", "−18"], ["FORM", "Harici hedef", "−22"], ["REDIRECT", "3 domain", "−11"]]
    : [["TLS", "Doğrulandı", "+8"], ["HEADERS", "Güçlü", "+7"], ["REDIRECT", "Temiz", "+5"]];
  items.forEach((item, i) => {
    const y = 385 + i * 62;
    ctx.fillStyle = "rgba(255,255,255,.045)";
    ctx.roundRect(98, y - 34, w - 196, 48, 12);
    ctx.fill();
    ctx.textAlign = "left";
    ctx.font = "600 13px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = "rgba(238,248,241,.52)";
    ctx.fillText(item[0], 122, y - 4);
    ctx.fillStyle = "rgba(238,248,241,.9)";
    ctx.fillText(item[1], 250, y - 4);
    ctx.textAlign = "right";
    ctx.fillStyle = accent;
    ctx.fillText(item[2], w - 122, y - 4);
  });
}

export function WebGLCinematic() {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [url, setUrl] = useState("");

  const current = phases[phase];
  const phaseStops = useMemo(() => [0, 0.16, 0.33, 0.52, 0.72, 0.88], []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const root = rootRef.current;
      if (root) {
        const rect = root.getBoundingClientRect();
        const travel = Math.max(1, root.offsetHeight - window.innerHeight);
        const p = clamp(-rect.top / travel);
        setProgress(p);
        let next = 0;
        for (let i = 0; i < phaseStops.length; i++) if (p >= phaseStops[i]) next = i;
        setPhase(next);
      }
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [phaseStops]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    const colorProgram = makeProgram(gl,
      `attribute vec3 a_position; attribute vec3 a_normal; uniform mat4 u_mvp; uniform mat4 u_model; varying vec3 v_normal; varying vec3 v_world; void main(){ vec4 world=u_model*vec4(a_position,1.0); v_world=world.xyz; v_normal=mat3(u_model)*a_normal; gl_Position=u_mvp*vec4(a_position,1.0); }`,
      `precision mediump float; varying vec3 v_normal; varying vec3 v_world; uniform vec3 u_color; uniform float u_alpha; uniform float u_emissive; void main(){ vec3 n=normalize(v_normal); vec3 l=normalize(vec3(-0.45,0.8,0.65)); float d=max(dot(n,l),0.0); float rim=pow(1.0-max(abs(n.z),0.0),2.2); vec3 c=u_color*(0.28+d*0.72)+u_color*rim*0.32+u_color*u_emissive; gl_FragColor=vec4(c,u_alpha); }`
    );
    const textureProgram = makeProgram(gl,
      `attribute vec3 a_position; attribute vec2 a_uv; uniform mat4 u_mvp; varying vec2 v_uv; void main(){v_uv=a_uv;gl_Position=u_mvp*vec4(a_position,1.0);}`,
      `precision mediump float; varying vec2 v_uv; uniform sampler2D u_tex; uniform float u_alpha; void main(){ vec4 c=texture2D(u_tex,v_uv); gl_FragColor=vec4(c.rgb,c.a*u_alpha); }`
    );
    const basicProgram = makeProgram(gl,
      `attribute vec3 a_position; uniform mat4 u_mvp; uniform float u_size; void main(){ gl_Position=u_mvp*vec4(a_position,1.0); gl_PointSize=u_size; }`,
      `precision mediump float; uniform vec3 u_color; uniform float u_alpha; void main(){ float d=distance(gl_PointCoord,vec2(.5)); if(d>.5) discard; float a=smoothstep(.5,.06,d)*u_alpha; gl_FragColor=vec4(u_color,a); }`
    );

    const boxPos = uploadBuffer(gl, gl.ARRAY_BUFFER, boxPositions);
    const boxNorm = uploadBuffer(gl, gl.ARRAY_BUFFER, boxNormals);
    const boxIdx = uploadBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, boxIndices);
    const planePos = uploadBuffer(gl, gl.ARRAY_BUFFER, planePositions);
    const planeUv = uploadBuffer(gl, gl.ARRAY_BUFFER, planeUvs);
    const planeIdx = uploadBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, planeIndices);

    const particleCount = 520;
    const particleData = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const r = 2.4 + Math.random() * 8;
      const a = Math.random() * Math.PI * 2;
      particleData[i * 3] = Math.cos(a) * r;
      particleData[i * 3 + 1] = (Math.random() - .5) * 7;
      particleData[i * 3 + 2] = -Math.random() * 30 + 4;
    }
    const particleBuffer = uploadBuffer(gl, gl.ARRAY_BUFFER, particleData);

    const circleData = new Float32Array(128 * 3);
    for (let i = 0; i < 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      circleData[i * 3] = Math.cos(a);
      circleData[i * 3 + 1] = Math.sin(a);
      circleData[i * 3 + 2] = 0;
    }
    const circleBuffer = uploadBuffer(gl, gl.ARRAY_BUFFER, circleData);

    const screenCanvas = document.createElement("canvas");
    screenCanvas.width = 1024;
    screenCanvas.height = 640;
    const screenTexture = gl.createTexture();
    if (!screenTexture) return;
    gl.bindTexture(gl.TEXTURE_2D, screenTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const colorPosLoc = gl.getAttribLocation(colorProgram, "a_position");
    const colorNormLoc = gl.getAttribLocation(colorProgram, "a_normal");
    const colorMvpLoc = gl.getUniformLocation(colorProgram, "u_mvp");
    const colorModelLoc = gl.getUniformLocation(colorProgram, "u_model");
    const colorColorLoc = gl.getUniformLocation(colorProgram, "u_color");
    const colorAlphaLoc = gl.getUniformLocation(colorProgram, "u_alpha");
    const colorEmissiveLoc = gl.getUniformLocation(colorProgram, "u_emissive");

    const texPosLoc = gl.getAttribLocation(textureProgram, "a_position");
    const texUvLoc = gl.getAttribLocation(textureProgram, "a_uv");
    const texMvpLoc = gl.getUniformLocation(textureProgram, "u_mvp");
    const texAlphaLoc = gl.getUniformLocation(textureProgram, "u_alpha");

    const basicPosLoc = gl.getAttribLocation(basicProgram, "a_position");
    const basicMvpLoc = gl.getUniformLocation(basicProgram, "u_mvp");
    const basicColorLoc = gl.getUniformLocation(basicProgram, "u_color");
    const basicAlphaLoc = gl.getUniformLocation(basicProgram, "u_alpha");
    const basicSizeLoc = gl.getUniformLocation(basicProgram, "u_size");

    const drawBox = (vp: Mat4, position: [number, number, number], rotation: [number, number, number], scale: [number, number, number], color: [number, number, number], alpha = 1, emissive = 0) => {
      const model = M.model(position, rotation, scale);
      const mvp = M.multiply(vp, model);
      gl.useProgram(colorProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, boxPos);
      gl.enableVertexAttribArray(colorPosLoc);
      gl.vertexAttribPointer(colorPosLoc, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, boxNorm);
      gl.enableVertexAttribArray(colorNormLoc);
      gl.vertexAttribPointer(colorNormLoc, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIdx);
      gl.uniformMatrix4fv(colorMvpLoc, false, mvp);
      gl.uniformMatrix4fv(colorModelLoc, false, model);
      gl.uniform3fv(colorColorLoc, color);
      gl.uniform1f(colorAlphaLoc, alpha);
      gl.uniform1f(colorEmissiveLoc, emissive);
      gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);
    };

    const drawTexturedPlane = (vp: Mat4, position: [number, number, number], rotation: [number, number, number], scale: [number, number, number], alpha: number) => {
      const model = M.model(position, rotation, scale);
      const mvp = M.multiply(vp, model);
      gl.useProgram(textureProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, planePos);
      gl.enableVertexAttribArray(texPosLoc);
      gl.vertexAttribPointer(texPosLoc, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, planeUv);
      gl.enableVertexAttribArray(texUvLoc);
      gl.vertexAttribPointer(texUvLoc, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, planeIdx);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, screenTexture);
      gl.uniformMatrix4fv(texMvpLoc, false, mvp);
      gl.uniform1f(texAlphaLoc, alpha);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };

    const drawPoints = (vp: Mat4, alpha: number, red: boolean) => {
      gl.useProgram(basicProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
      gl.enableVertexAttribArray(basicPosLoc);
      gl.vertexAttribPointer(basicPosLoc, 3, gl.FLOAT, false, 0, 0);
      gl.uniformMatrix4fv(basicMvpLoc, false, vp);
      gl.uniform3fv(basicColorLoc, red ? [1,.24,.3] : [.3,1,.62]);
      gl.uniform1f(basicAlphaLoc, alpha);
      gl.uniform1f(basicSizeLoc, 3.2 * Math.min(2, window.devicePixelRatio || 1));
      gl.drawArrays(gl.POINTS, 0, particleCount);
    };

    const drawRing = (vp: Mat4, rotation: [number, number, number], scale: number, color: [number, number, number], alpha: number) => {
      const model = M.model([0,0,-8], rotation, [scale,scale,scale]);
      const mvp = M.multiply(vp, model);
      gl.useProgram(basicProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, circleBuffer);
      gl.enableVertexAttribArray(basicPosLoc);
      gl.vertexAttribPointer(basicPosLoc, 3, gl.FLOAT, false, 0, 0);
      gl.uniformMatrix4fv(basicMvpLoc, false, mvp);
      gl.uniform3fv(basicColorLoc, color);
      gl.uniform1f(basicAlphaLoc, alpha);
      gl.uniform1f(basicSizeLoc, 1);
      gl.drawArrays(gl.LINE_LOOP, 0, 128);
    };

    let raf = 0;
    let lastWidth = 0;
    let lastHeight = 0;
    const render = (time: number) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));
      if (width !== lastWidth || height !== lastHeight) {
        canvas.width = width;
        canvas.height = height;
        lastWidth = width;
        lastHeight = height;
      }
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const root = rootRef.current;
      const rectRoot = root?.getBoundingClientRect();
      const travel = root ? Math.max(1, root.offsetHeight - window.innerHeight) : 1;
      const p = root && rectRoot ? clamp(-rectRoot.top / travel) : 0;
      const aspect = width / height;
      const proj = M.perspective((42 * Math.PI) / 180, aspect, .05, 80);

      let eye: [number, number, number] = [0, .15, 7];
      let target: [number, number, number] = [0, -.05, -.25];
      if (p < .32) {
        const z = 7 - smoothstep(0, .32, p) * 6.15;
        eye = [Math.sin(p * 5) * .14, .15 - p * .2, z];
        target = [0, -.05, -.45];
      } else {
        const t = (p - .32) / .68;
        eye = [Math.sin(t * 3.2) * .22, Math.sin(t * 2) * .12, .85 - t * 22];
        target = [0, 0, eye[2] - 3.5];
      }
      const vp = M.multiply(proj, M.lookAt(eye, target));

      const laptopAlpha = 1 - smoothstep(.27, .37, p);
      const tilt = -.055 + Math.sin(time * .00035) * .008;
      if (laptopAlpha > .01) {
        drawBox(vp, [0,-1.18,.78], [0,0,0], [2.72,.105,1.72], [.47,.5,.49], laptopAlpha);
        drawBox(vp, [0,-1.035,.62], [0,0,0], [2.55,.028,1.48], [.085,.1,.092], laptopAlpha);
        drawBox(vp, [0,-1.0,.95], [0,0,0], [.78,.014,.5], [.26,.29,.28], laptopAlpha);
        drawBox(vp, [0,-.94,-.55], [0,0,0], [2.1,.055,.12], [.18,.2,.19], laptopAlpha);
        drawBox(vp, [0,.38,-.72], [tilt,0,0], [2.72,1.72,.075], [.13,.15,.145], laptopAlpha);
        drawBox(vp, [0,.38,-.625], [tilt,0,0], [2.49,1.47,.015], [.018,.03,.024], laptopAlpha, .08);
        drawTexturedPlane(vp, [0,.38,-.598], [tilt,0,0], [2.44,1.42,1], laptopAlpha);

        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 12; col++) {
            const x = -1.78 + col * .325;
            const z = -.2 + row * .29;
            drawBox(vp, [x,-.985,z], [0,0,0], [.12,.018,.09], [.12,.135,.128], laptopAlpha * .88);
          }
        }
      }

      const virtualAlpha = smoothstep(.30, .42, p);
      const red = p > .55 && p < .82;
      if (virtualAlpha > .01) {
        drawPoints(vp, Math.min(.82, virtualAlpha), red);
        const travelZ = p > .32 ? ((p - .32) / .68) * 22 : 0;
        for (let i = 0; i < 26; i++) {
          const z = 1.5 - i * 1.15 - travelZ * .55;
          const x = Math.sin(i * 1.7 + time * .00035) * (1.1 + (i % 5) * .32);
          const y = Math.cos(i * 1.31 + time * .00024) * (0.6 + (i % 4) * .25);
          const danger = red && i % 4 === 0;
          drawBox(vp, [x,y,z], [time*.00018 + i, time*.00011, 0], [.055,.055,.055], danger ? [1,.18,.24] : [.24,1,.58], virtualAlpha * .9, .65);
        }
      }

      if (p > .7) {
        const a = smoothstep(.7,.8,p) * (1 - smoothstep(.91,1,p));
        drawRing(vp, [0,time*.00018,0], 1.8, [1,.75,.28], a);
        drawRing(vp, [1.15,time*.00013,.35], 2.35, [.28,1,.58], a*.72);
        drawRing(vp, [.35,time*.0001,1.3], 2.9, [1,.26,.32], a*.42);
        drawBox(vp, [0,0,-8], [time*.00024,time*.00018,0], [.55,.55,.55], [1,.68,.22], a, .9);
      }

      drawScreenTexture(screenCanvas, p < .48 ? 1 : p < .7 ? 3 : 4, time);
      gl.bindTexture(gl.TEXTURE_2D, screenTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, screenCanvas);

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => cancelAnimationFrame(raf);
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = url.trim();
    if (!value) return;
    window.location.href = `/analiz?url=${encodeURIComponent(value)}`;
  }

  return (
    <main className="wc-page">
      <section className="wc-scroll" ref={rootRef}>
        <div className="wc-sticky">
          <canvas ref={canvasRef} className="wc-canvas" aria-hidden="true" />
          <div className={`wc-ambient wc-${current.tone}`} aria-hidden="true" />
          <div className="wc-grid" aria-hidden="true" />

          <header className="wc-nav">
            <a className="wc-brand" href="#top"><span>G</span> GüvenilirMi</a>
            <div className="wc-nav-meta">AI YOK · ÜCRETLİ MODEL YOK · AÇIKLANABİLİR</div>
            <a className="wc-nav-cta" href="/analiz">Canlı analiz ↗</a>
          </header>

          <div className="wc-copy" key={current.index}>
            <div className="wc-step"><span>{current.index}</span><i />{current.eyebrow}</div>
            <h1>{current.title}</h1>
            <p>{current.copy}</p>
          </div>

          {phase === 0 && (
            <div className="wc-hero-note">
              <strong>SCROLL TO ENTER</strong>
              <span>↓</span>
            </div>
          )}

          {phase === 2 && (
            <div className="wc-engine-labels" aria-hidden="true">
              <span>DNS</span><span>TLS</span><span>HTTP</span><span>RDAP</span><span>HEADERS</span><span>HTML</span>
            </div>
          )}

          {phase === 3 && (
            <div className="wc-risk-card">
              <small>RİSK KÜMESİ / 03</small>
              <strong>Harici form + yeni domain + çoklu redirect</strong>
              <span>Birlikte değerlendirildiğinde kuvvetli sinyal</span>
            </div>
          )}

          {phase === 4 && (
            <div className="wc-score-panel">
              <div><small>TRUST SCORE</small><strong>23</strong><span>/100</span></div>
              <ul>
                <li><span>Domain yaşı</span><b>−18</b></li>
                <li><span>Harici form</span><b>−22</b></li>
                <li><span>TLS</span><b className="good">+8</b></li>
                <li><span>Bilinmeyen veri</span><b className="neutral">0</b></li>
              </ul>
            </div>
          )}

          {phase === 5 && (
            <form className="wc-final-search" onSubmit={submit}>
              <label htmlFor="wc-url">Bir siteyi şimdi tara</label>
              <div>
                <input id="wc-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="ornek-site.com" autoComplete="url" spellCheck={false} />
                <button type="submit">Analiz et ↗</button>
              </div>
              <small>DNS · TLS · HTTP · RDAP · HEADERS · HTML</small>
            </form>
          )}

          <div className="wc-depth" aria-label={`Sahne ${phase + 1} / ${phases.length}`}>
            {phases.map((item, i) => <i key={item.index} className={i <= phase ? "active" : ""} />)}
          </div>
          <div className="wc-progress"><i style={{ transform: `scaleX(${progress})` }} /></div>
        </div>
      </section>

      <section className="wc-after">
        <div>
          <p>GÜVENİLİRMİ / TEKNİK RİSK ANALİZİ</p>
          <h2>Güven, tek bir yeşil tikten daha derin.</h2>
        </div>
        <p>Sonuçlarımız kesin güvenlik sertifikası değildir. Ölçülen teknik sinyalleri, veri kapsamını ve belirsizliği kullanıcıya açık biçimde gösterir.</p>
      </section>
    </main>
  );
}
