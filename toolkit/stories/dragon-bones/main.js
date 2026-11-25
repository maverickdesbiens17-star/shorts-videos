import { Pen, bodyFront, INK as TINK } from "./toon.js";
import * as P from "./paint.js";
const { clamp, lerp, ss, easeOut, back, rnd } = P;

export const W = 1080, H = 1920, FPS = 30;
const cv = document.getElementById("c"); cv.width = W; cv.height = H;
const g = cv.getContext("2d");
const CJK = '"Noto Serif CJK SC", "Noto Sans CJK SC", serif';

// ---------------- cast (Qing-era Beijing 1899 + Shang court c. 1200 BC + today) ----------------
const SKC = ["#f3d2a8", "#e8c096", "#d9a97c", "#f6dcb8"];
const FARMER = { jacket: "#3b5b8c", pants: "#2d2f3a", boots: "#2a2420", hat: "douli", cap: "#e2c27a", skin: SKC[1] };
const FARMER2 = { jacket: "#6b7f4a", pants: "#3a3328", boots: "#2a2420", hat: "douli", cap: "#d4b066", skin: SKC[2], moustache: "#9a9a9a" };
const SHOP = { jacket: "#7a2f2a", pants: "#2a2630", boots: "#1f1b22", hat: "guapi", cap: "#26222c", knot: "#d8352a", skin: SKC[0], moustache: "#2a201a", build: "stout" };
const LADY = { jacket: "#3f9e7f", dress: "#2f7a62", pants: "#2f7a62", boots: "#1f1b22", hat: "hair", hair: "#1c1a22", skin: SKC[3] };
const WANG = { jacket: "#22306a", dress: "#1d2a5c", pants: "#1d2a5c", boots: "#111111", hat: "guapi", cap: "#1c1a22", knot: "#d8352a", skin: SKC[0], moustache: "#3a3a3a", build: "stout" };
const DEALER = { jacket: "#c06a2a", pants: "#3a2a22", boots: "#1f1b22", hat: "guapi", cap: "#4a2f22", knot: "#e8b53a", skin: SKC[1], moustache: "#2a201a" };
const KING = { jacket: "#8a1f2b", dress: "#3a1418", pants: "#3a1418", boots: "#1a1012", hat: "kettle", cap: "#d9a73a", plume: "#e04a2a", skin: SKC[2], moustache: "#1c1a22", build: "stout" };
const DIVINER = { jacket: "#e9e2cf", dress: "#d8cfb6", pants: "#d8cfb6", boots: "#3a2a22", hat: "hair", hair: "#dedede", skin: SKC[2], moustache: "#efefef" };
const SOLDIER = (v) => ({ jacket: v % 2 ? "#9a3b26" : "#7d3020", pants: "#3a2a22", boots: "#2a1c16", hat: "kettle", cap: "#b07a3a", skin: SKC[v % 4] });
const GHOST = { jacket: "#bfe3ff", dress: "#a9d6f5", pants: "#a9d6f5", boots: "#a9d6f5", hat: "kettle", cap: "#e8f6ff", plume: "#ffffff", skin: "#dff2ff", moustache: "#ffffff" };
const DIGGER = (v) => ({ jacket: v % 2 ? "#b8a27a" : "#8f7d5a", pants: "#6b5a3a", boots: "#3a2a22", hat: "cap", cap: "#d8c9a0", skin: SKC[v % 4] });
const KID = { jacket: "#ff7a59", pants: "#2d3e66", boots: "#f4f1ea", hat: "hair", hair: "#1c1a22", build: "kid", skin: SKC[0] };

const blink = (T, seed) => ((T + seed * 0.77) % 3.4) < 0.11;
const talk = (T, a, b, seed = 0) => (Math.floor(T * 7 + seed) % 2 ? a : b);
function ch(x, y, s, o, opts = {}, flip = 1, T = 0, seed = 1) {
  g.save(); g.translate(x, y);
  P.shadow(g, 0, 0, 120 * s, 0.22);
  g.scale(s * flip, s); g.translate(-300, -975);
  const idle = opts.mode === "march" || opts.mode === "stroll" ? 0 : 0.025 * Math.sin(T * 2.1 + seed * 1.7);
  bodyFront(new Pen(g), o, { mode: "stand", seed, blink: blink(T, seed), tilt: idle, headTilt: idle * 1.5, ...opts });
  g.restore();
}
const face = (x, hy, s, o, opts, flip, T, seed) => ch(x, hy + 670 * s, s, o, opts, flip, T, seed);
/** things held in the "hold" pose (drawn in character space; u = 1 % of head width) */
const HOLD = {
  bone: (glyphs = [["sun", -10, -40], ["rain", 20, 60]], k = 1) => (gg, x, y, u) => P.bone(gg, x, y - 30 * u, 70 * u, 0.15, glyphs.map((q) => [...q.slice(0, 3), k])),
  bowl: (gg, x, y, u) => bowl(x, y + 4 * u, 52 * u, "#e9e2cf", gg),
  box: (gg, x, y, u) => { gg.beginPath(); gg.rect(x - 40 * u, y - 18 * u, 80 * u, 34 * u); gg.fillStyle = "#7a4a2a"; gg.fill(); gg.lineWidth = 2.5 * u; gg.strokeStyle = P.INK; gg.stroke();
    P.bone(gg, x - 14 * u, y - 44 * u, 34 * u, -0.3, [["person", 0, 40]]); P.bone(gg, x + 16 * u, y - 40 * u, 30 * u, 0.4, [["tree", 0, 30]]); },
  tablet: (gg, x, y, u) => { gg.beginPath(); gg.roundRect(x - 34 * u, y - 46 * u, 68 * u, 52 * u, 6 * u); gg.fillStyle = "#1f2433"; gg.fill(); gg.lineWidth = 2.5 * u; gg.strokeStyle = P.INK; gg.stroke();
    gg.fillStyle = "#dff6ff"; gg.fillRect(x - 28 * u, y - 40 * u, 56 * u, 40 * u); gg.fillStyle = "#c8323a"; gg.font = `900 ${30 * u}px ${CJK}`; gg.textAlign = "center"; gg.textBaseline = "middle"; gg.fillText("日", x, y - 19 * u); },
};

// ---------------- timing ----------------
const segs = window.SEGS;
export const DUR = window.DUR;
for (const s of segs) {
  const ws = s.text.split(/\s+/), weights = ws.map((w) => w.replace(/[^A-Za-z0-9]/g, "").length + 1.5 + (/[.,]$/.test(w) ? 2 : 0));
  const tot = weights.reduce((a, b) => a + b, 0); let t = s.start;
  s.words = ws.map((w, i) => { const d = ((s.end - s.start) * weights[i]) / tot; const o = { w, t0: t, t1: t + d }; t += d; return o; });
}

// ---------------- camera & fx ----------------
let shakeAmt = 0;
function cam(cx, cy, z, roll = 0, T = 0) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.translate(W / 2, H / 2); g.rotate(roll); g.scale(z, z);
  const sx = shakeAmt ? shakeAmt * (rnd(Math.floor(T * 30), 1) - 0.5) : 0, sy = shakeAmt ? shakeAmt * (rnd(Math.floor(T * 30), 2) - 0.5) : 0;
  g.translate(-cx + sx, -cy + sy);
}
const screen = () => g.setTransform(1, 0, 0, 1, 0, 0);
const tone = (key, a) => {
  screen();
  const c = { golden: "rgba(255,140,40,", night: "rgba(30,50,140,", sepia: "rgba(150,100,40,", fire: "rgba(255,90,30,", jade: "rgba(40,140,110," }[key];
  if (!c) return;
  g.globalCompositeOperation = key === "sepia" ? "color" : "multiply"; g.fillStyle = c + a + ")"; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "source-over";
};
function sweat(x, y, s, T) {
  const dy = ((T * 1.5) % 1) * 60 * s;
  g.beginPath(); g.moveTo(x, y + dy - 30 * s); g.quadraticCurveTo(x + 18 * s, y + dy, x, y + dy + 14 * s); g.quadraticCurveTo(x - 18 * s, y + dy, x, y + dy - 30 * s);
  g.fillStyle = "#9fdcff"; g.fill(); g.lineWidth = 4 * s; g.strokeStyle = P.INK; g.stroke();
}
function sparkle(x, y, r, T, col = "#fff6c2") {
  for (let i = 0; i < 3; i++) {
    const a = T * 4 + i * 2.1, k = 0.6 + 0.4 * Math.sin(T * 6 + i), px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 0.6;
    g.save(); g.translate(px, py); g.scale(k, k); g.beginPath();
    for (let j = 0; j < 8; j++) { const rr = j % 2 ? 6 : 22, aa = (j * Math.PI) / 4; g.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); }
    g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = 3; g.strokeStyle = P.INK; g.stroke(); g.restore();
  }
}
function speedLines(T, n = 14, col = "rgba(255,255,255,0.75)") {
  screen(); g.strokeStyle = col; g.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const y = rnd(i, 3) * H, len = 200 + rnd(i, 4) * 300, x = ((T * 2600 + rnd(i, 5) * 2000) % (W + len * 2)) - len;
    g.lineWidth = 6 + rnd(i, 6) * 8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y); g.stroke();
  }
}
function dust(x, y, T, n = 18, col = "#cfc6b4", spread = 160) {
  for (let i = 0; i < n; i++) {
    const k = (T * 0.8 + rnd(i, 1)) % 1, px = x + (rnd(i, 2) - 0.5) * spread * (0.5 + k), py = y - k * spread * 0.8;
    g.globalAlpha = 1 - k; g.beginPath(); g.arc(px, py, 6 + rnd(i, 3) * 10, 0, Math.PI * 2); g.fillStyle = col; g.fill(); g.globalAlpha = 1;
  }
}
function qmark(x, y, s, T, col = "#ffd34d") {
  g.save(); g.translate(x, y + 8 * Math.sin(T * 5)); g.rotate(0.08 * Math.sin(T * 3)); g.scale(s, s);
  g.font = "900 200px Montserrat"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round"; g.lineWidth = 22; g.strokeStyle = "#111"; g.strokeText("?", 0, 0); g.fillStyle = col; g.fillText("?", 0, 0); g.restore();
}
function bowl(x, y, w, col = "#e9e2cf", gg = g) {
  gg.beginPath(); gg.moveTo(x - w / 2, y - w * 0.22); gg.quadraticCurveTo(x - w * 0.45, y + w * 0.3, x, y + w * 0.3); gg.quadraticCurveTo(x + w * 0.45, y + w * 0.3, x + w / 2, y - w * 0.22); gg.closePath();
  gg.fillStyle = col; gg.fill(); gg.lineWidth = Math.max(3, w * 0.04); gg.strokeStyle = P.INK; gg.stroke();
  gg.beginPath(); gg.ellipse(x, y - w * 0.22, w / 2, w * 0.1, 0, 0, Math.PI * 2); gg.fillStyle = "#6b4a2a"; gg.fill(); gg.stroke();
  gg.beginPath(); gg.moveTo(x - w * 0.4, y); gg.quadraticCurveTo(x, y + w * 0.08, x + w * 0.4, y); gg.lineWidth = w * 0.04; gg.strokeStyle = "#3f7f6a"; gg.stroke();
}
function spoon(x, y, s, rot, powder = true) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.beginPath(); g.roundRect(0, -10, 220, 20, 10); g.fillStyle = "#d9d4c8"; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke();
  g.beginPath(); g.ellipse(-50, 0, 60, 40, 0, 0, Math.PI * 2); g.fillStyle = "#e8e3d8"; g.fill(); g.stroke();
  if (powder) { g.beginPath(); g.ellipse(-50, -6, 46, 24, 0, Math.PI, 0); g.fillStyle = "#cfc6b4"; g.fill(); g.lineWidth = 4; g.stroke(); }
  g.restore();
}
function bigNum(n, col, label, pop = 1, y = 330) {
  screen(); g.save(); g.translate(W / 2, y); const k = clamp(pop, 0, 1.3); g.scale(k, k);
  g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
  g.font = "900 170px Montserrat"; g.lineWidth = 26; g.strokeStyle = "#111"; const s = n.toLocaleString("en-US");
  g.strokeText(s, 0, 0); g.fillStyle = col; g.fillText(s, 0, 0);
  g.font = "900 64px Montserrat"; g.lineWidth = 16; g.strokeText(label, 0, 120); g.fillStyle = "#fff"; g.fillText(label, 0, 120);
  g.restore();
}
function tag(txt, x, y, col, k = 1) {
  if (k <= 0) return;
  g.save(); g.translate(x, y); g.scale(k, k); g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
  g.font = "900 60px Montserrat"; g.lineWidth = 16; g.strokeStyle = "#111"; g.strokeText(txt, 0, 0); g.fillStyle = col; g.fillText(txt, 0, 0); g.restore();
}
/** seal-style label: red square-cornered frame (a Chinese name-seal look, new for this story) */
function seal(txt, y, pop, rot = -0.04, col = "#c8323a") {
  if (pop <= 0) return; screen(); g.save(); g.translate(W / 2, y); g.rotate(rot); g.scale(clamp(pop, 0, 1.3), clamp(pop, 0, 1.3));
  g.font = "900 92px Montserrat"; g.textAlign = "center"; g.textBaseline = "middle";
  const w = g.measureText(txt).width + 70; g.fillStyle = col; g.fillRect(-w / 2, -72, w, 144); g.lineWidth = 8; g.strokeStyle = "#f6e7c8"; g.strokeRect(-w / 2 + 14, -58, w - 28, 116);
  g.fillStyle = "#f6e7c8"; g.fillText(txt, 0, 6); g.restore();
}
const pin = (x, y, k, col = "#c8323a") => { if (k <= 0) return; g.save(); g.translate(x, y); g.scale(k, k); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-40, -50, -40, -95, 0, -95); g.bezierCurveTo(40, -95, 40, -50, 0, 0); g.fillStyle = col; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke(); g.beginPath(); g.arc(0, -62, 14, 0, Math.PI * 2); g.fillStyle = "#fff"; g.fill(); g.restore(); };

// ---------------- backdrops ----------------
function tree(x, y, s, T, col = "#5f9a4a") {
  g.beginPath(); g.moveTo(x - 14 * s, y); g.lineTo(x - 8 * s, y - 150 * s); g.lineTo(x + 8 * s, y - 150 * s); g.lineTo(x + 14 * s, y); g.closePath(); g.fillStyle = "#6b4a2a"; g.fill(); g.lineWidth = 4; g.strokeStyle = P.INK; g.stroke();
  g.beginPath(); [[0, -200, 80], [-60, -160, 60], [60, -165, 62], [0, -130, 55]].forEach(([dx, dy, r]) => { g.moveTo(x + (dx + r) * s + 3 * Math.sin(T), y + dy * s); g.arc(x + dx * s + 3 * Math.sin(T + dx), y + dy * s, r * s, 0, Math.PI * 2); });
  g.fillStyle = col; g.fill(); g.lineWidth = 4; g.stroke();
}
function loess(T, hy = 900, opt = {}) {
  P.sky(g, W, H, opt.sky || "day");
  P.cloud(g, 100 + T * 10, hy - 600, 1.2, "#fff8ea"); P.cloud(g, 760 - T * 7, hy - 470, 1.5, "#fff8ea");
  P.hills(g, -2000, 3000, hy - 80, 150, "#d9b98a", 2.2);
  P.hills(g, -2000, 3000, hy, 110, "#cf9f5e", 5.1);
  g.strokeStyle = "rgba(120,80,40,0.35)"; g.lineWidth = 5;
  for (let i = 0; i < 5; i++) { g.beginPath(); for (let x = -1200; x <= 2200; x += 40) g.lineTo(x, hy + 30 + i * 28 + 18 * Math.sin(x * 0.004 + i)); g.stroke(); }
  for (let i = 0; i < 6; i++) tree(-200 + i * 330 + rnd(i, 3) * 80, hy + 40 + rnd(i, 4) * 30, 0.6 + rnd(i, 5) * 0.3, T + i);
  P.ground(g, -3000, 4000, hy + 160, "#d9b26a");
  g.strokeStyle = "#c79a52"; g.lineWidth = 6;
  for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(-600 + i * 200, H + 200); g.lineTo(540 + (i - 6) * 40, hy + 160); g.stroke(); }
}
function shopBack(T) {
  screen(); g.fillStyle = "#4a2e22"; g.fillRect(0, 0, W, H);
}
function shop(T, k = 1) {
  g.fillStyle = "#5b3a2a"; g.fillRect(-800, -400, 2700, 2800);
  P.drawers(g, -260, 260, 11, 7, 150, 120, "#8a4a2a");
  g.fillStyle = "#3a2418"; g.fillRect(-800, 1300, 2700, 1200);
  g.beginPath(); g.rect(-400, 1180, 1900, 140); g.fillStyle = "#7a3b22"; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
  P.lantern(g, 120, 330, 70, 0.05 * Math.sin(T * 2)); P.lantern(g, 960, 330, 70, 0.05 * Math.sin(T * 2 + 1));
  // hanging sign with the character for "medicine"
  g.save(); g.translate(540, 120 + 4 * Math.sin(T * 1.5)); g.beginPath(); g.rect(-70, 0, 140, 300); g.fillStyle = "#1f1b22"; g.fill(); g.lineWidth = 7; g.strokeStyle = "#e0b64a"; g.stroke();
  g.fillStyle = "#e0b64a"; g.font = `900 110px ${CJK}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("藥", 0, 150); g.restore();
  const gr = g.createRadialGradient(540, 700, 50, 540, 800, 900); gr.addColorStop(0, "rgba(255,200,120,0.25)"); gr.addColorStop(1, "rgba(255,200,120,0)"); g.fillStyle = gr; g.fillRect(-400, -200, 1900, 2000);
}
function lattice(x, y, w, h) {
  g.beginPath(); g.rect(x, y, w, h); g.fillStyle = "#fff4d8"; g.fill(); g.lineWidth = 10; g.strokeStyle = "#6b3a24"; g.stroke();
  g.lineWidth = 5; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(x + (w * i) / 6, y); g.lineTo(x + (w * i) / 6, y + h); g.stroke(); }
  for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(x, y + (h * i) / 8); g.lineTo(x + w, y + (h * i) / 8); g.stroke(); }
}
function study(T) {
  g.fillStyle = "#e3cfa6"; g.fillRect(-800, -400, 2700, 2800);
  lattice(620, 260, 360, 520);
  g.beginPath(); g.rect(60, 220, 420, 700); g.fillStyle = "#6b3a24"; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
  for (let r = 0; r < 4; r++) { g.fillStyle = "#4a2818"; g.fillRect(70, 380 + r * 170, 400, 14); for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(120 + i * 75, 360 + r * 170, 26, 26, 0, 0, Math.PI * 2); g.fillStyle = i % 2 ? "#f1e6c8" : "#e2c27a"; g.fill(); g.lineWidth = 4; g.stroke(); } }
  g.fillStyle = "#b88a5a"; g.fillRect(-800, 1350, 2700, 1200);
  P.lantern(g, 540, 160, 55, 0.04 * Math.sin(T * 2));
}
function court(T) { // Shang court: dark lacquer, bronze vessels, firelight
  g.fillStyle = "#2a1416"; g.fillRect(-900, -400, 2900, 2800);
  for (let i = 0; i < 4; i++) { g.beginPath(); g.rect(-120 + i * 400, 0, 90, 1400); g.fillStyle = "#6b1e1e"; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke(); }
  g.fillStyle = "#4a2a1e"; g.fillRect(-900, 1350, 2900, 1200);
  [[160, 1360], [920, 1360]].forEach(([x, y], i) => { ding(x, y, 150); P.flame(g, x, y - 175, 120, T + i); });
  const gr = g.createRadialGradient(540, 1100, 50, 540, 1100, 900); gr.addColorStop(0, "rgba(255,150,60,0.28)"); gr.addColorStop(1, "rgba(255,150,60,0)"); g.fillStyle = gr; g.fillRect(-400, 0, 1900, 2000);
}
function ding(x, y, w) { // bronze cauldron on three legs
  g.beginPath(); g.moveTo(x - w * 0.5, y - w * 1.1); g.quadraticCurveTo(x - w * 0.55, y - w * 0.35, x, y - w * 0.35); g.quadraticCurveTo(x + w * 0.55, y - w * 0.35, x + w * 0.5, y - w * 1.1); g.closePath();
  g.fillStyle = "#7a8f5a"; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke();
  [-0.35, 0, 0.35].forEach((k) => { g.beginPath(); g.rect(x + k * w - 10, y - w * 0.42, 20, w * 0.42); g.fillStyle = "#5f7346"; g.fill(); g.stroke(); });
  [-0.38, 0.38].forEach((k) => { g.beginPath(); g.rect(x + k * w - 14, y - w * 1.3, 28, w * 0.22); g.fillStyle = "#7a8f5a"; g.fill(); g.stroke(); });
  g.strokeStyle = "#4a5a36"; g.lineWidth = 5; g.beginPath(); g.moveTo(x - w * 0.4, y - w * 0.85); g.lineTo(x + w * 0.4, y - w * 0.85); g.stroke();
}
function chinaMap(T) {
  g.fillStyle = "#8fd0ea"; g.fillRect(-800, -600, 2700, 3200);
  g.strokeStyle = "rgba(255,255,255,0.5)"; g.lineWidth = 5;
  for (let i = 0; i < 10; i++) { const x = 820 + (i % 3) * 120, y = 900 + Math.floor(i / 3) * 160; g.beginPath(); g.arc(x, y, 18, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
  const pts = [[120, 760], [230, 650], [380, 600], [470, 520], [560, 520], [640, 450], [720, 360], [820, 300], [920, 330], [960, 420], [900, 480], [840, 520], [820, 580], [760, 620], [790, 690], [760, 760], [800, 840], [790, 930], [740, 1010], [660, 1070], [560, 1090], [470, 1080], [400, 1040], [330, 1060], [260, 1010], [220, 950], [150, 900], [100, 840]];
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fillStyle = "#e8c98a"; g.fill(); g.lineWidth = 8; g.strokeStyle = P.INK; g.lineJoin = "round"; g.stroke();
  g.beginPath(); g.moveTo(330, 760); g.quadraticCurveTo(500, 700, 640, 760); g.quadraticCurveTo(700, 780, 770, 740); g.lineWidth = 9; g.strokeStyle = "#4a9fd0"; g.stroke(); // Yellow River (schematic)
  g.beginPath(); g.ellipse(660, 1110, 40, 22, 0, 0, Math.PI * 2); g.fillStyle = "#e8c98a"; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke();
}
function digSite(T) {
  P.sky(g, W, H, "day"); P.cloud(g, 200 + T * 8, 300, 1.3); P.cloud(g, 800 - T * 6, 420, 1.0);
  P.hills(g, -2000, 3000, 820, 90, "#d9b98a", 1.4);
  P.ground(g, -3000, 4000, 900, "#d9b26a");
  g.beginPath(); g.rect(60, 1100, 960, 900); g.fillStyle = "#a8783e"; g.fill(); g.lineWidth = 8; g.strokeStyle = P.INK; g.stroke();
  [["#b98a4a", 1240], ["#9a6a36", 1420], ["#8a5c2e", 1600]].forEach(([c, y]) => { g.fillStyle = c; g.fillRect(64, y, 952, 180); });
  g.strokeStyle = "rgba(255,255,255,0.7)"; g.lineWidth = 4; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(60 + i * 240, 1100); g.lineTo(60 + i * 240, 2000); g.stroke(); }
}
function street(T) {
  P.sky(g, W, H, "day"); P.cloud(g, 120 + T * 10, 260, 1.1);
  [[-40, 300, 520, "#9fb7d6"], [260, 260, 640, "#c7d6e8"], [560, 320, 480, "#e8b9a0"], [840, 300, 700, "#b9d6c7"]].forEach(([x, w, h, c], i) => {
    g.beginPath(); g.rect(x, 1250 - h, w, h); g.fillStyle = c; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke();
    for (let r = 0; r < Math.floor(h / 110); r++) for (let k = 0; k < 3; k++) { g.beginPath(); g.rect(x + 30 + k * (w - 60) / 3, 1250 - h + 40 + r * 110, (w - 120) / 3, 60); g.fillStyle = (r + k + i) % 4 ? "#f4f7ff" : "#ffe08a"; g.fill(); g.lineWidth = 3; g.stroke(); }
  });
  // shop sign with modern characters
  g.beginPath(); g.rect(600, 760, 300, 120); g.fillStyle = "#c8323a"; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke();
  g.fillStyle = "#ffe08a"; g.font = `900 80px ${CJK}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("日月", 750, 822);
  P.ground(g, -3000, 4000, 1250, "#9aa3ad"); g.fillStyle = "#b8c0c8"; g.fillRect(-3000, 1250, 7000, 80);
}

// ---------------- shots: [start (s), fn(t in shot, shot length, global T)] ----------------
const SHOTS = [
  [0, (t, d, T) => { // "Why were people in China" — a spoon of grey powder heads for an open mouth
    P.sky(g, W, H, "golden"); cam(540, 1000, lerp(1.0, 1.12, ss(t / d)), 0, T);
    loess(T, 1050, { sky: "golden" });
    face(540, 980, 1.5, FARMER2, { expr: t < 0.7 ? "talk" : "shock", look: 0 }, 1, T, 3);
    const k = easeOut(t / 1.0); spoon(lerp(1200, 690, k), lerp(1500, 1160, k), 1.3, -0.35);
    if (t > 0.5) qmark(870, 560, 0.9 * back((t - 0.5) / 0.3), T);
    screen(); tag("CHINA", 540, 300, "#ff8a3d", back((T - 1.18) / 0.25) * 1.5);
  }],
  [1.45, (t, d, T) => { // "swallowing their own history?" — glyphs swirl into a medicine bowl
    shopBack(T); cam(540, 1000, lerp(1.08, 1.0, ss(t / d)), 0, T); shop(T);
    face(540, 870, 1.5, LADY, { expr: t < 1.0 ? "talk" : "gulp" }, 1, T, 5);
    bowl(560, 1430 - 60 * ss(t / 1.0), 360);
    ["sun", "rain", "person", "tree", "moon", "mountain"].forEach((kd, i) => {
      const a = T * 2.2 + i * 1.05, r = lerp(380, 40, ss((t - i * 0.08) / 1.3));
      if (r > 50) P.glyph(g, kd, 560 + Math.cos(a) * r, 1330 + Math.sin(a) * r * 0.5 - r * 0.3, 90, "#5a3a22");
    });
    if (t > 1.1) sweat(800, 650, 1.3, T);
  }],
  [3.45, (t, d, T) => { // "For centuries, farmers"
    cam(540, 1050, lerp(0.92, 1.0, ss(t / d)), 0, T);
    loess(T, 950);
    [[230, 1600, 0.75, FARMER, 31], [800, 1650, 0.8, FARMER2, 32]].forEach(([x, y, s, o, sd], i) => {
      const dig = Math.sin(T * 6 + i * 2);
      ch(x, y, s, o, { expr: "neutral", prop: ["hoe", 0.5 + 0.5 * dig] }, i ? -1 : 1, T, sd);
      if (dig > 0.6) P.puff(g, x + (i ? -1 : 1) * 260 * s, y + 10, 50, 0.6, "#c79a52");
    });
    screen(); seal("CENTURIES", 330, back((t - 0.15) / 0.3));
  }],
  [5.15, (t, d, T) => { // "near Anyang"
    screen(); cam(lerp(540, 640, ss(t / d)), lerp(780, 720, ss(t / d)), lerp(1.0, 1.25, ss(t / d)), 0, T);
    chinaMap(T);
    pin(680, 720, back((t - 0.05) / 0.25));
    screen(); tag("ANYANG", 540, 330, "#ffd34d", back((t - 0.1) / 0.25) * 1.6);
  }],
  [5.6, (t, d, T) => { // "dug up strange old bones."
    cam(540, 1150, lerp(1.0, 1.12, ss(t / d)), 0, T);
    loess(T, 900);
    g.beginPath(); g.ellipse(540, 1560, 420, 110, 0, 0, Math.PI * 2); g.fillStyle = "#9a6a36"; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
    const up = back((t - 0.25) / 0.5);
    P.bone(g, 560, lerp(1600, 1080, clamp(up, 0, 1.1)), 260, -0.2 + 0.1 * Math.sin(T * 3));
    P.bone(g, 330, 1540, 160, 1.2); P.bone(g, 760, 1530, 150, -1.1);
    if (up > 0.3) { P.burst(g, 560, 1150, 60, 180, ((t - 0.4) * 1.2) % 1, "#fff3b0"); sparkle(560, 1100, 170, T); }
    ch(170, 1900, 0.75, FARMER, { expr: up > 0.5 ? "shock" : "neutral", look: 1, facing: 1 }, 1, T, 31);
    dust(560, 1560, T, 14, "#c79a52", 300);
  }],
  [7.45, (t, d, T) => { // "Medicine shops"
    shopBack(T); cam(540, 1050, lerp(0.95, 1.02, ss(t / d)), 0, T); shop(T);
    ch(540, 1720, 0.95, SHOP, { expr: talk(T, "talk", "smile"), pose: "point", pointUp: 0.5 }, -1, T, 41);
    screen(); seal("MEDICINE SHOP", 1700, back((t - 0.2) / 0.3), 0.03, "#2f6b5a");
  }],
  [9.08, (t, d, T) => { // "dragon bones" — the label they were sold under
    shopBack(T); cam(540, 1000, lerp(1.05, 1.15, ss(t / d)), 0, T); shop(T);
    // dragon spirit made of smoke behind the bone
    g.save(); g.globalAlpha = 0.55 * ss(t / 0.4); g.strokeStyle = "#7fe0b8"; g.lineCap = "round"; g.lineWidth = 60;
    g.beginPath(); for (let i = 0; i <= 40; i++) { const u = i / 40; g.lineTo(140 + u * 800, 760 + 160 * Math.sin(u * 7 + T * 3)); } g.stroke(); g.restore();
    g.save(); g.globalAlpha = 0.7 * ss(t / 0.4); g.beginPath(); g.ellipse(940, 760 + 160 * Math.sin(7 + T * 3), 90, 70, 0, 0, Math.PI * 2); g.fillStyle = "#7fe0b8"; g.fill(); g.restore();
    P.bone(g, 540, 820, 420, 0.1 * Math.sin(T * 2), [], 0, "#efe2c4", 0.8);
    sparkle(540, 900, 220, T);
    screen(); seal("DRAGON BONES", 330, back((t - 0.05) / 0.3), -0.05);
  }],
  [9.85, (t, d, T) => { // "into powder..." — grinding
    shopBack(T); shakeAmt = 5; cam(540, 1250, 1.25, 0, T); shop(T);
    P.mortar(g, 540, 1520, 560, T * 9);
    dust(540, 1250, T * 2, 26, "#d8d2c4", 380);
    P.bone(g, 300 + 20 * Math.sin(T * 9), 1180, 110, 0.6);
    screen(); tag("POWDER", 540, 330, "#ffffff", back((T - 10.2) / 0.25) * 1.5);
  }],
  [10.9, (t, d, T) => { // "and people swallowed it."
    shopBack(T); cam(540, 1050, lerp(1.0, 1.08, ss(t / d)), 0, T); shop(T);
    ch(300, 1780, 0.8, LADY, { expr: t > 0.6 ? "gulp" : "smile", pose: "hold", held: HOLD.bowl }, 1, T, 5);
    ch(800, 1800, 0.85, FARMER2, { expr: t > 0.9 ? "deadpan" : "talk", pose: "hold", held: HOLD.bowl }, -1, T, 32);
    if (t > 0.6) { g.save(); g.font = "900 90px Montserrat"; g.lineWidth = 14; g.strokeStyle = "#111"; g.fillStyle = "#fff"; g.textAlign = "center"; const k = back((t - 0.6) / 0.2); g.translate(300, 860); g.scale(k, k); g.strokeText("GULP!", 0, 0); g.fillText("GULP!", 0, 0); g.restore(); }
  }],
  [12.45, (t, d, T) => { // "Some had odd scratches,"
    screen(); g.fillStyle = "#3a2a22"; g.fillRect(0, 0, W, H);
    cam(540, 960, lerp(1.0, 1.15, ss(t / d)), 0, T);
    P.bone(g, 540, 720, 640, 0.05, [["sun", -40, -60, 1], ["rain", 40, 90, 1], ["person", -70, 140, 1]]);
    // magnifying glass sweeps across
    const mx = lerp(300, 720, ss(t / d)), my = 900 + 60 * Math.sin(T * 2);
    g.beginPath(); g.arc(mx, my, 190, 0, Math.PI * 2); g.fillStyle = "rgba(200,240,255,0.18)"; g.fill(); g.lineWidth = 26; g.strokeStyle = P.INK; g.stroke(); g.lineWidth = 16; g.strokeStyle = "#c9a24a"; g.stroke();
    g.beginPath(); g.moveTo(mx + 135, my + 135); g.lineTo(mx + 300, my + 300); g.lineWidth = 50; g.strokeStyle = P.INK; g.stroke(); g.lineWidth = 34; g.strokeStyle = "#6b3a24"; g.stroke();
    screen(); tag("SCRATCHES?", 540, 330, "#ffd34d", back((T - 13.25) / 0.25) * 1.4);
  }],
  [13.85, (t, d, T) => { // "so the farmers scraped them clean first."
    cam(540, 1100, lerp(1.0, 1.08, ss(t / d)), 0, T);
    loess(T, 820, { sky: "golden" });
    const k = clamp((t - 0.6) / 1.6, 0, 1);
    P.bone(g, 620, 1040, 420, 0.25, [["sun", -40, -60, 1 - k], ["rain", 40, 90, 1 - k], ["person", -70, 140, 1 - k]]);
    const sx = 620 + 120 * Math.sin(T * 10);
    g.save(); g.translate(sx, 1300); g.rotate(-0.5); g.beginPath(); g.moveTo(0, 0); g.lineTo(140, -20); g.lineTo(140, 20); g.closePath(); g.fillStyle = "#c9d0d8"; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke(); g.beginPath(); g.roundRect(-90, -14, 90, 28, 10); g.fillStyle = "#6b3a24"; g.fill(); g.stroke(); g.restore();
    for (let i = 0; i < 10; i++) { const q = (T * 2 + rnd(i, 1)) % 1; g.save(); g.translate(sx + 60 + q * 200 * (rnd(i, 2) - 0.3), 1300 + q * 500); g.rotate(q * 6); g.fillStyle = "#efe2c4"; g.fillRect(-10, -4, 20, 8); g.restore(); }
    face(230, 1500, 1.0, FARMER, { expr: talk(T, "grin", "smile"), look: 1, facing: 1 }, 1, T, 31);
    screen(); tag("SCRAPED CLEAN", 540, 330, "#ffffff", back((T - 15.4) / 0.25) * 1.3);
    tone("golden", 0.1);
  }],
  [16.5, (t, d, T) => { // "Then, in eighteen ninety-nine, a Beijing"
    P.sky(g, W, H, "day"); cam(540, 1050, lerp(0.92, 1.02, ss(t / d)), 0, T);
    P.cloud(g, 120 + T * 10, 420, 1.3); P.cloud(g, 760 - T * 8, 300, 1.1);
    P.hills(g, -2000, 3000, 1000, 60, "#b9c9d6", 3.3);
    g.beginPath(); g.rect(-600, 900, 2300, 330); g.fillStyle = "#8a7a6a"; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke();
    P.crenels(g, -600, 1700, 900, 30, "#8a7a6a", 5);
    P.hall(g, 540, 900, 620, "#b8362e", "#3f7f6a");
    P.ground(g, -3000, 4000, 1230, "#c8b07a");
    for (let i = 0; i < 4; i++) ch(-100 + ((T * 70 + i * 360) % 1400), 1550 + (i % 2) * 120, 0.5, i % 2 ? DEALER : FARMER, { mode: "stroll", phase: T * 1.6 + i }, 1, T, 60 + i);
    P.lantern(g, 120, 1000, 50, 0.06 * Math.sin(T * 2)); P.lantern(g, 960, 1000, 50, 0.06 * Math.sin(T * 2 + 1));
    screen(); seal("1899", 330, back((T - 17.2) / 0.3), -0.04);
    tag("BEIJING", 540, 1760, "#ffd34d", back((T - 18.6) / 0.25) * 1.4);
  }],
  [19.0, (t, d, T) => { // "scholar named Wang Yirong"
    cam(540, 1000, lerp(1.0, 1.08, ss(t / d)), 0, T); study(T);
    face(540, 900, 1.45, WANG, { expr: talk(T, "talk", "smile"), look: 0 }, 1, T, 70);
    screen(); tag("WANG YIRONG", 540, 1700, "#ffd34d", back((T - 19.9) / 0.25) * 1.4);
    tag("SCHOLAR", 540, 330, "#ffffff", back((t - 0.05) / 0.25) * 1.2);
  }],
  [20.55, (t, d, T) => { // "looked closer." — the eye in the lens
    cam(540, 1000, lerp(1.0, 1.5, ss(t / d)), 0, T); study(T);
    face(400, 860, 1.4, WANG, { expr: t > 0.6 ? "shock" : "neutral", look: 1, facing: 1 }, 1, T, 70);
    P.bone(g, 830, 1150, 280, 0.2, [["sun", -40, -60], ["rain", 40, 90]]);
    const mx = 700, my = 860;
    g.beginPath(); g.arc(mx, my, 150, 0, Math.PI * 2); g.fillStyle = "rgba(200,240,255,0.25)"; g.fill(); g.lineWidth = 22; g.strokeStyle = P.INK; g.stroke(); g.lineWidth = 12; g.strokeStyle = "#c9a24a"; g.stroke();
    g.beginPath(); g.moveTo(mx - 110, my + 110); g.lineTo(mx - 240, my + 300); g.lineWidth = 40; g.strokeStyle = P.INK; g.stroke(); g.lineWidth = 26; g.strokeStyle = "#6b3a24"; g.stroke();
    if (t > 0.6) sparkle(830, 1150, 160, T);
  }],
  [21.85, (t, d, T) => { // "Those scratches were writing."
    screen(); g.fillStyle = "#1d2a5c"; g.fillRect(0, 0, W, H);
    cam(540, 960, lerp(1.0, 1.06, ss(t / d)), 0, T);
    P.burst(g, 540, 900, 120, 700, (t * 0.6) % 1, "rgba(255,230,150,0.6)", 16);
    const lift = ss((t - 0.5) / 0.9);
    P.bone(g, 540, 640, 600, 0, [["sun", -40, -60, 1 - lift], ["rain", 40, 90, 1 - lift], ["person", -70, 140, 1 - lift]], 0, "#efe2c4", 0.9);
    if (lift > 0) [["sun", 230], ["rain", 540], ["person", 850]].forEach(([kd, x], i) => { const yy = lerp(900, 1250, lift); P.glyph(g, kd, lerp(540, x, lift), yy + 10 * Math.sin(T * 4 + i), lerp(70, 220, lift), "#ffd34d"); });
    screen(); seal("WRITING!", 330, back((T - 23.0) / 0.3), -0.05, "#c8323a");
  }],
  [23.45, (t, d, T) => { // "Over three thousand years old."
    screen(); g.fillStyle = "#2a1f18"; g.fillRect(0, 0, W, H);
    cam(540, 1000, lerp(1.0, 1.1, ss(t / d)), 0, T);
    // timeline: today -> 1250 BC
    g.beginPath(); g.moveTo(80, 1250); g.lineTo(1000, 1250); g.lineWidth = 14; g.strokeStyle = "#e9d5a8"; g.stroke();
    const k = ss(t / 1.3);
    for (let i = 0; i < 9; i++) { const x = 1000 - i * 115; g.beginPath(); g.moveTo(x, 1220); g.lineTo(x, 1280); g.lineWidth = 8; g.stroke(); }
    pin(1000, 1215, 1, "#2f6b5a"); pin(lerp(1000, 120, k), 1215, 1, "#c8323a");
    tag("TODAY", 960, 1340, "#9fe0c0", 0.9); if (k > 0.95) tag("1200s BC", 220, 1340, "#ffd34d", back((t - 1.3) / 0.25) * 0.9);
    P.bone(g, lerp(1000, 140, k), 1000, 170, 0.2 * Math.sin(T * 6));
    bigNum(Math.round(lerp(0, 3000, easeOut((T - 23.75) / 0.9)) / 10) * 10, "#ffd34d", "YEARS OLD", 1, 420);
  }],
  [25.45, (t, d, T) => { // "Shang kings"
    cam(540, 1050, lerp(1.06, 0.98, ss(t / d)), 0, T); court(T);
    ch(540, 1800, 1.05, KING, { expr: "stern", pose: "point", pointUp: 0.1 }, 1, T, 80);
    ch(180, 1700, 0.6, SOLDIER(1), { expr: "stern" }, 1, T, 81); ch(900, 1700, 0.6, SOLDIER(2), { expr: "stern" }, -1, T, 82);
    screen(); seal("SHANG KINGS", 330, back((t - 0.05) / 0.3), 0.04, "#8a1f2b");
  }],
  [26.45, (t, d, T) => { // "had carved questions"
    cam(540, 1100, lerp(1.1, 1.2, ss(t / d)), 0, T); court(T);
    face(300, 820, 1.2, DIVINER, { expr: "neutral", look: 1, facing: 1 }, 1, T, 90);
    P.shell(g, 700, 1250, 420, 0.1, [["q", -50, -100, 1], ["rain", 50, 60, clamp((t - 0.2) / 0.8, 0, 1)]]);
    const kx = 760 + 40 * Math.sin(T * 12), ky = 1290 + 20 * Math.cos(T * 12);
    g.save(); g.translate(kx, ky); g.rotate(-0.8); g.beginPath(); g.moveTo(0, 0); g.lineTo(90, -14); g.lineTo(90, 14); g.closePath(); g.fillStyle = "#b07a3a"; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke(); g.beginPath(); g.roundRect(90, -12, 120, 24, 8); g.fillStyle = "#6b3a24"; g.fill(); g.stroke(); g.restore();
    qmark(880, 600, 0.8, T);
  }],
  [27.72, (t, d, T) => { // "into turtle shells"
    P.sky(g, W, H, "day"); cam(540, 1100, lerp(1.0, 1.06, ss(t / d)), 0, T);
    P.hills(g, -2000, 3000, 900, 80, "#9ccf7a", 1.2); P.ground(g, -3000, 4000, 1000, "#8cc06a");
    g.beginPath(); g.ellipse(540, 1700, 520, 140, 0, 0, Math.PI * 2); g.fillStyle = "#5fb8d8"; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke();
    P.turtle(g, 360 + t * 60, 1420, 1.5, T * 4);
    P.shell(g, 820, 1100, 300, -0.15 + 0.05 * Math.sin(T * 2), [["q", 0, -60]]);
    screen(); tag("TURTLE SHELLS", 540, 330, "#9fe0c0", back((t - 0.1) / 0.25) * 1.4);
  }],
  [28.82, (t, d, T) => { // "and ox bones."
    P.sky(g, W, H, "day"); cam(540, 1100, lerp(1.0, 1.06, ss(t / d)), 0, T);
    P.hills(g, -2000, 3000, 900, 80, "#cf9f5e", 1.8); P.ground(g, -3000, 4000, 1000, "#d9b26a");
    P.ox(g, 380, 1700, 1.6, T * 3);
    P.bone(g, 850, 820, 260, 0.2 + 0.05 * Math.sin(T * 2), [["q", 0, 40]]);
    screen(); tag("OX BONES", 540, 330, "#ffd34d", back((t - 0.1) / 0.25) * 1.4);
  }],
  [29.78, (t, d, T) => { // "Will it rain?"
    P.sky(g, W, H, "night"); cam(540, 1050, 1.0 + 0.04 * t, 0, T);
    P.hills(g, -2000, 3000, 1100, 100, "#4f6aa8", 2.6); P.ground(g, -3000, 4000, 1250, "#6b5a3a");
    P.cloud(g, 300, 380, 2.2, "#7a86a6"); P.cloud(g, 640, 420, 1.8, "#8a96b6");
    g.strokeStyle = "#9fdcff"; g.lineWidth = 6; for (let i = 0; i < 30; i++) { const x = 180 + rnd(i, 1) * 760, y = 520 + ((T * 900 + rnd(i, 2) * 600) % 700); g.beginPath(); g.moveTo(x, y); g.lineTo(x - 8, y + 40); g.stroke(); }
    ch(540, 1800, 0.95, KING, { expr: "talk", look: 0, headTilt: -0.12 }, 1, T, 80);
    P.glyph(g, "rain", 840, 1000, 150, "#ffd34d"); qmark(950, 900, 0.5, T);
  }],
  [30.62, (t, d, T) => { // "Will we win?"
    P.sky(g, W, H, "golden"); shakeAmt = 6; cam(540, 1100, lerp(1.0, 1.12, ss(t / d)), 0, T);
    P.hills(g, -2000, 3000, 950, 90, "#cf9f5e", 2.6); P.ground(g, -3000, 4000, 1050, "#d9b26a");
    for (let i = 0; i < 7; i++) { const x = -150 + i * 200 + t * 300, y = 1450 + (i % 2) * 160; ch(x, y, 0.55, SOLDIER(i), { expr: talk(T, "yell", "shout", i), mode: "fall", phase: T * 2 + i }, 1, T, 100 + i); }
    P.banner(g, 900, 1300, 520, "#8a1f2b", "#d9a73a", T, 1.2);
    speedLines(T, 8); P.glyph(g, "king", 900, 450, 150, "#ffd34d"); qmark(540, 450, 0.6, T);
  }],
  [31.4, (t, d, T) => { // "Is a dead ancestor"
    cam(540, 1050, lerp(1.0, 1.05, ss(t / d)), 0, T); court(T);
    ch(380, 1800, 0.95, KING, { expr: "pained", pose: "cheek" }, 1, T, 80);
    g.save(); g.globalAlpha = 0.6 * ss(t / 0.4); ch(780, 1350 + 30 * Math.sin(T * 3), 0.75, GHOST, { expr: "grin", pose: "point", pointUp: -0.1 }, -1, T, 85); g.restore();
    screen(); tag("ANCESTOR", 780, 330, "#bfe3ff", back((T - 32.1) / 0.25) * 1.3);
  }],
  [32.6, (t, d, T) => { // "causing my toothache?"
    cam(540, 1000, lerp(1.25, 1.35, ss(t / d)), 0.02 * Math.sin(T * 9), T); court(T);
    face(500, 900, 1.5, KING, { expr: talk(T, "pained", "shout2"), pose: "cheek" }, 1, T, 80);
    const k = 1 + 0.12 * Math.sin(T * 14);
    g.save(); g.translate(860, 650); g.scale(k, k); g.beginPath(); g.moveTo(-50, -60); g.quadraticCurveTo(0, -90, 50, -60); g.quadraticCurveTo(70, 10, 40, 70); g.lineTo(20, 20); g.lineTo(-20, 20); g.lineTo(-40, 70); g.quadraticCurveTo(-70, 10, -50, -60); g.fillStyle = "#fffdf4"; g.fill(); g.lineWidth = 8; g.strokeStyle = P.INK; g.stroke(); g.restore();
    P.burst(g, 860, 650, 90, 170, (T * 1.5) % 1, "#ff5a4a", 8);
    screen(); tag("TOOTHACHE?", 540, 1700, "#ff8a6a", back((T - 33.37) / 0.25) * 1.3);
  }],
  [34.22, (t, d, T) => { // "Then a diviner pushed fire into the bone..."
    cam(540, 1150, lerp(1.0, 1.2, ss(t / d)), 0, T); court(T);
    ch(250, 1850, 0.9, DIVINER, { expr: t > 1.2 ? "stern" : "talk", look: 1, facing: 1 }, 1, T, 90);
    P.bone(g, 760, 1000, 330, 0.15, [["rain", 20, 60]]);
    const push = ss((t - 0.5) / 0.9);
    P.hotRod(g, 330, 1350, lerp(560, 740, push), lerp(1300, 1180, push), 0.6 + 0.4 * Math.sin(T * 12));
    if (T > 35.45) { P.flame(g, 740, 1180, 160, T); P.burst(g, 740, 1150, 50, 200, ((T - 35.45) * 1.5) % 1, "#ffb43a"); }
    screen(); tag("DIVINER", 540, 330, "#ffffff", back((T - 34.7) / 0.25) * 1.3);
    if (T > 35.45) tag("FIRE", 760, 760, "#ffb43a", back((T - 35.45) / 0.2) * 1.5);
    tone("fire", 0.08);
  }],
  [36.5, (t, d, T) => { // "and read the cracks."
    screen(); g.fillStyle = "#2a1416"; g.fillRect(0, 0, W, H);
    shakeAmt = t < 0.8 ? 6 : 0; cam(540, 900, lerp(1.0, 1.15, ss(t / d)), 0, T);
    P.bone(g, 540, 600, 640, 0, [["rain", -60, 0], ["q", -60, 160]], clamp(t / 0.9, 0, 1), "#efe2c4", 0.6);
    face(820, 1380, 0.9, DIVINER, { expr: t > 0.8 ? "shock" : "neutral", look: -1, facing: -1 }, -1, T, 90);
    screen(); seal("卜  CRACK!", 330, back((T - 37.3) / 0.25), -0.05);
  }],
  [38.15, (t, d, T) => { // "Legend says Wang found them" — sick in bed (legend, sepia)
    cam(540, 1050, lerp(1.0, 1.06, ss(t / d)), 0, T); study(T);
    g.beginPath(); g.rect(80, 1300, 920, 200); g.fillStyle = "#8a4a2a"; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
    face(330, 1130 + 6 * Math.sin(T * 30), 1.0, WANG, { expr: "pained" }, 1, T, 70);
    g.beginPath(); g.moveTo(120, 1300); g.quadraticCurveTo(540, 1180, 980, 1300); g.lineTo(980, 1420); g.lineTo(120, 1420); g.closePath(); g.fillStyle = "#c8323a"; g.fill(); g.lineWidth = 7; g.stroke();
    g.beginPath(); g.rect(60, 1420, 960, 520); g.fillStyle = "#6b3a24"; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke(); for (let i = 0; i < 4; i++) { g.beginPath(); g.rect(110 + i * 230, 1480, 170, 120); g.lineWidth = 5; g.stroke(); }
    sweat(520, 900, 1.2, T); sweat(160, 950, 1.0, T + 0.5);
    ch(820, 1850, 0.7, SHOP, { expr: "talk", pose: "hold", held: HOLD.bowl }, -1, T, 41);
    tone("sepia", 1); tone("golden", 0.12); screen(); seal("THE LEGEND", 300, back((t - 0.1) / 0.3), 0.04, "#6e4a2a");
  }],
  [39.85, (t, d, T) => { // "in his malaria medicine." — mosquito + bowl
    cam(540, 1100, lerp(1.2, 1.3, ss(t / d)), 0, T); study(T);
    bowl(540, 1250, 520); P.bone(g, 600, 1060, 180, 0.6, [["sun", 0, 40]]);
    const mx = 540 + 280 * Math.sin(T * 3), my = 760 + 120 * Math.sin(T * 5);
    g.save(); g.translate(mx, my); g.beginPath(); g.ellipse(0, 0, 40, 16, 0.2, 0, Math.PI * 2); g.fillStyle = "#4a3a3a"; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke();
    g.globalAlpha = 0.7; [-1, 1].forEach((s) => { g.beginPath(); g.ellipse(-6, -20 * s * Math.abs(Math.sin(T * 40)), 26, 12, 0.4 * s, 0, Math.PI * 2); g.fillStyle = "#e8f6ff"; g.fill(); g.stroke(); }); g.globalAlpha = 1;
    g.beginPath(); g.moveTo(40, 4); g.lineTo(80, 14); g.stroke(); g.restore();
    tone("sepia", 1); tone("golden", 0.12); screen(); tag("MALARIA", 540, 330, "#fff1c4", back((T - 40.3) / 0.25) * 1.4);
  }],
  [41.6, (t, d, T) => { // "More likely, an antiques dealer" — the legend card gets crossed out, then the real scene
    if (t < 0.55) {
      SHOTS[27][1](1.7, 1.75, 41.55); screen();
      const k = ss(t / 0.35); g.lineCap = "round"; g.lineWidth = 46; g.strokeStyle = "#e0352b";
      g.beginPath(); g.moveTo(160, 500); g.lineTo(lerp(160, 920, k), lerp(500, 1400, k)); g.stroke();
      if (t > 0.18) { const k2 = ss((t - 0.18) / 0.3); g.beginPath(); g.moveTo(920, 500); g.lineTo(lerp(920, 160, k2), lerp(500, 1400, k2)); g.stroke(); }
      return;
    }
    cam(540, 1050, lerp(0.96, 1.04, ss(t / d)), 0, T); study(T);
    ch(330, 1800, 0.9, DEALER, { expr: talk(T, "grin", "talk"), pose: "hold", held: HOLD.box }, 1, T, 95);
    ch(820, 1820, 0.9, WANG, { expr: "smile", look: -1, facing: -1 }, -1, T, 70);
    sparkle(330, 1150, 120, T);
    screen(); seal("MORE LIKELY", 330, back((t - 0.6) / 0.3), -0.04, "#2f6b5a"); tag("ANTIQUES DEALER", 540, 1700, "#ffd34d", back((T - 42.62) / 0.25) * 1.2);
  }],
  [43.35, (t, d, T) => { // "sold them to him." — coins change hands
    cam(540, 1050, lerp(1.15, 1.25, ss(t / d)), 0, T); study(T);
    face(250, 900, 1.15, DEALER, { expr: "laugh" }, 1, T, 95);
    face(830, 900, 1.15, WANG, { expr: "grin", look: -1, facing: -1 }, -1, T, 70);
    for (let i = 0; i < 5; i++) { const k = clamp((t - i * 0.12) / 0.6, 0, 1); const x = lerp(760, 320, k), y = lerp(1500, 1500, k) - Math.sin(k * Math.PI) * 300; g.beginPath(); g.ellipse(x, y, 40, 40, 0, 0, Math.PI * 2); g.fillStyle = "#e0b64a"; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke(); g.beginPath(); g.rect(x - 10, y - 10, 20, 20); g.fillStyle = "#7a5a1a"; g.fill(); }
    P.bone(g, lerp(330, 760, ss(t / 0.8)), 1350, 170, 0.3, [["person", 0, 40]]);
  }],
  [44.85, (t, d, T) => { // "Since then, over a hundred thousand pieces have surfaced."
    cam(540, 1150, lerp(0.95, 1.05, ss(t / d)), 0, T); digSite(T);
    for (let i = 0; i < 4; i++) ch(170 + i * 250, 1650 + (i % 2) * 150, 0.55, DIGGER(i), { expr: i % 2 ? "grin" : "shock", prop: ["hoe", 0.5 + 0.5 * Math.sin(T * 6 + i)] }, i % 2 ? -1 : 1, T, 110 + i);
    for (let i = 0; i < 14; i++) { const k = ((T * 0.7 + rnd(i, 1)) % 1); P.bone(g, 100 + rnd(i, 2) * 880, lerp(1500, 700, k), 70, T * 3 + i); }
    bigNum(Math.round(lerp(1000, 100000, easeOut((T - 45.6) / 1.4)) / 100) * 100, "#ffd34d", "PIECES", 1, 380);
    screen(); tag("1928 → TODAY", 540, 1820, "#ffffff", 0);
  }],
  [48.35, (t, d, T) => { // "And many of those symbols" — ancient glyphs line up
    screen(); g.fillStyle = "#1d2a5c"; g.fillRect(0, 0, W, H);
    cam(540, 960, lerp(1.0, 1.05, ss(t / d)), 0, T);
    ["sun", "moon", "person", "tree", "mountain", "rain"].forEach((kd, i) => {
      const x = 230 + (i % 3) * 310, y = 640 + Math.floor(i / 3) * 520, k = back((t - i * 0.12) / 0.3);
      if (k <= 0) return; g.save(); g.translate(x, y); g.scale(k, k); P.bone(g, 0, -40, 300, 0.08 * Math.sin(T * 2 + i), [[kd, 0, 40]]); g.restore();
    });
    screen(); tag("SYMBOLS", 540, 300, "#ffd34d", back((T - 49.41) / 0.25) * 1.4);
  }],
  [50.3, (t, d, T) => { // "still live inside Chinese characters" — old glyph morphs into the modern character
    screen(); g.fillStyle = "#f4ead2"; g.fillRect(0, 0, W, H);
    cam(540, 960, lerp(0.97, 1.06, ss(t / d)), 0.01 * Math.sin(T * 1.5), T);
    const pairs = [["sun", "日"], ["moon", "月"], ["person", "人"], ["tree", "木"]];
    const k = ss((t - 0.3) / 0.6);
    pairs.forEach(([kd, zh], i) => {
      const y = 560 + i * 330;
      P.glyph(g, kd, 280, y, 190, "#5a3a22");
      g.beginPath(); g.moveTo(420, y); g.lineTo(lerp(420, 620, k), y); g.lineWidth = 12; g.strokeStyle = "#c8323a"; g.lineCap = "round"; g.stroke();
      if (k > 0.9) { g.beginPath(); g.moveTo(600, y - 30); g.lineTo(630, y); g.lineTo(600, y + 30); g.stroke(); }
      g.globalAlpha = k; g.fillStyle = "#1c1a22"; g.font = `900 210px ${CJK}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(zh, 810, y + 10); g.globalAlpha = 1;
    });
    screen(); tag("1200 BC", 280, 280, "#c8323a", 1); tag("TODAY", 810, 280, "#2f6b5a", back((t - 0.6) / 0.25));
  }],
  [51.65, (t, d, T) => { // "today." — a kid reads the same character on a tablet
    cam(540, 1050, lerp(1.0, 1.08, ss(t / d)), 0, T); street(T);
    ch(540, 1780, 1.05, KID, { expr: talk(T, "grin", "smile"), pose: "hold", held: HOLD.tablet }, 1, T, 120);
    sparkle(560, 1150, 160, T, "#ffe08a");
  }],
  [52.5, (t, d, T) => { // "China's oldest library"
    cam(540, 1000, lerp(0.95, 1.05, ss(t / d)), 0, T);
    screen(); g.fillStyle = "#3a2418"; g.fillRect(0, 0, W, H); cam(540, 1000, lerp(0.95, 1.05, ss(t / d)), 0, T);
    for (let r = 0; r < 5; r++) {
      g.beginPath(); g.rect(60, 330 + r * 300, 960, 26); g.fillStyle = "#8a5a34"; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke();
      for (let i = 0; i < 7; i++) P.bone(g, 130 + i * 135, 180 + r * 300 + 6 * Math.sin(T * 2 + i + r), 105, 0.1 * (rnd(i, r) - 0.5), [[["sun", "rain", "person", "tree", "moon"][(i + r) % 5], 0, 40]]);
    }
    screen(); seal("OLDEST LIBRARY", 1730, back((t - 0.4) / 0.3), 0.03, "#2f6b5a");
  }],
  [54.15, (t, d, T) => { // "was almost eaten," — chomp
    shopBack(T); shakeAmt = t > 0.35 && t < 0.6 ? 10 : 0; cam(540, 1000, 1.25, 0, T); shop(T);
    face(540, 900, 1.6, FARMER2, { expr: t < 0.35 ? "shout" : "laugh" }, 1, T, 32);
    if (t < 0.4) P.bone(g, 540, lerp(1700, 1100, ss(t / 0.4)), 160, 0.3, [["sun", 0, 40]]);
    else { for (let i = 0; i < 12; i++) { const k = (t - 0.4) * 1.6; g.save(); g.translate(540 + (rnd(i, 1) - 0.5) * 500 * k, 1180 + k * 400 * rnd(i, 2)); g.rotate(i + k * 5); g.fillStyle = "#efe2c4"; g.fillRect(-14, -8, 28, 16); g.lineWidth = 4; g.strokeStyle = P.INK; g.strokeRect(-14, -8, 28, 16); g.restore(); }
      g.save(); g.font = "900 120px Montserrat"; g.textAlign = "center"; g.lineWidth = 16; g.strokeStyle = "#111"; g.fillStyle = "#ff8a3d"; const k = back((t - 0.4) / 0.2); g.translate(640, 520); g.scale(k, k); g.strokeText("CHOMP!", 0, 0); g.fillText("CHOMP!", 0, 0); g.restore(); }
  }],
  [55.1, (t, d, T) => { // "one spoonful at a time."
    shopBack(T); cam(540, 1000, lerp(1.0, 1.06, ss(t / d)), 0, T); shop(T);
    const n = Math.min(12, 1 + Math.floor(t * 6));
    for (let i = 0; i < n; i++) { const k = back((t - i / 6) / 0.2); g.save(); g.translate(230 + (i % 4) * 210, 760 + Math.floor(i / 4) * 330); g.scale(k, k); spoon(0, 0, 0.9, -0.2); g.restore(); }
    P.bone(g, 540, 1500, 260 * (1 - clamp(t / d, 0, 0.85)), 0.2, [["sun", 0, 40]]);
    screen(); bigNum(n, "#ffffff", "SPOONFULS", 1, 330);
  }],
  [57.2, (t, d, T) => { // "History's biggest clues often hide"
    screen(); g.fillStyle = "#3d302b"; g.fillRect(0, 0, W, H);
    cam(lerp(540, 600, ss(t / d)), 1150, lerp(0.95, 1.2, ss(t / d)), 0, T);
    // junk pile: crates, pots, broken chair, one glowing bone
    [[200, 1500, 260, "#8a5a34"], [520, 1560, 320, "#7a4a2a"], [860, 1500, 240, "#9a6a3a"], [380, 1280, 200, "#6b4a2a"], [700, 1300, 220, "#8a5a34"]].forEach(([x, y, w, c]) => { g.beginPath(); g.rect(x - w / 2, y - w * 0.7, w, w * 0.7); g.fillStyle = c; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke(); g.beginPath(); g.moveTo(x - w / 2, y - w * 0.7); g.lineTo(x + w / 2, y); g.lineWidth = 4; g.stroke(); });
    ding(250, 1230, 120); bowl(860, 1230, 180, "#c9d0d8");
    P.bone(g, 600, 1030, 200, 0.4, [["sun", 0, 40]], 0, "#efe2c4", 0.6 + 0.4 * Math.sin(T * 4));
    sparkle(600, 1100, 150, T);
    screen(); tag("CLUES", 540, 330, "#ffd34d", back((T - 58.28) / 0.25) * 1.4);
  }],
  [59.35, (t, d, T) => { // "in what we call junk."
    cam(540, 1050, lerp(1.0, 1.08, ss(t / d)), 0, T); street(T);
    g.beginPath(); g.rect(720, 1450, 260, 330); g.fillStyle = "#5a6b7a"; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
    ch(380, 1800, 0.95, KID, { expr: t > 0.8 ? "shock" : "deadpan", wave: t < 0.6 ? 1 : undefined }, 1, T, 120);
    const k = clamp(t / 0.7, 0, 1); P.bone(g, lerp(560, 850, k), lerp(1050, 1350, k) - Math.sin(k * Math.PI) * 300, 150, k * 5, [["sun", 0, 40]]);
    if (t > 0.8) sparkle(850, 1400, 130, T);
    screen(); seal("JUNK?", 330, back((T - 60.22) / 0.25), -0.05);
  }],
  [60.95, (t, d, T) => { // "If you could ask the bones one question,"
    screen(); g.fillStyle = "#2a1416"; g.fillRect(0, 0, W, H);
    cam(540, 1000, lerp(1.0, 1.1, ss(t / d)), 0, T);
    P.bone(g, 540, 660, 520, 0.05 * Math.sin(T * 2), [["q", 0, 40]], clamp((t - 0.8) / 1.0, 0, 1), "#efe2c4", 0.7);
    P.flame(g, 300, 1650, 180, T); P.flame(g, 780, 1650, 160, T + 1);
    screen(); tag("YOUR QUESTION?", 540, 1720, "#ffd34d", back((T - 62.38) / 0.25) * 1.3);
  }],
  [62.95, (t, d, T) => { // "what would it be?" — Wang points at the viewer
    cam(540, 1000, lerp(1.0, 1.1, ss(t / d)), 0, T); study(T);
    ch(500, 1850, 1.15, WANG, { expr: talk(T, "talk", "grin"), pose: "point", pointUp: 0.35 }, 1, T, 70);
    qmark(860, 520, 1.0, T);
    screen(); seal("COMMENT ↓", 330, back((t - 0.4) / 0.3), -0.04, "#2f6b5a");
  }],
];
const SH = SHOTS.map((s) => s[0]);

// ---------------- captions (jade accent on key words, new for this story) ----------------
const allWords = segs.flatMap((s) => s.words);
const KEY = /^(china|history|anyang|bones|dragon|powder|swallowed|scratches|scraped|1899|eighteen|ninety|beijing|wang|yirong|writing|three|thousand|shang|kings|turtle|ox|rain|win|ancestor|toothache|fire|cracks|legend|malaria|dealer|hundred|symbols|chinese|library|eaten|spoonful|junk|question)/i;
function captions(T) {
  let w = null;
  for (let i = 0; i < allWords.length; i++) {
    const a = allWords[i], next = allWords[i + 1];
    const end = next && next.t0 - a.t1 < 0.25 ? next.t0 : a.t1 + 0.12;
    if (T >= a.t0 - 0.03 && T < end) { w = a; break; }
  }
  if (!w) return;
  screen();
  const txt = w.w.replace(/\.\.\./g, "").replace(/[.,]$/g, "");
  const pop = back((T - w.t0 + 0.03) / 0.12);
  g.save(); g.translate(W / 2, H * 0.6); g.scale(0.85 + 0.15 * pop, 0.85 + 0.15 * pop);
  g.font = "900 104px Montserrat"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
  g.lineWidth = 22; g.strokeStyle = "#111"; g.strokeText(txt, 0, 0);
  g.fillStyle = KEY.test(txt.replace(/[^A-Za-z0-9]/g, "")) ? "#6ff0c0" : "#ffffff"; g.fillText(txt, 0, 0);
  g.restore();
}

// ---------------- frame ----------------
window.SHOT_STARTS = SH;
window.renderFrame = (f) => {
  const T = f / FPS;
  let i = SH.length - 1; while (i > 0 && T < SH[i]) i--;
  const t = T - SH[i], d = (i + 1 < SH.length ? SH[i + 1] : DUR) - SH[i];
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
  shakeAmt = 0;
  SHOTS[i][1](t, d, T);
  screen();
  const fl = [16.5, 21.85, 48.35].map((s) => clamp(1 - Math.abs(T - s) / 0.12, 0, 1)).reduce((a, b) => Math.max(a, b), 0);
  if (fl > 0) { g.fillStyle = `rgba(255,255,255,${fl})`; g.fillRect(0, 0, W, H); }
  const v = g.createRadialGradient(W / 2, H / 2, 600, W / 2, H / 2, 1250); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.28)");
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  captions(T);
  return true;
};
window.ready = true;
