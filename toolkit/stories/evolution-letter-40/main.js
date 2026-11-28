import { Pen, bodyFront } from "./toon.js";
import * as P from "./paint.js";
const { clamp, lerp, ss, easeOut, back, rnd } = P;

export const W = 1080, H = 1920, FPS = 30;
const cv = document.getElementById("c"); cv.width = W; cv.height = H;
const g = cv.getContext("2d");



const blink = (T, seed) => ((T + seed * 0.77) % 3.4) < 0.11;
const talk = (T, a, b, seed = 0) => (Math.floor(T * 7 + seed) % 2 ? a : b);
function ch(x, y, s, o, opts = {}, flip = 1, T = 0, seed = 1) {
  g.save(); g.translate(x, y);
  if (!opts.noShadow) P.shadow(g, 0, 0, 120 * s, 0.22);
  g.scale(s * flip, s); g.translate(-300, -975);
  const idle = opts.mode === "march" || opts.mode === "stroll" ? 0 : 0.025 * Math.sin(T * 2.1 + seed * 1.7);
  bodyFront(new Pen(g), o, { mode: "stand", seed, blink: blink(T, seed), tilt: idle, headTilt: idle * 1.5, ...opts });
  g.restore();
}
const face = (x, hy, s, o, opts, flip, T, seed) => ch(x, hy + 670 * s, s, o, { noShadow: true, ...opts }, flip, T, seed);

// ---------------- timing ----------------
const segs = window.SEGS;
export const DUR = window.DUR;
for (const s of segs) {
  const ws = s.text.split(/\s+/), weights = ws.map((w) => w.replace(/[^A-Za-z0-9]/g, "").length + 1.5 + (/[.,?:]$/.test(w) ? 2 : 0));
  const tot = weights.reduce((a, b) => a + b, 0); let t = s.start;
  s.words = ws.map((w, i) => { const d = ((s.end - s.start) * weights[i]) / tot; const o = { w, t0: t, t1: t + d }; t += d; return o; });
}
const T_ = (word, nth = 0) => { let k = 0; for (const s of segs) for (const ww of s.words) if (ww.w.normalize("NFD").toLowerCase().replace(/[^a-z0-9]/g, "") === word) { if (k++ === nth) return ww.t0; } return 1e9; };
const SEG = (i) => (segs[i] ? segs[i].start : 1e9);

// ---------------- camera & fx ----------------
let shakeAmt = 0;
function cam(cx, cy, z, roll = 0, T = 0) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.translate(W / 2, H / 2); g.rotate(roll); g.scale(z, z);
  const sx = shakeAmt ? shakeAmt * (rnd(Math.floor(T * 30), 1) - 0.5) : 0, sy = shakeAmt ? shakeAmt * (rnd(Math.floor(T * 30), 2) - 0.5) : 0;
  g.translate(-cx + sx, -cy + sy);
}
const screen = () => g.setTransform(1, 0, 0, 1, 0, 0);
const push = (t, d, cx = 540, cy = 1000, z0 = 1.0, z1 = 1.07, T = 0) => cam(cx, cy, lerp(z0, z1, 0.5 * ss(t / d) + 0.5 * clamp(t / d, 0, 1)), 0, T); // half-linear: never settles into a freeze
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
function speedLines(T, n = 14, col = "rgba(255,255,255,0.75)", dir = 1) {
  screen(); g.strokeStyle = col; g.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const y = rnd(i, 3) * H, len = 200 + rnd(i, 4) * 300, x0 = ((T * 2600 + rnd(i, 5) * 2000) % (W + len * 2)) - len, x = dir > 0 ? W - x0 : x0;
    g.lineWidth = 6 + rnd(i, 6) * 8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y); g.stroke();
  }
}
function confetti(T, t0, n = 60) {
  screen(); const cols = [TERRA, SUNY, COBALT, "#ffffff", OLIVE, CYAN];
  for (let i = 0; i < n; i++) { const k = (T - t0) * (0.35 + rnd(i, 1) * 0.35) + rnd(i, 2), y = (k % 1) * (H + 200) - 100, x = rnd(i, 3) * W + 40 * Math.sin(T * 2 + i);
    g.save(); g.translate(x, y); g.rotate(T * 4 + i); g.fillStyle = cols[i % 6]; g.fillRect(-12, -6, 24, 12); g.restore(); }
}
function qmark(x, y, s, T, col = SUNY) {
  g.save(); g.translate(x, y + 8 * Math.sin(T * 5)); g.rotate(0.08 * Math.sin(T * 3)); g.scale(s, s);
  g.font = "900 200px Montserrat"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round"; g.lineWidth = 22; g.strokeStyle = "#111"; g.strokeText("?", 0, 0); g.fillStyle = col; g.fillText("?", 0, 0); g.restore();
}
function bigNum(n, col, label, pop = 1, y = 330) {
  if (pop <= 0) return;
  screen(); g.save(); g.translate(W / 2, y); const k = clamp(pop, 0, 1.3); g.scale(k, k);
  g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
  g.font = "900 170px Montserrat"; g.lineWidth = 26; g.strokeStyle = "#111"; const s = typeof n === "number" ? n.toLocaleString("en-US") : n;
  g.strokeText(s, 0, 0); g.fillStyle = col; g.fillText(s, 0, 0);
  if (label) { g.font = "900 64px Montserrat"; g.lineWidth = 16; g.strokeText(label, 0, 120); g.fillStyle = "#fff"; g.fillText(label, 0, 120); }
  g.restore();
}
function tag(txt, x, y, col, k = 1, size = 60) {
  if (k <= 0) return;
  g.save(); g.translate(x, y); g.scale(k, k); g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
  g.font = `900 ${size}px Montserrat`; g.lineWidth = size / 3.7; g.strokeStyle = "#111"; g.strokeText(txt, 0, 0); g.fillStyle = col; g.fillText(txt, 0, 0); g.restore();
}
function stamp(txt, x, y, k, col = "#d8323a", rot = -0.12, size = 110) {
  if (k <= 0) return; g.save(); g.translate(x, y); g.rotate(rot); const s = k < 1 ? lerp(2.4, 1, easeOut(k)) : 1; g.scale(s, s); g.globalAlpha = clamp(k * 2, 0, 1);
  g.font = `900 ${size}px Montserrat`; g.textAlign = "center"; g.textBaseline = "middle"; const w = g.measureText(txt).width + 70;
  g.lineWidth = 12; g.strokeStyle = col; g.strokeRect(-w / 2, -size * 0.72, w, size * 1.44); g.fillStyle = col; g.fillText(txt, 0, 6); g.restore();
}
function bigX(x, y, r, k, col = "#e0303a") {
  if (k <= 0) return; g.save(); g.translate(x, y); g.lineCap = "round";
  for (const [i, d] of [[0, 1], [1, -1]]) { const kk = clamp(k * 2 - i, 0, 1); if (kk <= 0) continue; g.beginPath(); g.moveTo(-r * d, -r); g.lineTo(-r * d + 2 * r * d * kk, -r + 2 * r * kk);
    g.lineWidth = r * 0.34; g.strokeStyle = "#111"; g.stroke(); g.lineWidth = r * 0.22; g.strokeStyle = col; g.stroke(); }
  g.restore();
}
function check(x, y, r, k, col = "#3fbf5a") {
  if (k <= 0) return; g.save(); g.translate(x, y); g.lineCap = "round"; g.lineJoin = "round"; const kk = clamp(k, 0, 1);
  g.beginPath(); g.moveTo(-r, 0); g.lineTo(-r * 0.3, r * 0.7); if (kk > 0.4) g.lineTo(-r * 0.3 + r * 1.3 * (kk - 0.4) / 0.6, r * 0.7 - r * 1.6 * (kk - 0.4) / 0.6);
  g.lineWidth = r * 0.36; g.strokeStyle = "#111"; g.stroke(); g.lineWidth = r * 0.24; g.strokeStyle = col; g.stroke(); g.restore();
}
function pin(x, y, k, col = TERRA, label = "", lc = "#fff") {
  if (k <= 0) return; g.save(); g.translate(x, y); g.scale(k, k); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-40, -50, -40, -95, 0, -95); g.bezierCurveTo(40, -95, 40, -50, 0, 0);
  g.fillStyle = col; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke(); g.beginPath(); g.arc(0, -62, 14, 0, Math.PI * 2); g.fillStyle = "#fff"; g.fill(); g.restore();
  if (label) tag(label, x, y - 150 * k, lc, k, 60);
}

// « The Letter That Scared Darwin » — Alfred Russel Wallace's Ternate letter (Feb 1858), the joint Linnean reading (1 July 1858)
// that nobody noticed, and the 1859 presidential report that called the year free of "striking discoveries".
// Structure: COLD OPEN ON THE ENDING (May 1859 verdict) → "rewind" by calendar pages flying backwards → the story → callback.
// Palette: Victorian parlour (oxblood wallpaper / mahogany / brass / parchment) against Ternate rainforest (emerald, birdwing
// orange, volcano grey, turquoise sea). Caption accent: orchid magenta. New labels: report() (society minutes page that writes
// itself), quoteCard() (handwritten letter quote), calendar flight backwards, Zzz.
const WINE = "#7a2a36", MAHOG = "#5a321e", BRASS = "#d8b04a", PARCH = "#f6efd9", EMER = "#2f8a4a", BIRD = "#ffa51f", ORCHID = "#ff4fa3", TURQ = "#3fbfc0", INKB = "#1e2a4a";
const TERRA = WINE, SUNY = BIRD, COBALT = INKB, OLIVE = EMER, CYAN = ORCHID;

// ---------------- cast ----------------
const BELL = { jacket: "#1e1c24", pants: "#1e1c24", boots: "#1a1416", hat: "bald", hair: "#ecebe6", sideburns: "#ecebe6", skin: "#f2d6c0", tie: "#f2efe6", build: "stout", glasses: true };
const DARWIN = { jacket: "#2e2e3a", pants: "#2e2e3a", boots: "#1a1416", hat: "bald", hair: "#7a6a5a", sideburns: "#7a6a5a", skin: "#f3d6bc", tie: "#f2efe6" };
const DARWIN_PALE = { ...DARWIN, skin: "#dfe8d4" };
const WALLACE = { jacket: "#d8ccb0", pants: "#b8a880", boots: "#5a3a24", hat: "hair", hair: "#6a4a30", beard: "#6a4a30", glasses: true, skin: "#f0d0b0" };
const WAL_HAT = { ...WALLACE, hat: "safari", cap: "#ece2c4", band: "#6a4a30" };
const WAL_SICK = { ...WALLACE, skin: "#e6dcb0" };
const LYELL = { jacket: "#3a2a4a", pants: "#2a2230", boots: "#1a1416", hat: "bald", hair: "#b8b0a8", sideburns: "#b8b0a8", skin: "#f0d2ba", tie: "#f2efe6" };
const HOOKER = { jacket: "#2a3a4a", pants: "#2a2a30", boots: "#1a1416", hat: "hair", hair: "#2a2020", sideburns: "#2a2020", glasses: true, skin: "#f3d6bc", tie: "#f2efe6" };
const FELLOW = (v) => ({ jacket: ["#2a2630", "#3a2a2a", "#2a3240", "#33302a"][v % 4], pants: "#2a2630", boots: "#1a1416", tie: "#f2efe6",
  hat: ["tophat", "bald", "hair", "bald", "hair"][v % 5], hair: ["#5a4a3a", "#d8d4cc", "#3a2a20", "#9a8a7a", "#8a5a3a"][v % 5],
  sideburns: v % 3 ? ["#5a4a3a", "#d8d4cc", "#3a2a20", "#9a8a7a", "#8a5a3a"][v % 5] : null, moustache: v % 3 === 0 ? "#4a3a2a" : null,
  skin: ["#f2d6c0", "#eec6a0", "#f6dcc4", "#e8c4a4", "#f0cfa8"][v % 5], glasses: v % 4 === 1 });

// ---------------- story helpers ----------------
/** NEW label: page of the society's minutes; lines = [[text, k, col]] written by hand; stamp-ready */
function report(lines, x, y, k, rot = -0.04, w = 860, head = "LINNEAN SOCIETY — 1858-59") {
  if (k <= 0) return; g.save(); g.translate(x, y); g.rotate(rot); const s = k < 1 ? lerp(0.6, 1, back(k)) : 1; g.scale(s, s);
  const h = 170 + lines.length * 104; g.beginPath(); g.rect(-w / 2 + 16, -h / 2 + 14, w, h); g.fillStyle = "rgba(0,0,0,0.25)"; g.fill();
  g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.fillStyle = PARCH; g.fill(); g.lineWidth = 10; g.strokeStyle = P.INK; g.stroke();
  g.beginPath(); g.rect(-w / 2 + 18, -h / 2 + 18, w - 36, h - 36); g.lineWidth = 3; g.strokeStyle = BRASS; g.stroke();
  g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 34px Montserrat"; g.fillStyle = WINE; g.fillText(head, 0, -h / 2 + 64);
  g.textAlign = "left"; g.textBaseline = "alphabetic";
  lines.forEach(([txt, kk, col], i) => { if (kk <= 0) return; const n = Math.round(txt.length * clamp(kk, 0, 1));
    g.font = "italic 700 62px 'Noto Serif CJK SC', serif"; const tw = g.measureText(txt).width; g.fillStyle = col ?? INKB; g.fillText(txt.slice(0, n), -tw / 2, -h / 2 + 170 + i * 104); });
  g.restore();
}
/** handwritten quote card (letter paper with a quill line) */
function quoteCard(lines, x, y, k, rot = 0.03, w = 900) {
  if (k <= 0) return; g.save(); g.translate(x, y); g.rotate(rot); const s = k < 1 ? lerp(0.7, 1, back(k)) : 1; g.scale(s, s);
  const h = 120 + lines.length * 100; g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.fillStyle = "#faf4e4"; g.fill(); g.lineWidth = 9; g.strokeStyle = P.INK; g.stroke();
  for (let i = 0; i < lines.length; i++) { g.beginPath(); g.moveTo(-w / 2 + 40, -h / 2 + 128 + i * 100); g.lineTo(w / 2 - 40, -h / 2 + 128 + i * 100); g.lineWidth = 2; g.strokeStyle = "#b8c8d8"; g.stroke(); }
  g.textAlign = "left"; g.textBaseline = "alphabetic";
  lines.forEach(([txt, kk, col], i) => { if (kk <= 0) return; const n = Math.round(txt.length * clamp(kk, 0, 1)); g.font = "italic 700 64px 'Noto Serif CJK SC', serif"; g.fillStyle = col ?? INKB; g.fillText(txt.slice(0, n), -w / 2 + 60, -h / 2 + 112 + i * 100); });
  g.restore();
}
function zzz(x, y, T, s = 1) { for (let i = 0; i < 3; i++) { const k = (T * 0.8 + i / 3) % 1; tag("z", x + k * 70 * s + i * 8, y - k * 160 * s, "#d8e8ff", (0.5 + k * 0.6) * s * (k < 0.85 ? 1 : (1 - k) / 0.15), 70); } }
function quill(x, y, s, T, writing = true) {
  g.save(); g.translate(x + (writing ? 18 * Math.sin(T * 14) : 0), y + (writing ? 6 * Math.cos(T * 9) : 0)); g.rotate(-0.6); g.scale(s, s);
  g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-40, -150, 10, -300); g.quadraticCurveTo(50, -150, 0, 0); g.fillStyle = "#f6f2ea"; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke();
  g.beginPath(); g.moveTo(0, 0); g.lineTo(8, -290); g.lineWidth = 3; g.stroke(); g.restore();
}
/** lecture hall of the society: wallpaper, portraits, gas lamps; audience heads behind pews (front row at y) */
function hall(T, rows = 2, asleep = 0, listen = false, seedOff = 0) {
  P.victorianRoom(g, WINE, 1350, T);
  P.frame(g, 200, 520, 220, 280); P.frame(g, 880, 520, 220, 280); P.frame(g, 540, 430, 300, 220, "land");
  for (const x of [60, 1020]) { g.beginPath(); g.rect(x - 8, 700, 16, 160); g.fillStyle = BRASS; g.fill(); g.lineWidth = 4; g.strokeStyle = P.INK; g.stroke(); const gr = g.createRadialGradient(x, 690, 10, x, 690, 160); gr.addColorStop(0, "rgba(255,220,140,0.6)"); gr.addColorStop(1, "rgba(255,220,140,0)"); g.fillStyle = gr; g.fillRect(x - 160, 530, 320, 320); P.flame(g, x, 700, 50, T); }
  void rows; void asleep; void listen; void seedOff;
}
function audience(T, y0 = 1500, rows = 2, asleep = 0, s = 0.62, look = 0) {
  for (let r = 0; r < rows; r++) { const y = y0 + r * 260, n = 5;
    for (let i = 0; i < n; i++) { const v = r * 5 + i, x = 110 + i * 215 + (r % 2) * 60 - 30; const sl = asleep && rnd(v, 7) < asleep;
      g.save(); if (sl) { g.translate(x, y - 40); g.rotate(0.25 * Math.sin(v)); g.translate(-x, -(y - 40)); }
      face(x, y - 150 * (s / 0.62), s + r * 0.08, FELLOW(v), { expr: sl ? "relief" : (look === 2 ? talk(T, "deadpan", "neutral", v) : "neutral"), look: look === 1 ? (x < 540 ? 1 : -1) : 0, ...(sl ? { blink: 1 } : {}) }, x < 540 ? 1 : -1, T, 30 + v);
      g.restore(); if (sl) zzz(x + 60, y - 260, T + v * 0.3, 0.8); }
    g.beginPath(); g.rect(-100, y + 10, 1300, 70); g.fillStyle = MAHOG; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
    g.fillStyle = "#3a2014"; g.fillRect(-100, y + 80, 1300, 260); }
}
function study(T, rain = 0) { // Down House study
  P.victorianRoom(g, "#2f5a4a", 1420, T);
  P.bookcase(g, 40, 330, 380, 1000, 2);
  g.beginPath(); g.rect(600, 380, 380, 520); g.fillStyle = rain ? "#6a7a8a" : "#9fd0e8"; g.fill(); g.lineWidth = 10; g.strokeStyle = "#f2efe6"; g.stroke();
  if (!rain) { P.hills(g, 600, 980, 760, 30, "#6aa04a", 2, 900, 0); P.cloud(g, 700 + T * 10, 480, 0.5); }
  else { g.save(); g.beginPath(); g.rect(600, 380, 380, 520); g.clip(); g.strokeStyle = "rgba(220,235,255,0.6)"; g.lineWidth = 3; for (let i = 0; i < 30; i++) { const x = 600 + rnd(i, 1) * 380, y = 380 + ((T * 900 + rnd(i, 2) * 520) % 520); g.beginPath(); g.moveTo(x, y); g.lineTo(x - 8, y + 30); g.stroke(); } g.restore(); }
  g.beginPath(); g.moveTo(790, 380); g.lineTo(790, 900); g.moveTo(600, 640); g.lineTo(980, 640); g.lineWidth = 8; g.strokeStyle = "#f2efe6"; g.stroke();
}
function desk(y) { g.beginPath(); g.rect(-100, y, 1300, 50); g.fillStyle = MAHOG; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke(); g.fillStyle = "#3a2014"; g.fillRect(-100, y + 50, 1300, 900); g.beginPath(); g.rect(-100, y + 50, 1300, 14); g.fillStyle = "#2a160e"; g.fill(); }
function candle(x, y, T, h = 160) { g.beginPath(); g.rect(x - 22, y - h, 44, h); g.fillStyle = "#f2eadc"; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke(); P.flame(g, x, y - h, 80, T); const gr = g.createRadialGradient(x, y - h - 30, 10, x, y - h - 30, 420); gr.addColorStop(0, "rgba(255,200,110,0.35)"); gr.addColorStop(1, "rgba(255,200,110,0)"); g.fillStyle = gr; g.fillRect(x - 420, y - h - 450, 840, 840); }
function tropics(T, hz = 1150) { SKY("#3fb0d8", "#c8f0e8", hz); sun(860, 330, 90, "#fff2b0"); P.cloud(g, 160 + T * 12, 420, 1.0); }
function net(gg, x, y, u, T, swing = 0) { gg.save(); gg.translate(x, y); gg.rotate(-0.9 + swing); gg.beginPath(); gg.rect(-3 * u, -150 * u, 6 * u, 150 * u); gg.fillStyle = "#a8743c"; gg.fill(); gg.lineWidth = 2 * u; gg.strokeStyle = P.INK; gg.stroke();
  gg.beginPath(); gg.ellipse(0, -190 * u, 34 * u, 40 * u, 0, 0, Math.PI * 2); gg.lineWidth = 3 * u; gg.stroke(); gg.beginPath(); gg.moveTo(-34 * u, -190 * u); gg.quadraticCurveTo(0, -100 * u + 10 * u * Math.sin(T * 6), 34 * u, -190 * u); gg.fillStyle = "rgba(255,255,255,0.55)"; gg.fill(); gg.lineWidth = 1.5 * u; gg.stroke(); gg.restore(); }
/** world map (mail route Ternate → England via Suez) */
const MP = { x: 40, y: 420, w: 1000, h: 1000 };
const mp = ([u, v]) => [MP.x + u * MP.w, MP.y + v * MP.h];
const LAND = {
  europe: [[0.02, 0.1], [0.12, 0.04], [0.26, 0.06], [0.34, 0.1], [0.36, 0.2], [0.3, 0.26], [0.24, 0.24], [0.2, 0.3], [0.12, 0.28], [0.06, 0.24], [0.04, 0.16]],
  asia: [[0.34, 0.08], [0.6, 0.02], [0.9, 0.04], [1.0, 0.12], [0.98, 0.3], [0.86, 0.4], [0.8, 0.5], [0.74, 0.46], [0.7, 0.56], [0.64, 0.46], [0.6, 0.48], [0.56, 0.58], [0.52, 0.46], [0.46, 0.4], [0.42, 0.32], [0.36, 0.3], [0.36, 0.2]],
  borneo: [[0.76, 0.62], [0.82, 0.6], [0.84, 0.68], [0.78, 0.72]], sulawesi: [[0.86, 0.62], [0.89, 0.6], [0.88, 0.68], [0.9, 0.72], [0.86, 0.7]],
  sumatra: [[0.66, 0.6], [0.7, 0.62], [0.76, 0.74], [0.72, 0.74]], guinea: [[0.93, 0.66], [1.02, 0.68], [1.04, 0.76], [0.95, 0.74]], gb: [[0.08, 0.05], [0.11, 0.06], [0.1, 0.13], [0.07, 0.12]],
};
const ROUTE = [[0.915, 0.64], [0.84, 0.58], [0.7, 0.58], [0.6, 0.52], [0.46, 0.42], [0.38, 0.34], [0.33, 0.3], [0.24, 0.27], [0.12, 0.22], [0.09, 0.1]];
function worldMap(T, t, d) {
  screen(); g.fillStyle = "#7fb8c8"; g.fillRect(0, 0, W, H); g.strokeStyle = "rgba(255,255,255,0.15)"; g.lineWidth = 3;
  for (let i = 0; i < 16; i++) { g.beginPath(); g.moveTo(0, 140 * i); g.lineTo(W, 140 * i); g.stroke(); g.beginPath(); g.moveTo(i * 110, 0); g.lineTo(i * 110, H); g.stroke(); }
  cam(540, 900, lerp(1.0, 1.06, ss(t / d)), 0, T);
  for (const k in LAND) { g.beginPath(); LAND[k].forEach((pt, i) => { const [x, y] = mp(pt); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.fillStyle = k === "gb" ? "#f2c86a" : "#e8dcb4"; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke(); }
  P.africa(g, MP.x + 0.12 * MP.w, MP.y + 0.28 * MP.h, 0.34 * MP.w, 0.5 * MP.h, "#e8dcb4");
}
function dashRoute(pts, k, col = WINE, w = 14) {
  const P2 = pts.map(mp), n = P2.length - 1, kk = clamp(k, 0, 1) * n, last = Math.floor(kk);
  g.save(); g.setLineDash([26, 16]); g.lineCap = "round"; g.beginPath(); g.moveTo(...P2[0]); for (let i = 1; i <= last; i++) g.lineTo(...P2[i]); let end = P2[last];
  if (last < n) { const f = kk - last; end = [lerp(P2[last][0], P2[last + 1][0], f), lerp(P2[last][1], P2[last + 1][1], f)]; g.lineTo(...end); }
  g.lineWidth = w + 8; g.strokeStyle = "#fff8e8"; g.stroke(); g.lineWidth = w; g.strokeStyle = col; g.stroke(); g.restore(); return end;
}
/** calendar page with month + year (flip k: 0..1 turns to the next) */
function calendar(x, y, s, month, year, col = WINE) {
  g.save(); g.translate(x, y); g.scale(s, s); g.beginPath(); g.roundRect(-300, -360, 600, 720, 26); g.fillStyle = PARCH; g.fill(); g.lineWidth = 10; g.strokeStyle = P.INK; g.stroke();
  g.beginPath(); g.roundRect(-300, -360, 600, 210, [26, 26, 0, 0]); g.fillStyle = col; g.fill(); g.stroke();
  for (const k of [-160, 160]) { g.beginPath(); g.arc(k, -360, 22, 0, Math.PI * 2); g.fillStyle = "#c8c0b0"; g.fill(); g.lineWidth = 5; g.stroke(); }
  g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 100px Montserrat"; g.fillText(month, 0, -255);
  g.fillStyle = P.INK; g.font = "900 220px Montserrat"; g.fillText(year, 0, 80); g.restore();
}
function laurel(x, y, s, T) { g.save(); g.translate(x, y); g.scale(s, s); for (const k of [-1, 1]) for (let i = 0; i < 8; i++) { const a = Math.PI / 2 + k * (0.3 + i * 0.32);
  g.save(); g.translate(Math.cos(a) * 120, Math.sin(a) * 120 - 40); g.rotate(a + (k > 0 ? 0 : Math.PI)); g.beginPath(); g.ellipse(0, 0, 34, 14, 0.5 * k, 0, Math.PI * 2); g.fillStyle = i % 2 ? "#d8b04a" : "#e8c45a"; g.fill(); g.lineWidth = 4; g.strokeStyle = P.INK; g.stroke(); g.restore(); }
  g.restore(); }

// ---------------- backdrops ----------------
const SKY = (top, bot, horizon = 1250) => { const gr = g.createLinearGradient(0, -300, 0, horizon); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(-1200, -1200, 3600, 4400); };
function sun(x, y, r, col = "#ffe08a") { const gr = g.createRadialGradient(x, y, r * 0.5, x, y, r * 2.6); gr.addColorStop(0, "rgba(255,230,150,0.6)"); gr.addColorStop(1, "rgba(255,230,150,0)"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 2.6, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = col; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke(); }
const tsea = (T, y0, amp = 0.6) => P.ocean(g, y0, T, ["#4fc8c8", "#3fb0b8", "#2f98a8", "#24809a"], -1500, 2600, amp);
const pop = (T, w, d = 0.25) => back((T - w) / d);

// ---------------- shots: [start (s), fn(t in shot, shot length, global T)] ----------------
const O = [
  [0, (t, d, T) => { // "May, 1859. A top London science club..." — opening (new): the society hall, president at the lectern, audience
    hall(T); push(t, d, 540, 1000, 1.0, 1.06, T);
    ch(540, 1350, 0.85, BELL, { expr: talk(T, "talk", "deadpan"), pose: "hold", held: (gg, x, y, u) => { gg.save(); gg.translate(x, y - 10 * u); gg.scale(u * 0.3, u * 0.3); gg.beginPath(); gg.rect(-150, -100, 300, 200); gg.fillStyle = PARCH; gg.fill(); gg.lineWidth = 8; gg.strokeStyle = P.INK; gg.stroke(); gg.restore(); } }, 1, T, 3);
    P.lectern(g, 540, 1400, 0.9);
    audience(T, 1560, 2, 0, 0.6, 1);
    screen(); stamp("MAY 1859", 540, 250, (t - 0.05) / 0.2, "#fff3d0", -0.1, 120);
    tag("LONDON", 540, 430, "#fff", pop(T, T_("london")), 90); tag("MONTHS LATER", 540, 540, BRASS, back((t - 0.1) / 0.25), 80);
  }],
  [T_("sums"), (t, d, T) => { // "sums up its year" — close-up of the president reading his yearly report
    hall(T); push(t, d, 540, 820, 1.1, 1.18, T);
    face(540, 760, 1.5, BELL, { expr: talk(T, "talk", "smirk"), look: 0.4 }, 1, T, 3);
    report([["The year 1858 has...", clamp((T - T_("sums")) / 1.0, 0, 1)]], 540, 1560, back((t - 0.05) / 0.25), -0.03, 880);
    screen(); tag("THE YEAR'S REVIEW", 540, 250, "#fff", back((t - 0.05) / 0.25), 84);
  }],
  [T_("no", 0), (t, d, T) => { // "no striking discoveries" — the report writes itself; the audience dozes off
    hall(T); push(t, d, 540, 1000, 1.0, 1.06, T);
    audience(T, 1720, 1, 0.7, 0.66);
    report([["The year 1858 has...", 1], ["no striking", clamp((T - T_("no", 0)) / 0.5, 0, 1), WINE], ["discoveries.", clamp((T - T_("discoveries")) / 0.5, 0, 1), WINE]], 540, 880, 1, -0.03, 880);
    screen(); tag("NOTHING NEW!", 540, 250, BRASS, pop(T, T_("striking", 0)), 100);
  }],
  [SEG(1), (t, d, T) => { // "They could not have been more wrong." — giant red X over the report, president gulps
    hall(T); push(t, d, 540, 1000, 1.0, 1.08, T);
    report([["The year 1858 has...", 1], ["no striking", 1, WINE], ["discoveries.", 1, WINE]], 540, 700, 1, -0.03, 880);
    bigX(540, 720, 300, clamp((T - T_("wrong")) / 0.35, 0, 1));
    face(540, 1320, 1.05, BELL, { expr: T > T_("wrong") ? "gulp" : "nervous", look: -0.5 }, 1, T, 3); sweat(720, 1180, 1.2, T);
    if (T > T_("wrong") && T < T_("wrong") + 0.4) shakeAmt = 16;
    screen(); stamp("WRONG!", 540, 260, (T - T_("wrong") + 0.05) / 0.2, "#e0303a", -0.1, 140);
  }],
  [SEG(2), (t, d, T) => { // "Rewind to February 1858" — calendar pages fly BACKWARDS from May 1859 to Feb 1858 (new transition)
    screen(); g.fillStyle = "#3a2420"; g.fillRect(0, 0, W, H); push(t, d, 540, 960, 1.0, 1.05, T);
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2 - T * 1.4; g.beginPath(); g.moveTo(540, 900); g.arc(540, 900, 1800, a, a + 0.13); g.closePath(); g.fillStyle = "rgba(216,176,74,0.12)"; g.fill(); }
    const MONTHS = ["MAY", "APR", "MAR", "FEB", "JAN", "DEC", "NOV", "OCT", "SEP", "AUG", "JUL", "JUN", "MAY", "APR", "MAR", "FEB"];
    const kf = clamp((T - SEG(2)) / Math.max(0.5, T_("february") - SEG(2) + 0.25), 0, 1), idx = Math.min(MONTHS.length - 1, Math.floor(kf * (MONTHS.length - 1)));
    const year = idx >= 5 ? "1858" : "1859";
    if (idx < MONTHS.length - 1) for (let j = 0; j < 3; j++) { const k = ((T * 5 + j / 3) % 1); g.save(); g.translate(540 + k * 700, 900 - k * 600); g.rotate(k * 3); g.globalAlpha = 1 - k; calendar(0, 0, 0.7, MONTHS[Math.max(0, idx - 1)], idx - 1 >= 5 ? "1858" : "1859"); g.restore(); }
    calendar(540, 920, 1.0, MONTHS[idx], year);
    screen(); tag("◀◀ REWIND", 540, 230, BRASS, back((t - 0.02) / 0.2) * 1.1, 100);
    if (idx === MONTHS.length - 1) stamp("FEB 1858", 540, 1500, (T - T_("february") - 0.2) / 0.2, ORCHID, -0.08, 120);
  }],
  [T_("island"), (t, d, T) => { // "the island of Ternate, in Indonesia" — volcano island in a turquoise sea, birds
    tropics(T, 1150); push(t, d, 540, 1000, 1.0, 1.07, T);
    tsea(T, 1080, 0.5); P.volcanoIsle(g, 560, 1180, 900, T);
    for (let i = 0; i < 3; i++) P.tern(g, 180 + i * 140 + 40 * Math.sin(T + i), 600 + 40 * Math.sin(T * 2 + i), 0.6, T + i);
    P.palm(g, 860, 1200, 260, T); P.palm(g, 280, 1210, 220, T + 1);
    screen(); stamp("1858", 540, 250, (t - 0.05) / 0.2, ORCHID, -0.08, 130); tag("INDONESIA", 540, 390, BIRD, pop(T, T_("indonesia")), 90);
  }],
  [SEG(3), (t, d, T) => { // "A broke bug collector" — Wallace turns out empty pockets, a moth flies out
    tropics(T, 1250); push(t, d, 540, 1050, 1.0, 1.08, T); P.jungle(g, 1260, T, ["#1f5a3a", "#2f7a46"], 0.8);
    P.ground(g, -3000, 4000, 1400, "#5a7a3a");
    ch(540, 1800, 1.05, WAL_HAT, { expr: "deadpan", pose: "cheek" }, 1, T, 7);
    for (const k of [-1, 1]) { g.beginPath(); g.ellipse(540 + k * 110, 1440, 34, 50, 0, 0, Math.PI * 2); g.fillStyle = "#f2efe6"; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke(); }
    const m = clamp(t / 1.2, 0, 1); P.birdwing(g, 650 + 200 * m, 1400 - 500 * m, 0.4, T, "#c8b8a0", "#8a7a6a", 0.3);
    screen(); tag("BROKE", 540, 260, "#fff", back((t - 0.05) / 0.25) * 1.3, 120);
  }],
  [T_("bug"), (t, d, T) => { // "bug collector, Alfred Wallace" — chasing a birdwing butterfly with a net
    tropics(T, 1250); push(t, d, 540, 1050, 1.0, 1.06, T); P.jungle(g, 1260, T, ["#1f5a3a", "#2f7a46", "#3f9a52"], 0.9);
    P.ground(g, -3000, 4000, 1420, "#5a7a3a");
    const sw = Math.sin(T * 5) * 0.5;
    ch(380, 1820, 1.0, WAL_HAT, { expr: "grin", mode: "march", phase: T * 1.2, look: 1, pose: "hold", held: (gg, x, y, u) => net(gg, x + 30 * u, y, u, T, sw) }, 1, T, 7);
    P.birdwing(g, 800 + 60 * Math.sin(T * 2.3), 880 + 80 * Math.sin(T * 3.1), 0.9, T, BIRD);
    screen(); tag("BUG COLLECTOR", 540, 260, BIRD, back((t - 0.05) / 0.25), 100);
    tag("ALFRED WALLACE", 540, 400, "#fff", back((t - 0.05) / 0.25), 86);
  }],
  [T_("shaking"), (t, d, T) => { // "is shaking with malaria" — in his hut, shivering under a blanket, a mosquito
    screen(); g.fillStyle = "#3a2a1e"; g.fillRect(0, 0, W, H); push(t, d, 540, 1000, 1.0, 1.08, T);
    g.fillStyle = "#c8a06a"; g.fillRect(-200, -200, 1500, 1500); for (let i = 0; i < 16; i++) { g.beginPath(); g.moveTo(-200 + i * 100, -200); g.lineTo(-200 + i * 100, 1300); g.lineWidth = 4; g.strokeStyle = "#8a6a3a"; g.stroke(); }
    g.fillStyle = "#6a4a2a"; g.fillRect(-200, 1300, 1500, 1000);
    shakeAmt = 10;
    g.save(); g.translate(540 + 6 * Math.sin(T * 60), 1100); g.rotate(-0.12); face(0, 0, 1.25, WAL_SICK, { expr: talk(T, "pained", "nervous"), look: 0 }, 1, T, 7); g.restore();
    g.beginPath(); g.moveTo(80, 1200); g.quadraticCurveTo(540, 1080 + 10 * Math.sin(T * 50), 1000, 1200); g.lineTo(1100, 1700); g.lineTo(-20, 1700); g.closePath(); g.fillStyle = "#b8323a"; g.fill(); g.lineWidth = 8; g.strokeStyle = P.INK; g.stroke();
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(60 + i * 220, 1240); g.lineTo(0 + i * 230, 1700); g.lineWidth = 10; g.strokeStyle = "#e8c45a"; g.stroke(); }
    sweat(760, 840, 1.3, T); sweat(330, 880, 1.1, T + 0.5);
    P.mosquito(g, 820 + 80 * Math.sin(T * 3), 560 + 40 * Math.cos(T * 4), 1.1, T);
    screen(); tag("MALARIA", 540, 260, ORCHID, pop(T, T_("malaria")) * 1.3, 120);
  }],
  [SEG(4), (t, d, T) => { // "And in his fever, an idea hits him" — feverish swirl, then the idea bursts
    screen(); const hit = T >= T_("idea"); g.fillStyle = hit ? "#fff3c8" : "#5a2a4a"; g.fillRect(0, 0, W, H); push(t, d, 540, 900, 1.0, 1.1, T);
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2 + T * (hit ? 0.4 : 2); g.beginPath(); g.moveTo(540, 800); g.arc(540, 800, 1800, a, a + 0.15); g.closePath(); g.fillStyle = hit ? "rgba(255,165,31,0.25)" : "rgba(255,79,163,0.18)"; g.fill(); }
    if (hit) P.burst(g, 540, 360, 60, 260, clamp((T - T_("idea")) / 0.4, 0, 1), "#fff3b0");
    face(540, 900, 1.6, WAL_SICK, { expr: hit ? "shock" : "pained", look: 0 }, 1, T, 7);
    if (hit) sparkle(540, 400, 240, T);
    screen(); tag(hit ? "AN IDEA!" : "FEVER", 540, 1200 - 950, hit ? BIRD : "#fff", hit ? pop(T, T_("idea")) * 1.3 : back((t - 0.05) / 0.25), 120);
  }],
  [T_("only"), (t, d, T) => { // "only the best-fitted survive" — a bird picks off the bright beetles, the leaf-green one is missed
    tropics(T, 1250); push(t, d, 540, 1000, 1.0, 1.06, T);
    P.leaf(g, 540, 1700, 1200, 0, "#3f9a52", T * 0.3);
    const cols = ["#e84a3a", "#3f9a52", "#3fa0d8"]; const xs = [380, 560, 720], ys = [1100, 900, 1240];
    const kb = clamp((T - T_("only") - 0.3) / 1.2, 0, 1);
    xs.forEach((x, i) => { const eaten = i !== 1 && kb > (i === 0 ? 0.35 : 0.75); if (!eaten) P.beetle(g, x, ys[i], 1.3, cols[i], 0, T + i, 0.2 * Math.sin(T + i)); });
    const bx = kb < 0.5 ? lerp(-150, 380, kb * 2) : lerp(380, 1250, (kb - 0.5) * 2), by = kb < 0.5 ? lerp(500, 1060, kb * 2) : lerp(1060, 1200, (kb - 0.5) * 2) - 300 * Math.sin((kb - 0.5) * 2 * Math.PI);
    g.save(); g.translate(bx, by); g.scale(2.4, 2.4); P.tern(g, 0, 0, 1, T * 1.4, 1); g.restore();
    check(560, 680, 70, clamp((T - T_("survive")) / 0.3, 0, 1));
    screen(); tag("BEST-FITTED", 540, 250, BIRD, pop(T, T_("bestfitted")) * 1.2, 110); tag("SURVIVE", 540, 380, "#fff", pop(T, T_("survive")) * 1.1, 100);
  }],
  [T_("species", 0), (t, d, T) => { // "and species change" — generations of beetles, the horn grows step by step
    tropics(T, 1300); push(t, d, 540, 1000, 1.0, 1.06, T); P.ground(g, -3000, 4000, 1300, "#5a8a3a");
    for (let i = 0; i < 3; i++) { const k = clamp((T - T_("species", 0) - i * 0.35) / 0.3, 0, 1); if (k <= 0) continue;
      g.save(); g.translate(190 + i * 350, 1000); g.scale(back(k) * 1.9, back(k) * 1.9); P.beetle(g, 0, 0, 1.0, ["#3f9a52", "#4aa86a", "#5ab87a"][i], i * 0.5, T + i); g.restore();
      if (i < 2) tag("→", 365 + i * 350, 1000, BRASS, k, 110); }
    screen(); tag("SPECIES CHANGE", 540, 260, ORCHID, pop(T, T_("change")) * 1.1, 100);
  }],
  [SEG(5), (t, d, T) => { // "He mails it to Charles Darwin." — envelope addressed and sealed, then the map route to England
    worldMap(T, t, d);
    const e = dashRoute(ROUTE, easeOut(clamp(t / (d * 0.9), 0, 1)));
    P.envelope(g, e[0], e[1], 0.3, 0, "#b8202a", "", 0.1 * Math.sin(T * 6));
    pin(...mp([0.915, 0.64]), 0.8, BIRD); tag("TERNATE", mp([0.915, 0.64])[0] - 60, mp([0.915, 0.64])[1] + 60, "#fff", 1, 44);
    pin(...mp([0.09, 0.1]), pop(T, T_("darwin", 0)) * 0.8, WINE); tag("ENGLAND", mp([0.09, 0.1])[0] + 90, mp([0.09, 0.1])[1] - 120, "#fff", pop(T, T_("darwin", 0)) * 0.9, 50);
    screen(); P.envelope(g, 540, 1660, 1.1, 0, "#b8202a", "C. Darwin, Esq.", -0.05);
    tag("TO: CHARLES DARWIN", 540, 250, "#fff", back((t - 0.05) / 0.25), 80);
  }],
  [SEG(6), (t, d, T) => { // "In England, Darwin opens the letter" — his study at Down House
    study(T); push(t, d, 540, 1050, 1.0, 1.06, T);
    ch(340, 1880, 1.15, DARWIN, { expr: T > T_("letter") ? "shock" : "neutral", look: 1, pose: "point", pointUp: 0.2 }, 1, T, 9);
    desk(1640); P.envelope(g, 770, 1080 + 10 * Math.sin(T * 3), 1.05, clamp((T - T_("opens")) / 0.6, 0, 1), "#b8202a", "", -0.04);
    screen(); tag("ENGLAND", 540, 250, "#fff", back((t - 0.05) / 0.25) * 1.1, 110); tag("JUNE 1858", 540, 380, BRASS, back((t - 0.15) / 0.25), 76);
  }],
  [T_("goes"), (t, d, T) => { // "and goes pale" — close-up, the colour drains from his face
    study(T); push(t, d, 540, 850, 1.1, 1.2, T);
    const k = clamp((T - T_("pale")) / 0.4, 0, 1);
    face(540, 840, 1.6, k > 0.5 ? DARWIN_PALE : DARWIN, { expr: k > 0.2 ? "shock" : "neutral", look: 0 }, 1, T, 9);
    sweat(780, 660, 1.4, T); if (k > 0) sweat(320, 700, 1.2, T + 0.4);
    screen(); tag("GOES PALE", 540, 250, "#d8f0d0", pop(T, T_("pale")) * 1.2, 110);
  }],
  [SEG(7), (t, d, T) => { // "It's his own secret theory" — a locked drawer opens: his hidden notebooks and tree sketch
    study(T); push(t, d, 540, 1100, 1.0, 1.06, T); desk(1300);
    const k = clamp(t / 0.6, 0, 1);
    g.beginPath(); g.rect(240, 1380 + 120 * k, 600, 300); g.fillStyle = "#6a3e22"; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
    for (let i = 0; i < 3; i++) P.book(g, 380 + i * 160, 1420 + 120 * k, 0.4, "NOTES\n" + ["B", "C", "D"][i], ["#3a3a6a", "#6a3a3a", "#3a6a4a"][i], 0.05 * i);
    P.treeOfLife(g, 540, 1180, 1.6, clamp((T - T_("theory")) / 1.0, 0, 1), INKB);
    stamp("SECRET", 540, 1650, (T - T_("secret") + 0.05) / 0.2, "#e0303a", -0.1, 110);
    screen(); tag("HIS OWN THEORY", 540, 250, "#fff", pop(T, T_("own", 0)), 96);
  }],
  [T_("twenty"), (t, d, T) => { // "twenty years of work" — notebooks pile up, year counter 1838 → 1858
    study(T); push(t, d, 540, 1000, 1.0, 1.08, T); desk(1500);
    const k = easeOut(clamp(t / 1.6, 0, 1)), n = Math.round(k * 20);
    for (let i = 0; i < n; i++) { const c = i % 2 ? 300 : 780; const j = Math.floor(i / 2); g.beginPath(); g.rect(c - 160 + 6 * Math.sin(i), 1500 - 46 * (j + 1), 320, 44); g.fillStyle = ["#3a3a6a", "#6a3a3a", "#3a6a4a", "#8a6a2a"][i % 4]; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke(); }
    bigNum(String(Math.round(lerp(1838, 1858, k))), BRASS, "HIDDEN 20 YEARS", back((t - 0.05) / 0.25), 400);
  }],
  [SEG(8), (t, d, T) => { // '"All my originality," he writes' — Darwin writes to a friend; the quote writes itself
    study(T); push(t, d, 540, 1000, 1.0, 1.06, T);
    ch(540, 1650, 0.9, DARWIN, { expr: "pained", look: 0.3 }, 1, T, 9); desk(1300);
    quoteCard([["All my originality...", clamp((T - T_("all")) / 0.9, 0, 1)], ["...will be smashed.", clamp((T - T_("will")) / 0.6, 0, 1), WINE]], 540, 1580, 1, -0.02, 920);
    quill(860, 1560, 0.6, T, T < T_("smashed") + 0.3);
    screen(); tag("DARWIN WRITES:", 540, 250, "#fff", pop(T, T_("writes")), 80);
  }],
  [T_("smashed"), (t, d, T) => { // "will be smashed." — the glass dome over his "originality" shatters
    study(T); push(t, d, 540, 1000, 1.0, 1.06, T); ch(200, 1800, 0.95, DARWIN, { expr: "shout2", look: 1, pose: "cheek" }, 1, T, 9); desk(1450);
    const k = clamp((T - T_("smashed")) / 0.5, 0, 1);
    P.treeOfLife(g, 540, 1440, 1.4, 1, INKB);
    if (k < 0.05) { g.beginPath(); g.ellipse(540, 1100, 320, 360, 0, Math.PI, 0); g.lineTo(860, 1440); g.lineTo(220, 1440); g.closePath(); g.fillStyle = "rgba(200,230,255,0.25)"; g.fill(); g.lineWidth = 8; g.strokeStyle = "#e8f4ff"; g.stroke(); }
    else for (let i = 0; i < 16; i++) { const a = rnd(i, 1) * Math.PI * 2, r = 600 * k; g.save(); g.translate(540 + Math.cos(a) * r, 1000 + Math.sin(a) * r + 600 * k * k); g.rotate(i + k * 8); g.beginPath(); g.moveTo(0, -40); g.lineTo(30, 20); g.lineTo(-26, 24); g.closePath(); g.fillStyle = "rgba(220,240,255,0.7)"; g.fill(); g.lineWidth = 4; g.strokeStyle = "#ffffff"; g.stroke(); g.restore(); }
    if (k > 0 && k < 0.6) shakeAmt = 18;
    screen(); tag("SMASHED!", 540, 250, "#e0303a", pop(T, T_("smashed"), 0.2) * 1.4, 130);
  }],
  [SEG(9), (t, d, T) => { // "His friends read both papers together on July first." — Lyell & Hooker at the society, one paper each
    hall(T); push(t, d, 540, 1050, 1.0, 1.14, T);
    const paper = (name, col, fl = 1) => (gg, x, y, u) => { gg.save(); gg.translate(x, y - 30 * u); gg.scale(u * 0.4 * fl, u * 0.4); gg.beginPath(); gg.rect(-150, -170, 300, 340); gg.fillStyle = PARCH; gg.fill(); gg.lineWidth = 8; gg.strokeStyle = P.INK; gg.stroke();
      gg.fillStyle = col; gg.font = "900 64px Montserrat"; gg.textAlign = "center"; gg.fillText(name, 0, 130); for (let i = 0; i < 5; i++) gg.fillRect(-90, -130 + i * 40, 180, 8); gg.restore(); };
    ch(300, 1600, 0.95, LYELL, { expr: talk(T, "talk", "neutral"), look: 1, pose: "hold", held: paper("WALLACE", EMER) }, 1, T, 11);
    ch(790, 1600, 0.95, HOOKER, { expr: talk(T, "neutral", "talk", 1), look: -1, pose: "hold", held: paper("DARWIN", WINE, -1) }, -1, T, 12);
    tag("+", 545, 1140, BRASS, pop(T, T_("both")) * 1.3, 140);
    screen(); tag("BOTH PAPERS", 540, 250, "#fff", back((t - 0.05) / 0.25), 96);
    stamp("LONDON, 1858", 540, 420, (T - T_("london") + 0.05) / 0.2, "#fff3d0", -0.08, 100);
  }],
  [SEG(10), (t, d, T) => { // "Neither man is there:" — two empty, spot-lit chairs
    screen(); g.fillStyle = "#1e1418"; g.fillRect(0, 0, W, H); push(t, d, 540, 1100, 1.0, 1.16, T);
    for (const x0 of [300, 780]) { const x = x0 + 40 * Math.sin(T * 2.2 + x0), gr = g.createLinearGradient(x, 0, x, 1700); gr.addColorStop(0, "rgba(255,240,200,0.0)"); gr.addColorStop(1, "rgba(255,240,200,0.28)"); g.beginPath(); g.moveTo(x - 60, 0); g.lineTo(x + 60, 0); g.lineTo(x + 240, 1700); g.lineTo(x - 240, 1700); g.closePath(); g.fillStyle = gr; g.fill(); }
    P.chair(g, 300, 1650, 1.0, "DARWIN"); P.chair(g, 780, 1650, 1.0, "WALLACE");
    screen(); tag("NEITHER MAN IS THERE", 540, 260, "#fff", back((t - 0.05) / 0.25), 76);
  }],
  [T_("darwin", 2), (t, d, T) => { // "Darwin is grieving his baby son," — at home, rain on the window, a candle
    study(T, 1); push(t, d, 540, 1000, 1.0, 1.12, T); g.fillStyle = "rgba(20,30,50,0.35)"; g.fillRect(-500, -500, 2200, 3000);
    ch(470, 1820, 1.0, DARWIN, { expr: "pained", look: 0, pose: "chin", blink: 0.55, headTilt: 0.12 }, 1, T, 9);
    desk(1560); candle(830, 1560, T, 150);
    P.frame(g, 830, 1330, 150, 190, "portrait", BRASS);
    screen(); tag("GRIEVING HIS BABY SON", 540, 250, "#d8e4f0", back((T - T_("grieving")) / 0.25), 70);
  }],
  [T_("wallace", 1), (t, d, T) => { // "Wallace is deep in the jungle." — happily netting butterflies, no idea
    SKY("#2f8a6a", "#9fe0b8", 1300); push(t, d, 540, 1050, 1.04, 1.1, T);
    P.jungle(g, 900, T, ["#1a4a30", "#245a3a"], 1.0); P.jungle(g, 1350, T, ["#2f7a46", "#3f9a52"], 0.9);
    ch(540, 1820, 1.0, WAL_HAT, { expr: "grin", look: 1, pose: "hold", held: (gg, x, y, u) => net(gg, x + 20 * u, y, u, T, 0.4 * Math.sin(T * 4)) }, 1, T, 7);
    for (let i = 0; i < 3; i++) P.birdwing(g, 300 + i * 260 + 50 * Math.sin(T * 2 + i), 700 + 80 * Math.sin(T * 2.7 + i * 2), 0.6, T + i, [BIRD, TURQ, ORCHID][i]);
    P.leaf(g, -40, 1900, 700, 0.5, "#3f9a52", T); P.leaf(g, 1120, 1900, 700, -0.5, "#2f8a4a", T);
    qmark(860, 1150, 0.7, T, BIRD);
    screen(); tag("DEEP IN THE JUNGLE", 540, 250, "#fff", pop(T, T_("deep")), 80); tag("NO IDEA!", 540, 370, BIRD, pop(T, T_("jungle")), 80);
  }],
  [SEG(11), (t, d, T) => { // "The room listens." — the hall, a wall clock ticking, everyone still
    hall(T); push(t, d, 540, 1050, 1.0, 1.05, T);
    P.clockFace(g, 540, 700, 130, (T * 0.05) % 1);
    audience(T, 1400, 2, 0, 0.62, 0);
    screen(); tag("THE ROOM LISTENS", 540, 250, "#fff", back((t - 0.05) / 0.25), 90);
  }],
  [T_("nobody", 0), (t, d, T) => { // "Nobody argues." — dead silence; a cricket chirps on the carpet
    hall(T); push(t, d, 540, 1000, 1.0, 1.08, T);
    audience(T, 980, 1, 0, 0.5, 2);
    g.fillStyle = "#5a2a2a"; g.fillRect(-300, 1060, 1700, 1200); for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(-300, 1100 + i * 70); g.lineTo(1400, 1100 + i * 70); g.lineWidth = 3; g.strokeStyle = "#4a2020"; g.stroke(); }
    P.cricket(g, 500, 1180, 2.2, T);
    tag("chirp!", 760, 940, "#d8f0a0", (Math.sin(T * 12) > 0 ? 1 : 0.85), 66);
    screen(); tag("NOBODY ARGUES", 540, 250, "#fff", back((t - 0.05) / 0.25), 96);
  }],
  [T_("nobody", 1), (t, d, T) => { // "Nobody notices." — a big yawn, heads nod off
    hall(T); push(t, d, 540, 1100, 1.0, 1.08, T);
    audience(T, 1500, 2, 0.6, 0.62, 0);
    face(540, 980, 1.1, FELLOW(2), { expr: "laugh", blink: 1 }, 1, T, 50);
    zzz(700, 880, T, 1.2);
    screen(); tag("NOBODY NOTICES", 540, 250, ORCHID, pop(T, T_("notices")), 96);
  }],
  [SEG(12), (t, d, T) => { // "In November 1859" — a London bookshop window on a foggy evening, queue at the door
    SKY("#4a4a5a", "#c8b8a0", 1300); push(t, d, 540, 1050, 1.0, 1.06, T);
    g.fillStyle = "#5a3a2a"; g.fillRect(-200, 300, 1500, 1200); for (let r = 0; r < 12; r++) for (let c = 0; c < 10; c++) { g.beginPath(); g.rect(-200 + c * 160 + (r % 2) * 80, 300 + r * 60, 150, 52); g.lineWidth = 3; g.strokeStyle = "#3a2418"; g.stroke(); }
    g.beginPath(); g.rect(140, 560, 800, 120); g.fillStyle = "#1e3a2a"; g.fill(); g.lineWidth = 8; g.strokeStyle = P.INK; g.stroke(); g.fillStyle = BRASS; g.font = "900 70px Montserrat"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("BOOKSELLER", 540, 622);
    g.beginPath(); g.rect(160, 720, 760, 560); g.fillStyle = "rgba(255,210,130,0.85)"; g.fill(); g.lineWidth = 10; g.strokeStyle = "#1e3a2a"; g.stroke();
    for (let i = 0; i < 4; i++) P.book(g, 280 + i * 175, 1060, 0.42, "ORIGIN\nOF\nSPECIES", EMER, 0.05 * Math.sin(i));
    P.ground(g, -3000, 4000, 1500, "#6a6a6a");
    for (let i = 0; i < 4; i++) ch(160 + i * 260, 1860, 0.8, FELLOW(i + 3), { expr: "smile", look: 1 }, 1, T, 60 + i);
    g.fillStyle = "rgba(220,220,220,0.18)"; g.fillRect(-300, 0, 1700, 2000);
    screen(); stamp("NOVEMBER 1859", 540, 260, (t - 0.05) / 0.2, "#fff3d0", -0.08, 104);
  }],
  [T_("origin"), (t, d, T) => { // "Darwin's On the Origin of Species" — the green book slams in, gold title
    screen(); g.fillStyle = "#2a1a14"; g.fillRect(0, 0, W, H); push(t, d, 540, 960, 1.0, 1.06, T);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + T * 0.4; g.beginPath(); g.moveTo(540, 900); g.arc(540, 900, 1800, a, a + 0.12); g.closePath(); g.fillStyle = "rgba(216,176,74,0.14)"; g.fill(); }
    const k = back((t + 0.1) / 0.3);
    P.book(g, 540, 900, 2.1 * k, "ON THE\nORIGIN\nOF\nSPECIES", EMER, -0.04 + 0.02 * Math.sin(T * 2));
    sparkle(540, 900, 520, T);
    screen(); tag("BY CHARLES DARWIN", 540, 1500 - 1200 + 0, "#fff", back((t - 0.2) / 0.25), 76);
  }],
  [T_("sells"), (t, d, T) => { // "sells out in a day" — the shelf empties, SOLD OUT stamp
    victorianRoom2(T); push(t, d, 540, 1050, 1.0, 1.07, T);
    const k = clamp((T - T_("sells")) / 1.2, 0, 1), left = Math.round((1 - k) * 12);
    for (let i = 0; i < left; i++) P.book(g, 140 + (i % 6) * 160, 820 + Math.floor(i / 6) * 420, 0.42, "ORIGIN", EMER);
    for (let i = 0; i < 4; i++) { const x = 140 + i * 270; ch(x, 1900, 0.85, FELLOW(i + 6), { expr: talk(T, "grin", "laugh", i), pose: "hold", held: (gg, xx, yy, u) => { gg.save(); gg.translate(xx, yy - 20 * u); gg.scale(i < 2 ? 1 : -1, 1); P.book(gg, 0, 0, u * 0.22, "ORIGIN", EMER); gg.restore(); } }, i < 2 ? 1 : -1, T, 70 + i); }
    stamp("SOLD OUT", 540, 1150, (T - T_("out") + 0.05) / 0.2, "#e0303a", -0.12, 140);
    screen(); tag("IN ONE DAY!", 540, 250, BRASS, pop(T, T_("day", 0)) * 1.2, 110);
  }],
  [SEG(13), (t, d, T) => { // "Wallace never complains." — on his hut porch, reading the news with a calm smile
    tropics(T, 1250); push(t, d, 540, 1050, 1.0, 1.06, T); P.jungle(g, 1250, T, ["#1f5a3a", "#2f7a46"], 0.8);
    P.stiltHut(g, 820, 1450, 0.9); P.ground(g, -3000, 4000, 1450, "#5a7a3a");
    ch(420, 1850, 1.0, WALLACE, { expr: "smile_closed", pose: "hold", held: (gg, x, y, u) => P.envelope(gg, x, y + 20 * u, u * 0.24, 1, null) }, 1, T, 7);
    sparkle(420, 1100, 200, T);
    screen(); tag("NO COMPLAINTS", 540, 250, "#fff", pop(T, T_("never")), 96); check(880, 380, 60, clamp((T - T_("complains")) / 0.3, 0, 1));
  }],
  [T_("names"), (t, d, T) => { // "He even names his own book Darwinism." — Wallace proudly shows his book
    tropics(T, 1250); push(t, d, 540, 1000, 1.05, 1.12, T); P.jungle(g, 1250, T, ["#1f5a3a", "#2f7a46"], 0.8); P.ground(g, -3000, 4000, 1450, "#5a7a3a");
    ch(540, 1850, 1.05, WALLACE, { expr: "grin", pose: "hold", held: (gg, x, y, u) => P.book(gg, x, y + 70 * u, u * 0.38, "DARWIN-\nISM", "#6a2a3a", 0.03) }, 1, T, 7);
    screen(); tag("DARWINISM", 540, 250, ORCHID, pop(T, T_("darwinism")) * 1.3, 120); tag("1889", 540, 390, "#fff", back((T - T_("darwinism") - 0.2) / 0.25), 80);
  }],
  [SEG(14), (t, d, T) => { // "Big breakthroughs rarely look striking on the day they happen." — callback: the 1859 report, a sprout grows into the tree of life
    hall(T); push(t, d, 540, 1000, 1.0, 1.05, T);
    report([["no striking", 1, WINE], ["discoveries.", 1, WINE]], 540, 560, 1, -0.03, 820);
    const k = clamp((T - T_("look")) / 1.6, 0, 1);
    g.beginPath(); g.moveTo(420, 1500); g.lineTo(660, 1500); g.lineTo(620, 1700); g.lineTo(460, 1700); g.closePath(); g.fillStyle = "#b8643a"; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
    if (k <= 0) { P.leaf(g, 540, 1500, 90, -0.4, EMER, T); P.leaf(g, 540, 1500, 80, 0.5, EMER, T); }
    P.treeOfLife(g, 540, 1500, 2.0, k, "#3a2a1e", 5);
    screen(); tag("RARELY LOOK STRIKING", 540, 1000 - 750, "#fff", pop(T, T_("rarely")), 80);
  }],
  [SEG(15), (t, d, T) => { // ending (new): split world — Wallace in the jungle, Darwin in his study — sharing one laurel wreath
    push(t, d, 540, 1000, 1.0, 1.05, T);
    g.save(); g.beginPath(); g.rect(-400, -400, 940, 3000); g.clip(); SKY("#2f8a6a", "#c8f0d8", 1300); P.jungle(g, 1300, T, ["#1f5a3a", "#2f7a46"], 0.5, -300, 560); g.restore();
    g.save(); g.beginPath(); g.rect(540, -400, 1000, 3000); g.clip(); P.victorianRoom(g, "#2f5a4a", 1420, T); P.bookcase(g, 760, 400, 320, 900, 2); g.restore();
    g.beginPath(); g.moveTo(540, -400); g.lineTo(540, 2400); g.lineWidth = 10; g.strokeStyle = P.INK; g.stroke();
    ch(300, 1800, 0.95, WAL_HAT, { expr: "smile", pose: "cheer" }, 1, T, 7);
    ch(780, 1800, 0.95, DARWIN, { expr: "smile", pose: "cheer" }, -1, T, 9);
    laurel(540, 800 + 10 * Math.sin(T * 2), 1.1, T); sparkle(540, 760, 200, T);
    screen(); tag("SHARE THE CREDIT?", 540, 220, ORCHID, back((t - 0.1) / 0.25), 92);
    tag("COMMENT ↓", 540, 360, "#fff", back((t - 0.5) / 0.3), 80);
  }],
];
// ---------------- 40-second cut (VIEWS FIX 2026-11-28): shock hook first, ~1.5 s per picture ----------------
const HOOK = (t, d, T) => { // "A sick bug collector" — frame 1: sweating Wallace with his net, a birdwing, big "SICK BUG COLLECTOR"
  tropics(T, 1250); push(t, d, 540, 1000, 1.05, 1.14, T); P.jungle(g, 1260, T, ["#1f5a3a", "#2f7a46", "#3f9a52"], 0.9); P.ground(g, -3000, 4000, 1420, "#5a7a3a");
  shakeAmt = 4;
  face(540, 880, 1.45, WAL_SICK, { expr: talk(T, "pained", "nervous"), look: 0.5, pose: "hold", held: (gg, x, y, u) => net(gg, x + 30 * u, y, u, T, 0.3 * Math.sin(T * 5)) }, 1, T, 7);
  sweat(790, 700, 1.4, T); sweat(300, 740, 1.2, T + 0.5); P.mosquito(g, 860 + 60 * Math.sin(T * 3), 480, 1.0, T);
  P.birdwing(g, 220 + 40 * Math.sin(T * 2), 520 + 30 * Math.sin(T * 3), 0.7, T, BIRD);
  screen(); tag("SICK", 540, 200, "#d8f0a0", 1, 120); tag("BUG COLLECTOR", 540, 340, BIRD, 1, 100);
};
const HOOK2 = (t, d, T) => { // "mailed Darwin" — the envelope flies straight into Darwin's study, Darwin startled
  study(T); push(t, d, 540, 1000, 1.0, 1.1, T);
  face(330, 900, 1.15, DARWIN, { expr: "shock", look: 1 }, 1, T, 9);
  const k = easeOut(clamp(t / 0.6, 0, 1)); P.envelope(g, lerp(1300, 760, k), lerp(300, 900, k), 1.1, 0, "#b8202a", "C. Darwin, Esq.", -0.4 * (1 - k));
  speedLines(T, 8, "rgba(255,255,255,0.5)", -1);
  screen(); tag("TO DARWIN", 540, 250, "#fff", back((t - 0.02) / 0.2) * 1.2, 110);
};
const SHOTS = [
  [0, HOOK], [T_("mailed"), HOOK2], [T_("secret"), O[15][1]],
  [SEG(1), O[5][1]], [T_("alfred"), O[7][1]], [T_("shaking"), O[8][1]],
  [SEG(2), O[9][1]], [T_("only"), O[10][1]], [T_("species", 0), O[11][1]],
  [SEG(3), O[12][1]],
  [SEG(4), O[14][1]], [T_("hed"), O[16][1]],
  [SEG(5), O[17][1]], [T_("smashed"), O[18][1]],
  [SEG(6), O[19][1]],
  [SEG(7), O[23][1]], [T_("nobody", 0), O[24][1]], [T_("nobody", 1), O[25][1]],
  [SEG(8), O[0][1]], [T_("no", 0), O[2][1]],
  [SEG(9), O[27][1]], [T_("sells"), O[28][1]],
  [SEG(10), O[29][1]], [T_("names"), O[30][1]],
  [SEG(11), O[32][1]],
];
function victorianRoom2(T) { P.victorianRoom(g, "#3a2a4a", 1500, T); for (let r = 0; r < 2; r++) { g.beginPath(); g.rect(-100, 1030 + r * 420, 1300, 30); g.fillStyle = MAHOG; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke(); } }
const SH = SHOTS.map((s) => s[0]);

// ---------------- captions (orchid accent on key words) ----------------
const allWords = segs.flatMap((s) => s.words);
const KEY = /^(may|eighteen|fiftynine|fiftyeight|london|science|club|no|striking|discoveries|wrong|rewind|february|ternate|indonesia|island|broke|bug|alfred|wallace|malaria|fever|idea|bestfitted|survive|species|change|charles|darwin|darwins|england|pale|secret|theory|twenty|years|originality|smashed|friends|both|july|first|neither|baby|jungle|nobody|november|origin|sells|day|never|darwinism|breakthroughs|credit)$/i;
function captions(T) {
  let w = null;
  for (let i = 0; i < allWords.length; i++) {
    const a = allWords[i], next = allWords[i + 1];
    const end = next && next.t0 - a.t1 < 0.25 ? next.t0 : a.t1 + 0.12;
    if (T >= a.t0 - 0.03 && T < end) { w = a; break; }
  }
  if (!w) return;
  screen();
  const txt = w.w.replace(/\.\.\./g, "").replace(/["“”]/g, "").replace(/[.,:]$/g, "");
  const pop2 = back((T - w.t0 + 0.03) / 0.12);
  const key = KEY.test(txt.normalize("NFD").replace(/[^A-Za-z0-9]/g, ""));
  g.save(); g.translate(W / 2, H * 0.7); g.rotate(key ? -0.03 : 0); g.scale(0.85 + 0.15 * pop2, 0.85 + 0.15 * pop2);
  let fs = 104; g.font = `900 ${fs}px Montserrat`; const mw = g.measureText(txt.toUpperCase()).width; if (mw > 980) { fs *= 980 / mw; g.font = `900 ${fs}px Montserrat`; }
  g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
  g.lineWidth = 22; g.strokeStyle = "#111"; g.strokeText(txt.toUpperCase(), 0, 0);
  g.fillStyle = key ? ORCHID : "#ffffff"; g.fillText(txt.toUpperCase(), 0, 0);
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
  const fl = [T_("idea"), T_("smashed")].map((s) => clamp(1 - Math.abs(T - s) / 0.1, 0, 1)).reduce((a, b) => Math.max(a, b), 0);
  if (fl > 0) { g.fillStyle = `rgba(255,255,255,${fl * 0.8})`; g.fillRect(0, 0, W, H); }
  // sepia "flashback" grain during the 1858 story, warm vignette always
  if (T >= SEG(1) && T < SEG(8)) { g.fillStyle = "rgba(120,80,40,0.06)"; g.fillRect(0, 0, W, H); }
  const v = g.createRadialGradient(W / 2, H / 2, 600, W / 2, H / 2, 1250); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(40,20,10,0.32)");
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  captions(T);
  return true;
};
window.ready = true;
