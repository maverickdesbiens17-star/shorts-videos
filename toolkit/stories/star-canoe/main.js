import { Pen, bodyFront } from "./toon.js";
import * as P from "./paint.js";
const { clamp, lerp, ss, easeOut, back, rnd } = P;

export const W = 1080, H = 1920, FPS = 30;
const cv = document.getElementById("c"); cv.width = W; cv.height = H;
const g = cv.getContext("2d");

// « The Star Canoe » — Heyerdahl (1947) vs Mau Piailug (1976). Structure: "two men, two versions" (rival theories, then the test voyage).
// Palette: Pacific night & dawn (indigo / deep teal / sunrise gold / sail cream / hibiscus red); caption accent: star gold.
const INDIGO = "#16204f", TEALD = "#1f6a8a", GOLD = "#ffc94a", SAILC = "#ecd3a4", HIB = "#e8475a", KHAKI = "#c9b27a", SAND = "#f2d9a0", LEAF = "#4f9e4a";

// ---------------- cast ----------------
const HEYER = { jacket: KHAKI, pants: "#7a6a4a", boots: "#4a3424", hat: "hair", hair: "#e8c870", beard: "#dcb860", skin: "#f6d2b0" };
const MAU = { jacket: "#9a6440", bare: true, tattoo: "#2a1c22", wrap: HIB, pants: "#8a5636", boots: "#9a6440", hat: "hair", hair: "#1c1a22", skin: "#a06a44", moustache: "#2a2020", build: "stout" };
const NAINOA = { jacket: GOLD, pants: "#2a4a7a", boots: "#a87a52", hat: "hair", hair: "#141218", skin: "#b98058" };
const SCHOLAR = (v) => ({ jacket: ["#6b5a4a", "#4a5a6a"][v % 2], pants: "#3a3530", boots: "#1c1a1a", hat: v ? "fedora" : "hair", cap: "#5a4a3a", band: "#222", hair: "#9a9a9a", tie: ["#8a2a2a", "#2a4a6a"][v % 2], skin: ["#f3d2a8", "#f6dcb8"][v % 2], build: "stout", moustache: v ? undefined : "#cfcfcf" });
const HAWAI = (v) => ({ jacket: ["#2f9e8a", HIB, "#f2a03a", "#3a6fb0", "#8a5ac0", "#e8e1cf"][v % 6], pants: ["#3a3f5a", "#5a4632", "#2a2a36"][v % 3], boots: "#a87a52",
  hat: "hair", hair: ["#141218", "#2a1c16", "#3a2a1e"][v % 3], skin: ["#b98058", "#a87048", "#c48a5e", "#9a6440"][v % 4], moustache: v % 3 === 1 ? "#1c1a1a" : undefined, beard: v % 5 === 2 ? "#2a2020" : undefined });
const TAHI = (v) => ({ jacket: ["#ffffff", HIB, "#f2a03a", "#2f9e8a", "#ffd84a"][v % 5], dress: v % 2 ? ["#e8475a", "#2f9e8a", "#f6f3ea"][v % 3] : undefined, pants: "#3a3f5a", boots: "#a87a52",
  hat: "hair", hair: ["#141218", "#2a1c16"][v % 2], skin: ["#b98058", "#a87048", "#c48a5e", "#d9a97c"][v % 4], lei: ["#ff6b8a", "#ffd84a", "#ffffff", "#ff9a3a"] });
const ELDER = { jacket: "#8a5636", bare: true, tattoo: "#2a1c22", wrap: "#2f6b5a", pants: "#7a4a30", boots: "#8a5636", hat: "hair", hair: "#e8e8e8", skin: "#8a5636", beard: "#e8e8e8", build: "stout" };
const BOY = { jacket: "#a87048", bare: true, wrap: GOLD, pants: "#a87048", boots: "#a87048", hat: "hair", hair: "#141218", skin: "#a87048", build: "kid" };

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
const T_ = (word, nth = 0) => { let k = 0; for (const s of segs) for (const ww of s.words) if (ww.w.normalize("NFD").toLowerCase().replace(/[^a-z0-9]/g, "") === word) { if (k++ === nth) return ww.t0; } throw new Error("T_ " + word + " " + nth); };
const SEG = (i) => segs[i].start;

// ---------------- camera & fx ----------------
let shakeAmt = 0;
function cam(cx, cy, z, roll = 0, T = 0) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.translate(W / 2, H / 2); g.rotate(roll); g.scale(z, z);
  const sx = shakeAmt ? shakeAmt * (rnd(Math.floor(T * 30), 1) - 0.5) : 0, sy = shakeAmt ? shakeAmt * (rnd(Math.floor(T * 30), 2) - 0.5) : 0;
  g.translate(-cx + sx, -cy + sy);
}
const screen = () => g.setTransform(1, 0, 0, 1, 0, 0);
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
    const y = rnd(i, 3) * H, len = 200 + rnd(i, 4) * 300, x0 = ((T * 2600 + rnd(i, 5) * 2000) % (W + len * 2)) - len, x = dir > 0 ? x0 : W - x0;
    g.lineWidth = 6 + rnd(i, 6) * 8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y); g.stroke();
  }
}
function petals(T, n = 50, t0 = 0) { // flower petals (Tahiti welcome) instead of confetti
  screen(); const cols = [HIB, "#ff9a3a", "#ffffff", "#ffd84a", "#ff6b8a"];
  for (let i = 0; i < n; i++) {
    const k = (T - t0) * (0.3 + rnd(i, 1) * 0.35) + rnd(i, 2), y = (k % 1) * (H + 200) - 100, x = rnd(i, 3) * W + 50 * Math.sin(T * 2 + i);
    g.save(); g.translate(x, y); g.rotate(T * 3 + i); g.beginPath(); g.ellipse(0, 0, 16, 9, 0, 0, Math.PI * 2); g.fillStyle = cols[i % 5]; g.fill(); g.lineWidth = 2; g.strokeStyle = "rgba(36,23,38,0.6)"; g.stroke(); g.restore();
  }
}
function qmark(x, y, s, T, col = GOLD) {
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
/** NEW label for this story: a woven "tapa" banner (cream bark-cloth with brown triangle border) */
function tapa(txt, y, pop, rot = -0.03, col = "#5a2e1a") {
  if (pop <= 0) return; screen(); g.save(); g.translate(W / 2, y); g.rotate(rot + 0.015 * Math.sin(pop * 8)); const k = clamp(pop, 0, 1.3); g.scale(k, k);
  g.font = "900 82px Montserrat"; g.textAlign = "center"; g.textBaseline = "middle";
  const w = g.measureText(txt).width + 150;
  g.beginPath(); g.rect(-w / 2, -78, w, 156); g.fillStyle = "#f3e2bf"; g.fill(); g.lineWidth = 10; g.strokeStyle = "#111"; g.stroke();
  g.fillStyle = col; for (let x = -w / 2 + 10; x < w / 2 - 20; x += 36) { for (const [yy, d] of [[-68, 1], [68, -1]]) { g.beginPath(); g.moveTo(x, yy); g.lineTo(x + 18, yy + d * 18); g.lineTo(x + 36, yy); g.closePath(); g.fill(); } }
  g.fillStyle = col; g.fillText(txt, 0, 6); g.restore();
}
/** red rubber-stamp label */
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
  g.beginPath(); g.moveTo(-r, 0); g.lineTo(-r * 0.3, r * 0.7); if (kk > 0.4) g.lineTo(-r * 0.3 + r * 1.3 * (kk - 0.4) / 0.6 * 1, r * 0.7 - r * 1.6 * (kk - 0.4) / 0.6);
  g.lineWidth = r * 0.36; g.strokeStyle = "#111"; g.stroke(); g.lineWidth = r * 0.24; g.strokeStyle = col; g.stroke(); g.restore();
}
function pin(x, y, k, col = HIB, label = "", lc = "#fff") {
  if (k <= 0) return; g.save(); g.translate(x, y); g.scale(k, k); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-40, -50, -40, -95, 0, -95); g.bezierCurveTo(40, -95, 40, -50, 0, 0);
  g.fillStyle = col; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke(); g.beginPath(); g.arc(0, -62, 14, 0, Math.PI * 2); g.fillStyle = "#fff"; g.fill(); g.restore();
  if (label) tag(label, x, y - 150 * k, lc, k, 64);
}
function calPage(x, y, s, top, big, flip = 0, col = HIB) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.beginPath(); g.roundRect(-200, -230, 400, 460, 24); g.fillStyle = "#fffdf4"; g.fill(); g.lineWidth = 9; g.strokeStyle = P.INK; g.stroke();
  g.beginPath(); g.roundRect(-200, -230, 400, 120, [24, 24, 0, 0]); g.fillStyle = col; g.fill(); g.stroke();
  g.fillStyle = "#fff"; g.font = "900 70px Montserrat"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(top, 0, -168);
  for (const rx of [-110, 110]) { g.beginPath(); g.roundRect(rx - 12, -270, 24, 80, 10); g.fillStyle = "#c9ccd2"; g.fill(); g.stroke(); }
  g.fillStyle = P.INK; g.font = `900 ${String(big).length > 2 ? 120 : 190}px Montserrat`; g.fillText(String(big), 0, 50);
  if (flip > 0) { g.save(); g.transform(1, 0, 0, 1 - flip, 0, -110 * flip); g.beginPath(); g.rect(-200, -110, 400, 340); g.fillStyle = "#fffdf4"; g.fill(); g.lineWidth = 6; g.stroke();
    g.fillStyle = P.INK; g.font = `900 ${String(big).length > 2 ? 120 : 190}px Montserrat`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(big - 1), 0, 50); g.restore(); } // the old page (previous number) lifts away
  g.restore();
}
function norFlag(x, y, w, T = 0) {
  const h = w * 0.73; g.beginPath(); g.rect(x - 6, y - 30, 12, h * 2.6); g.fillStyle = "#c9ccd2"; g.fill(); g.lineWidth = 4; g.strokeStyle = P.INK; g.stroke();
  g.save(); g.translate(x, y); g.transform(1, 0.035 * Math.sin(T * 3), 0, 1, 0, 0);
  g.beginPath(); g.rect(0, 0, w, h); g.fillStyle = "#c8203a"; g.fill(); g.lineWidth = 5; g.stroke();
  g.fillStyle = "#fff"; g.fillRect(w * 0.27, 0, w * 0.18, h); g.fillRect(0, h * 0.38, w, h * 0.24);
  g.fillStyle = "#1d3f8a"; g.fillRect(w * 0.31, 0, w * 0.1, h); g.fillRect(0, h * 0.44, w, h * 0.12);
  g.restore();
}

// ---------------- backdrops ----------------
const NIGHT = (horizon = 1250) => { const gr = g.createLinearGradient(0, -300, 0, horizon); gr.addColorStop(0, "#070b26"); gr.addColorStop(0.6, INDIGO); gr.addColorStop(1, "#3a3a7a"); g.fillStyle = gr; g.fillRect(-800, -800, 2700, 3600); };
const DAWN = (horizon = 1250) => { const gr = g.createLinearGradient(0, -300, 0, horizon); gr.addColorStop(0, "#2b2f6b"); gr.addColorStop(0.55, "#e07a6a"); gr.addColorStop(1, "#ffd08a"); g.fillStyle = gr; g.fillRect(-800, -800, 2700, 3600); };
const DAY = (horizon = 1250) => { const gr = g.createLinearGradient(0, -300, 0, horizon); gr.addColorStop(0, "#3aa6e0"); gr.addColorStop(0.7, "#9fdcff"); gr.addColorStop(1, "#e6f7ff"); g.fillStyle = gr; g.fillRect(-800, -800, 2700, 3600); };
function sea(T, horizon = 1250, mood = "day") {
  const C = { day: ["#3aa0c0", "#2a86a8", "#1f6a8a", "#175a78"], night: ["#24356e", "#1c2a5c", "#15204a", "#0f183a"], dawn: ["#6a7ab0", "#3f6a9a", "#2a5a84", "#1f4a70"], storm: ["#3a4a5a", "#2a3a4a", "#22303e", "#1a2632"] }[mood];
  P.ocean(g, horizon, T, C, -1500, 2600, mood === "storm" ? 3 : 1);
}
function sun(x, y, r, col = "#ffe08a") { const gr = g.createRadialGradient(x, y, r * 0.5, x, y, r * 2.6); gr.addColorStop(0, "rgba(255,230,150,0.6)"); gr.addColorStop(1, "rgba(255,230,150,0)"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 2.6, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = col; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke(); }
function moon(x, y, r) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = "#f6f0d8"; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke(); g.beginPath(); g.arc(x + r * 0.45, y - r * 0.2, r * 0.85, 0, Math.PI * 2); g.fillStyle = INDIGO; g.fill(); }
function nightSea(T, horizon = 1250) { NIGHT(horizon); P.stars(g, T, 150, horizon - 40, 3); moon(860, 300, 60); sea(T, horizon, "night"); }
/** Pacific map (screen coords): Hawaii top-centre, Tahiti lower-centre, Satawal far left, South America on the right edge */
const LOC = { haw: [560, 600], tah: [600, 1320], sat: [130, 820], peru: [1010, 1160], maui: [610, 640] };
function pacMap(T, o = {}) {
  if (o.z) cam(540, 1000, o.z, 0, T); else screen(); g.fillStyle = "#2a86a8"; g.fillRect(-600, -600, W + 1200, H + 1200);
  g.strokeStyle = "rgba(255,255,255,0.10)"; g.lineWidth = 3; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(0, 200 + i * 200); g.lineTo(W, 200 + i * 200); g.stroke(); g.beginPath(); g.moveTo(i * 140, 0); g.lineTo(i * 140, H); g.stroke(); }
  for (let i = 0; i < 26; i++) { const x = 260 + rnd(i, 1) * 520, y = 900 + rnd(i, 2) * 560; g.beginPath(); g.arc(x, y, 6 + rnd(i, 3) * 8, 0, Math.PI * 2); g.fillStyle = "#9fd08a"; g.fill(); g.lineWidth = 3; g.strokeStyle = P.INK; g.stroke(); }
  for (const [x, y, r] of [[540, 580, 18], [575, 605, 22], [610, 640, 26], [640, 680, 34], [600, 1320, 26], [120, 820, 9], [160, 840, 7]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = "#9fd08a"; g.fill(); g.lineWidth = 4; g.strokeStyle = P.INK; g.stroke(); }
  // South America (right edge)
  g.beginPath(); g.moveTo(W + 20, 760); g.lineTo(1000, 800); g.lineTo(960, 920); g.lineTo(990, 1060); g.lineTo(1010, 1200); g.lineTo(980, 1380); g.lineTo(1000, 1600); g.lineTo(1040, 1800); g.lineTo(W + 20, 1900); g.closePath();
  g.fillStyle = "#c9b27a"; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
  if (o.label !== false) { g.fillStyle = "rgba(255,255,255,0.35)"; g.font = "900 60px Montserrat"; g.textAlign = "center"; g.fillText("PACIFIC OCEAN", 420, 1700); }
}
function route(a, b, k, col = "#fff3b0", bend = 0.2, dash = true) {
  if (k <= 0) return; const [x0, y0] = a, [x1, y1] = b, mx = (x0 + x1) / 2 - (y1 - y0) * bend, my = (y0 + y1) / 2 + (x1 - x0) * bend;
  g.save(); if (dash) g.setLineDash([26, 18]); g.lineWidth = 12; g.lineCap = "round"; g.strokeStyle = col; g.beginPath();
  for (let i = 0; i <= 40 * k; i++) { const t = i / 40, x = (1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * mx + t * t * x1, y = (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * my + t * t * y1; i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.stroke(); g.restore();
  const t = clamp(k, 0, 1); return [(1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * mx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * my + t * t * y1];
}
function mountainsIsland(x, y, w, T, col = "#3f8a4a") { // tall volcanic island (Maui / Tahiti)
  g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x - w * 0.3, y - w * 0.28); g.lineTo(x - w * 0.15, y - w * 0.22); g.lineTo(x, y - w * 0.45); g.lineTo(x + w * 0.12, y - w * 0.3); g.lineTo(x + w * 0.25, y - w * 0.36); g.lineTo(x + w / 2, y); g.closePath();
  g.fillStyle = col; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
  g.beginPath(); g.moveTo(x - w * 0.52, y + 4); g.lineTo(x + w * 0.52, y + 4); g.lineWidth = 22; g.strokeStyle = SAND; g.stroke();
  for (let i = 0; i < 4; i++) P.palm(g, x - w * 0.4 + i * w * 0.26, y + 6, 130 + (i % 2) * 40, T + i, "#2f7a3a");
}
function hut(x, y, s) { // thatched hut interior wall
  g.save(); g.translate(x, y); g.scale(s, s);
  g.beginPath(); g.moveTo(-600, 0); g.lineTo(0, -520); g.lineTo(600, 0); g.closePath(); g.fillStyle = "#c9a060"; g.fill(); g.lineWidth = 8; g.strokeStyle = P.INK; g.stroke();
  g.strokeStyle = "rgba(90,58,30,0.6)"; g.lineWidth = 5; for (let i = -11; i <= 11; i++) { g.beginPath(); g.moveTo(i * 50, -520 + Math.abs(i) * 47); g.lineTo(i * 54, 0); g.stroke(); }
  g.restore();
}
function storm(T) { // rain streaks + lightning
  g.strokeStyle = "rgba(210,225,240,0.55)"; g.lineWidth = 4;
  for (let i = 0; i < 80; i++) { const x = ((rnd(i, 1) * 1400 + T * 300) % 1400) - 150, y = ((rnd(i, 2) * 2100 + T * 1600) % 2100) - 100; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 30, y + 70); g.stroke(); }
}

// ---------------- shots: [start (s), fn(t in shot, shot length, global T)] ----------------
const SHOTS = [
  [0, (t, d, T) => { // "Two men explained..." — split screen VS (opening, new)
    screen(); g.fillStyle = KHAKI; g.fillRect(0, 0, W / 2, H); g.fillStyle = TEALD; g.fillRect(W / 2, 0, W / 2, H);
    cam(540, 1000, lerp(1.0, 1.07, ss(t / d)), 0, T);
    g.save(); g.beginPath(); g.rect(-400, -400, 940, 2800); g.clip(); P.raft(g, 250, 1080, 0.4, T); ch(270, 1880, 0.9, HEYER, { expr: "smile", look: 1 }, 1, T, 3); g.restore();
    g.save(); g.beginPath(); g.rect(540, -400, 1000, 2800); g.clip(); P.canoe(g, 810, 1100, 0.36, { T, sail: SAILC }); ch(810, 1880, 0.9, MAU, { expr: "neutral", look: -1 }, -1, T, 4); g.restore();
    g.beginPath(); g.moveTo(540, -400); g.lineTo(540, 2400); g.lineWidth = 14; g.strokeStyle = "#111"; g.stroke();
    screen(); const k = back((t - 0.15) / 0.3);
    if (k > 0) { g.save(); g.translate(540, 1150); g.rotate(-0.1); g.scale(k, k); g.beginPath(); g.arc(0, 0, 120, 0, Math.PI * 2); g.fillStyle = GOLD; g.fill(); g.lineWidth = 12; g.strokeStyle = "#111"; g.stroke(); tag("VS", 0, 6, "#fff", 1, 110); g.restore(); }
    tag("2 MEN", 540, 300, "#fff", back((t - 0.05) / 0.25) * 1.5, 90);
  }],
  [T_("how"), (t, d, T) => { // "how islanders crossed the Pacific" — map with canoes crossing
    pacMap(T, { z: lerp(1.0, 1.1, ss(t / d)) });
    const k = ss(t / d);
    for (let i = 0; i < 4; i++) { const a = [[150, 830], [560, 620], [600, 1320], [400, 1100]][i], b = [[400, 1100], [600, 1320], [560, 620], [180, 840]][i]; const p = route(a, b, clamp(k * 1.3 - i * 0.12, 0, 1), "rgba(255,243,176,0.9)", 0.15);
      if (p) P.canoe(g, p[0], p[1] + 20, 0.12, { T, sail: SAILC, rock: 2 }); }
    screen(); tag("PACIFIC", 540, 330, GOLD, back((T - T_("pacific")) / 0.25) * 1.6, 100);
  }],
  [T_("only", 0), (t, d, T) => { // "Only one was right." — ✓ and ✗ swap between the two
    screen(); g.fillStyle = KHAKI; g.fillRect(0, 0, W / 2, H); g.fillStyle = TEALD; g.fillRect(W / 2, 0, W / 2, H);
    cam(540, 1000, lerp(1.08, 1.12, ss(t / d)), 0, T);
    face(270, 1350, 0.9, HEYER, { expr: "smile", look: 1 }, 1, T, 3);
    face(810, 1350, 0.9, MAU, { expr: "neutral", look: -1 }, -1, T, 4);
    g.beginPath(); g.moveTo(540, -400); g.lineTo(540, 2400); g.lineWidth = 14; g.strokeStyle = "#111"; g.stroke();
    screen(); const sw = Math.floor(t * 5) % 2; check(sw ? 270 : 810, 620, 90, 1); qmark(sw ? 810 : 270, 620, 0.6, T, "#fff");
    tapa("ONLY ONE WAS RIGHT", 330, back((t - 0.1) / 0.3));
  }],
  [SEG(1), (t, d, T) => { // "Man number one: Thor Heyerdahl" — close-up
    screen(); const gr = g.createRadialGradient(540, 900, 100, 540, 900, 1200); gr.addColorStop(0, "#f6e2b0"); gr.addColorStop(1, KHAKI); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    cam(540, 1000, lerp(1.0, 1.1, ss(t / d)), 0, T);
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2 + T * 0.2; g.beginPath(); g.moveTo(540, 1000); g.arc(540, 1000, 1700, a, a + 0.12); g.closePath(); g.fillStyle = "rgba(255,255,255,0.15)"; g.fill(); }
    face(540, 1000, 1.7, HEYER, { expr: talk(T, "smile", "grin"), look: 0 }, 1, T, 3);
    screen(); stamp("MAN #1", 540, 330, clamp((t - 0.05) / 0.25, 0, 1), "#8a5a2a", -0.08);
    tag("THOR HEYERDAHL", 540, 1640, GOLD, back((T - T_("thor")) / 0.25) * 1.1, 80);
  }],
  [T_("norwegian"), (t, d, T) => { // "a Norwegian explorer." — fjord + flag + binoculars-ish pose
    DAY(1150); cam(540, 1050, lerp(1.0, 1.06, ss(t / d)), 0, T);
    g.beginPath(); g.moveTo(-300, 1200); g.lineTo(100, 600); g.lineTo(300, 1000); g.lineTo(560, 520); g.lineTo(820, 980); g.lineTo(1000, 640); g.lineTo(1400, 1200); g.closePath(); g.fillStyle = "#6a7a9a"; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
    for (const [x, y] of [[100, 600], [560, 520], [1000, 640]]) { g.beginPath(); g.moveTo(x - 70, y + 110); g.lineTo(x, y); g.lineTo(x + 70, y + 110); g.lineTo(x + 25, y + 85); g.lineTo(x, y + 110); g.lineTo(x - 25, y + 85); g.closePath(); g.fillStyle = "#fff"; g.fill(); g.lineWidth = 4; g.stroke(); }
    sea(T, 1200, "day"); norFlag(760, 760, 230, T);
    ch(400, 1820, 0.95, HEYER, { expr: "grin", pose: "point", pointUp: 0.6, look: 1 }, 1, T, 3);
    screen(); tapa("NORWAY", 330, back((t - 0.05) / 0.3), -0.03, "#c8203a");
    tag("EXPLORER", 540, 520, "#fff", back((T - T_("explorer")) / 0.25) * 1.2, 70);
  }],
  [SEG(2), (t, d, T) => { // "In nineteen forty-seven," — the raft, big year
    DAY(1200); cam(540, 1100, lerp(1.12, 1.0, easeOut(t / d)), 0, T); P.cloud(g, 100 + T * 10, 400, 1.2); P.cloud(g, 700 - T * 8, 560, 1.0);
    sea(T, 1250, "day"); P.raft(g, 540, 1460, 0.95, T); ch(760, 1400, 0.4, HEYER, { expr: "smile", noShadow: true }, -1, T, 3);
    sea(T + 0.5, 1560, "day");
    bigNum(String(Math.round(lerp(1900, 1947, easeOut(t / 0.9)))), GOLD, "", back(t / 0.3), 330);
  }],
  [T_("peru"), (t, d, T) => { // "he rafted from Peru," — map: pin Peru, raft leaves westward
    pacMap(T, { z: lerp(1.0, 1.08, ss(t / d)) }); const k = ss((t - 0.2) / (d - 0.2));
    const p = route(LOC.peru, [430, 1180], k * 0.9, "#ffffff", -0.05);
    pin(LOC.peru[0] - 30, LOC.peru[1], back(t / 0.3), HIB, "");
    tag("PERU", 870, 1060, "#fff", back(t / 0.3), 80);
    P.raft(g, p ? p[0] : LOC.peru[0], (p ? p[1] : LOC.peru[1]) + 30, 0.17, T);
    screen(); tag("1947", 540, 330, GOLD, 1, 100);
  }],
  [T_("prove"), (t, d, T) => { // "to prove they came from South America." — Heyerdahl argues at a chart
    screen(); g.fillStyle = "#e9dcc0"; g.fillRect(0, 0, W, H); cam(540, 1050, lerp(1.0, 1.06, ss(t / d)), 0, T);
    g.save(); g.translate(60, 380); g.scale(0.62, 0.62); g.beginPath(); g.rect(0, 0, W, 1300); g.clip(); pacMap(T, { label: false }); g.restore(); cam(540, 1050, lerp(1.0, 1.06, ss(t / d)), 0, T);
    g.beginPath(); g.rect(60, 380, W * 0.62, 1300 * 0.62); g.lineWidth = 14; g.strokeStyle = "#8a5a34"; g.stroke();
    const k = ss((T - T_("south")) / 0.8);
    g.save(); g.translate(60, 380); g.scale(0.62, 0.62); route(LOC.peru, [400, 1100], k, HIB, -0.08, false); g.restore();
    if (k > 0.95) { g.save(); g.translate(60 + 400 * 0.62, 380 + 1100 * 0.62); g.rotate(-0.4); g.beginPath(); g.moveTo(-30, -30); g.lineTo(0, 0); g.lineTo(-30, 30); g.lineWidth = 12; g.strokeStyle = HIB; g.stroke(); g.restore(); }
    ch(860, 1880, 0.9, HEYER, { expr: talk(T, "talk", "grin"), pose: "point", pointUp: 0.9, look: -1 }, -1, T, 3);
    screen(); tag("SOUTH AMERICA", 540, 330, GOLD, back((T - T_("south")) / 0.25) * 1.1, 84);
    tag("→ ISLANDS", 540, 440, "#fff", back((T - T_("america")) / 0.25) * 1.0, 70);
  }],
  [SEG(3), (t, d, T) => { // "Others said islanders only got there" — rival scholars at a chalkboard
    screen(); g.fillStyle = "#c9b896"; g.fillRect(0, 0, W, H); cam(540, 1050, lerp(1.0, 1.07, ss(t / d)), 0, T);
    g.beginPath(); g.roundRect(120, 380, 840, 560, 20); g.fillStyle = "#2f4a3a"; g.fill(); g.lineWidth = 16; g.strokeStyle = "#8a5a34"; g.stroke();
    g.strokeStyle = "rgba(255,255,255,0.85)"; g.lineWidth = 7; g.lineCap = "round"; const k = clamp(t / 1.2, 0, 1);
    g.beginPath(); g.moveTo(220, 760); g.quadraticCurveTo(420, 540, 560 + 200 * k, 600 + 120 * Math.sin(k * 7)); g.stroke();
    g.beginPath(); g.ellipse(250, 790, 60, 18, 0, 0, Math.PI * 2); g.stroke(); g.font = "900 80px Montserrat"; g.fillStyle = "rgba(255,255,255,0.85)"; g.textAlign = "center"; g.fillText("?", 800, 720);
    ch(300, 1820, 0.85, SCHOLAR(0), { expr: talk(T, "talk", "stern"), pose: "point", pointUp: 0.8 }, 1, T, 31);
    ch(780, 1840, 0.85, SCHOLAR(1), { expr: talk(T, "stern", "talk", 1), pose: "chin" }, -1, T, 32);
    screen(); tag("OTHER EXPERTS", 540, 300, GOLD, back((t - 0.05) / 0.25) * 1.2, 80);
  }],
  [T_("accident"), (t, d, T) => { // "by accident." — a tiny canoe tossed by a storm
    shakeAmt = 10; screen(); g.fillStyle = "#2a3440"; g.fillRect(0, 0, W, H); cam(540, 1100, lerp(1.05, 1.12, ss(t / d)), 0.03 * Math.sin(T * 3), T);
    sea(T * 2, 1150, "storm");
    P.canoe(g, 540 + 120 * Math.sin(T * 2), 1300 + 40 * Math.sin(T * 3), 0.55, { T: T * 3, rock: 6, sail: "#b8a07a", sails: 0.8 });
    sea(T * 2 + 1, 1420, "storm"); storm(T);
    if (Math.floor(T * 6) % 7 === 0) { screen(); g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(0, 0, W, H); }
    speedLines(T, 8, "rgba(255,255,255,0.35)");
    tapa("BY ACCIDENT?", 330, back((t - 0.05) / 0.3), 0.03, "#3a4a6a");
  }],
  [SEG(4), (t, d, T) => { // "Man number two: Mau Piailug" — close-up at dawn
    DAWN(1300); cam(540, 1000, lerp(1.0, 1.1, ss(t / d)), 0, T); sun(540, 1250, 150); sea(T, 1300, "dawn");
    face(540, 980, 1.7, MAU, { expr: talk(T, "smile", "neutral"), look: 0 }, 1, T, 4);
    screen(); stamp("MAN #2", 540, 330, clamp((t - 0.05) / 0.25, 0, 1), TEALD, -0.08);
    tag("MAU PIAILUG", 540, 1640, GOLD, back((T - T_("mau", 0)) / 0.25) * 1.2, 90);
  }],
  [T_("tiny"), (t, d, T) => { // "from the tiny island of Satawal." — pull back: a dot in the ocean
    screen(); g.fillStyle = "#2a86a8"; g.fillRect(0, 0, W, H);
    const z = lerp(3.2, 0.7, ss(t / (d * 0.8)));
    cam(540, 1050, z, 0, T);
    g.strokeStyle = "rgba(255,255,255,0.25)"; g.lineWidth = 4 / z; for (let i = 0; i < 40; i++) { const x = rnd(i, 1) * 3000 - 960, y = rnd(i, 2) * 3600 - 750; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 30, y - 10, x + 60, y); g.stroke(); }
    g.beginPath(); g.arc(540, 1050, 160, 0, Math.PI * 2); g.fillStyle = "rgba(160,230,230,0.55)"; g.fill();
    P.island(g, 540, 1060, 200, T, 2);
    screen(); pin(540, 1050 - 40 * z, back((T - T_("satawal")) / 0.3), HIB);
    tag("TINY", 540, 330, "#fff", back(t / 0.25) * 1.4, 90);
    tapa("SATAWAL", 1640, back((T - T_("satawal")) / 0.3), 0.02);
    tag("MICRONESIA", 540, 1790, "#fff", back((T - T_("satawal") - 0.3) / 0.25), 54);
  }],
  [SEG(5), (t, d, T) => { // "By then, no Hawaiian still knew the ancient way." — puzzled Hawaiians around an unfinished canoe
    DAY(1200); cam(540, 1100, lerp(1.0, 1.06, ss(t / d)), 0, T); P.cloud(g, 200 + T * 8, 380, 1.1);
    mountainsIsland(540, 1200, 1400, T, "#3f8a4a"); P.ground(g, -3000, 4000, 1210, SAND);
    P.canoe(g, 540, 1520, 0.62, { T: 0, rock: 0, sails: 0.0 });
    for (let i = 0; i < 3; i++) ch(220 + i * 320, 1860, 0.7, HAWAI(i), { expr: i === 1 ? "nervous" : "gulp", pose: i === 1 ? "chin" : "cheek" }, i === 2 ? -1 : 1, T, 40 + i);
    for (let i = 0; i < 3; i++) qmark(220 + i * 320, 980, 0.45, T + i);
    screen(); tag("1970s HAWAII", 540, 300, GOLD, back((t - 0.05) / 0.25) * 1.2, 80);
    tag("NOBODY KNEW", 540, 420, "#fff", back((T - T_("knew")) / 0.25), 70);
  }],
  [T_("ancient"), (t, d, T) => { // "the ancient way." — an old carved star-path stone crumbling away
    screen(); g.fillStyle = "#3a2e2a"; g.fillRect(0, 0, W, H); cam(540, 1000, lerp(1.0, 1.08, ss(t / d)), 0, T);
    const k = clamp((t - 0.6) / 1.0, 0, 1);
    g.save(); g.globalAlpha = 1 - 0.7 * k; g.beginPath(); g.roundRect(170, 520, 740, 900, 120); g.fillStyle = "#8a8070"; g.fill(); g.lineWidth = 10; g.strokeStyle = P.INK; g.stroke();
    g.strokeStyle = "#3a3028"; g.lineWidth = 9; g.lineCap = "round";
    for (const [x, y] of [[300, 650], [420, 720], [560, 640], [700, 760], [780, 620]]) { g.beginPath(); for (let j = 0; j < 8; j++) { const a = (j * Math.PI) / 4; g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 26, y + Math.sin(a) * 26); } g.stroke(); }
    g.beginPath(); g.moveTo(300, 650); g.lineTo(420, 720); g.lineTo(560, 640); g.lineTo(700, 760); g.lineTo(780, 620); g.setLineDash([16, 14]); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.moveTo(300, 1100); g.quadraticCurveTo(540, 1250, 780, 1100); g.lineTo(720, 1180); g.lineTo(360, 1180); g.closePath(); g.stroke();
    g.beginPath(); g.moveTo(540, 1110); g.lineTo(540, 930); g.lineTo(420, 1080); g.closePath(); g.stroke();
    g.restore();
    for (let i = 0; i < 40; i++) { const kk = clamp(k * 1.4 - rnd(i, 1) * 0.4, 0, 1); if (kk <= 0) continue; g.beginPath(); g.arc(200 + rnd(i, 2) * 700 + kk * 500, 560 + rnd(i, 3) * 840 - kk * 200, 8 + rnd(i, 4) * 10, 0, Math.PI * 2); g.fillStyle = `rgba(170,160,140,${1 - kk})`; g.fill(); }
    screen(); stamp("LOST", 540, 330, clamp((t - 0.2) / 0.25, 0, 1));
  }],
  [SEG(6), (t, d, T) => { // "In May nineteen seventy-six," — calendar at sunrise
    DAWN(1300); cam(540, 1000, lerp(1.0, 1.06, ss(t / d)), 0, T); sun(540, 1250, 170); sea(T, 1300, "dawn");
    const yr = 1971 + Math.min(5, Math.floor(t * 5)), fl = (t * 5) % 1;
    calPage(540, 860, 1.5, "MAY", yr, yr < 1976 ? fl : 0, TEALD);
  }],
  [T_("mau", 1), (t, d, T) => { // "Mau led" — Mau at the bow, pointing ahead
    DAWN(1300); cam(540, 1200, lerp(1.02, 1.08, ss(t / d)), 0, T); sun(820, 1150, 120); sea(T, 1300, "dawn");
    P.canoe(g, 540, 1800, 1.2, { T, sail: SAILC, crew: ["#b98058", "#a87048"] });
    ch(300, 1660, 0.95, MAU, { expr: "grin", pose: "point", pointUp: 0.3, look: -1 }, -1, T, 4);
    screen(); tag("NAVIGATOR", 540, 330, GOLD, back((t - 0.05) / 0.25) * 1.2, 90);
  }],
  [T_("double"), (t, d, T) => { // "a double canoe" — labelled hulls
    DAY(1250); cam(540, 1150, lerp(1.0, 1.06, ss(t / d)), 0, T); P.cloud(g, 150 + T * 10, 420, 1.2); P.cloud(g, 760 - T * 8, 300, 0.9);
    sea(T, 1300, "day"); P.canoe(g, 540, 1560, 1.15, { T, sail: SAILC, crew: ["#b98058", "#a87048", "#c48a5e", "#9a6440"] }); sea(T + 0.7, 1640, "day");
    screen(); const k = back((t - 0.3) / 0.3);
    tag("HULL 1", 260, 1720, "#fff", k, 60); tag("HULL 2", 820, 1290, "#fff", back((t - 0.5) / 0.3), 60);
    tapa("DOUBLE CANOE", 330, back((t - 0.05) / 0.3));
    tag("HŌKŪLEʻA", 540, 470, GOLD, back((t - 0.3) / 0.25) * 1.0, 70);
  }],
  [T_("maui"), (t, d, T) => { // "out of Maui." — leaving the island
    DAY(1250); cam(540, 1150, lerp(1.0, 1.08, ss(t / d)), 0, T);
    mountainsIsland(lerp(640, 760, t / d), 1250, 1100, T, "#3f8a4a"); sea(T, 1260, "day");
    P.canoe(g, lerp(500, 260, t / d), 1560, 0.6, { T, sail: SAILC, dir: -1 }); sea(T + 0.7, 1640, "day");
    screen(); pin(720, 860, back((t - 0.05) / 0.3), HIB, ""); tapa("MAUI, HAWAII", 330, back((t - 0.05) / 0.3), -0.03);
    tag("MAY 1, 1976", 540, 470, "#fff", back((t - 0.25) / 0.25), 64);
  }],
  [SEG(7), (t, d, T) => { // "No compass."
    screen(); g.fillStyle = "#1c2a5c"; g.fillRect(0, 0, W, H); cam(540, 1000, lerp(1.0, 1.08, ss(t / d)), 0, T);
    P.compass(g, 540, 900, 300, T); bigX(540, 900, 300, clamp((t - 0.2) / 0.3, 0, 1));
    screen(); tag("NO COMPASS", 540, 330, "#fff", back(t / 0.25) * 1.3, 90);
  }],
  [T_("map"), (t, d, T) => { // "No map."
    screen(); g.fillStyle = "#24356e"; g.fillRect(0, 0, W, H); cam(540, 1000, lerp(1.0, 1.08, ss(t / d)), 0, T);
    P.paperMap(g, 540, 900, 700, -0.06 + 0.02 * Math.sin(T * 2)); bigX(540, 900, 300, clamp((t - 0.15) / 0.3, 0, 1));
    screen(); tag("NO MAP", 540, 330, "#fff", back(t / 0.25) * 1.3, 90);
  }],
  [T_("instruments"), (t, d, T) => { // "No instruments at all." — sextant, clock, radio all crossed; Mau shrugs
    screen(); g.fillStyle = "#2b2f6b"; g.fillRect(0, 0, W, H); cam(540, 1000, lerp(1.0, 1.06, ss(t / d)), 0, T);
    P.sextant(g, 300, 760, 0.8, -0.2); bigX(300, 720, 170, clamp((t - 0.1) / 0.25, 0, 1));
    g.beginPath(); g.roundRect(640, 560, 300, 220, 20); g.fillStyle = "#5a5f6a"; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
    g.beginPath(); g.arc(720, 670, 50, 0, Math.PI * 2); g.fillStyle = "#c9ccd2"; g.fill(); g.stroke(); g.beginPath(); g.moveTo(900, 560); g.lineTo(940, 420); g.stroke();
    for (let i = 0; i < 3; i++) { g.beginPath(); g.rect(800, 610 + i * 40, 100, 14); g.fillStyle = "#2a2a30"; g.fill(); }
    bigX(790, 670, 170, clamp((t - 0.35) / 0.25, 0, 1));
    face(540, 1450, 1.0, MAU, { expr: "deadpan", look: 0 }, 1, T, 4);
    screen(); stamp("NONE", 540, 330, clamp((t - 0.5) / 0.25, 0, 1));
  }],
  [SEG(8), (t, d, T) => { // "Just rising stars," — stars rising over the horizon, Mau watches
    nightSea(T, 1300); cam(540, 1100, lerp(1.0, 1.06, ss(t / d)), 0, T);
    screen(); NIGHT(1300); P.stars(g, T, 160, 1260, 5); cam(540, 1100, lerp(1.0, 1.06, ss(t / d)), 0, T);
    for (let i = 0; i < 3; i++) { const k = clamp((t - i * 0.25) / 1.6, 0, 1); P.bigStar(g, 600 + i * 150, lerp(1320, 760 - i * 90, easeOut(k)), 34 - i * 6, T + i); }
    sea(T, 1300, "night");
    ch(330, 1820, 1.0, MAU, { expr: "smile", pose: "point", pointUp: 1.2, look: 1 }, 1, T, 4);
    screen(); tag("RISING STARS", 540, 330, GOLD, back((T - T_("rising")) / 0.25) * 1.2, 90);
  }],
  [T_("ocean"), (t, d, T) => { // "ocean swells," — the canoe rides long swells; arrows show their direction
    screen(); DAY(900); cam(540, 1000, lerp(1.0, 1.06, ss(t / d)), 0, T);
    P.ocean(g, 900, T * 1.4, ["#3aa0c0", "#2a86a8", "#1f6a8a", "#175a78"], -1500, 2600, 4);
    P.canoe(g, 540, 1250 + 40 * Math.sin(T * 1.8), 0.7, { T: T * 1.5, rock: 4, sail: SAILC, crew: ["#a06a44"] });
    P.ocean(g, 1380, T * 1.4 + 2, ["#2a86a8", "#1f6a8a", "#175a78"], -1500, 2600, 4);
    for (let i = 0; i < 3; i++) { const x = ((T * 220 + i * 380) % 1400) - 160, y = 1500 + i * 120; g.save(); g.translate(x, y); g.beginPath(); g.moveTo(-60, 0); g.lineTo(50, 0); g.moveTo(20, -30); g.lineTo(55, 0); g.lineTo(20, 30); g.lineWidth = 14; g.strokeStyle = "#fff"; g.lineCap = "round"; g.stroke(); g.restore(); }
    screen(); tag("SWELLS", 540, 330, "#fff", back(t / 0.25) * 1.4, 100);
  }],
  [T_("birds"), (t, d, T) => { // "and birds."
    DAY(1300); cam(540, 1000, lerp(1.0, 1.08, ss(t / d)), 0, T); P.cloud(g, 120 + T * 12, 500, 1.3); sea(T, 1300, "day");
    for (let i = 0; i < 6; i++) P.tern(g, ((T * 160 + i * 260) % 1500) - 200, 600 + (i % 3) * 170 + 30 * Math.sin(T * 2 + i), 0.9 - (i % 3) * 0.15, T + i * 0.3);
    screen(); tag("BIRDS", 540, 330, GOLD, back(t / 0.25) * 1.4, 100);
  }],
  [SEG(9), (t, d, T) => { // "On board: fifteen crew," — the crew lines up on deck
    DAY(1200); cam(540, 1150, lerp(1.0, 1.05, ss(t / d)), 0, T); sea(T, 1250, "day");
    P.canoe(g, 540, 1900, 1.7, { T: 0, rock: 0, sail: SAILC });
    const n = Math.min(15, Math.floor(clamp((T - T_("fifteen")) / 1.0, 0, 1) * 15) + 4);
    g.save(); g.beginPath(); g.rect(-500, -500, 2100, 2300); g.clip(); // crew stand inside the near hull (gunwale at y≈1815)
    for (let i = 0; i < n; i++) ch(70 + (i % 8) * 135 + (i >= 8 ? 68 : 0), i >= 8 ? 1960 : 1880, i >= 8 ? 0.5 : 0.42, i === 0 ? MAU : HAWAI(i), { expr: "grin", wave: Math.sin(T * 7 + i), noShadow: true }, i % 2 ? -1 : 1, T, 60 + i);
    g.restore();
    bigNum(Math.min(15, Math.max(0, Math.round(lerp(0, 15, clamp((T - T_("fifteen")) / 0.8, 0, 1))))), GOLD, "CREW", back((T - T_("fifteen") + 0.1) / 0.25), 330);
  }],
  [T_("dog"), (t, d, T) => { // "a dog,"
    DAY(1200); cam(540, 1150, lerp(1.0, 1.07, ss(t / d)), 0, T); sea(T, 1250, "day");
    g.beginPath(); g.rect(-400, 1500, 1900, 900); g.fillStyle = "#c8a070"; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
    for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(-200 + i * 220, 1500); g.lineTo(-300 + i * 240, 2400); g.lineWidth = 5; g.stroke(); }
    P.dog(g, 540, 1640 - 120 * Math.max(0, 1 - t / 0.25), 1.9, T);
    screen(); tag("A DOG", 540, 330, "#fff", back(t / 0.2) * 1.4, 100);
  }],
  [T_("pig"), (t, d, T) => { // "a pig,"
    DAY(1200); cam(540, 1150, lerp(1.0, 1.07, ss(t / d)), 0, T); sea(T, 1250, "day");
    g.beginPath(); g.rect(-400, 1500, 1900, 900); g.fillStyle = "#c8a070"; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
    P.dog(g, 160, 1640, 0.9, T); P.pig(g, 560, 1660 - 120 * Math.max(0, 1 - t / 0.25), 1.8, T);
    screen(); tag("A PIG", 540, 330, "#ff9fb0", back(t / 0.2) * 1.4, 100);
  }],
  [T_("and", 1), (t, d, T) => { // "and some chickens." — the whole menagerie
    DAY(1200); cam(540, 1150, lerp(1.0, 1.06, ss(t / d)), 0, T); sea(T, 1250, "day");
    g.beginPath(); g.rect(-400, 1500, 1900, 900); g.fillStyle = "#c8a070"; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
    P.dog(g, 140, 1640, 0.9, T); P.pig(g, 400, 1660, 0.9, T);
    const kc = T - T_("chickens");
    for (let i = 0; i < 3; i++) if (kc > i * 0.12) P.chicken(g, 660 + i * 150, 1650 - 90 * Math.max(0, 1 - (kc - i * 0.12) / 0.2), 1.0, T + i, i === 1 ? "#c87a3a" : "#f6f3ea");
    screen(); tag("CHICKENS", 540, 330, GOLD, back(kc / 0.2) * 1.3, 100);
  }],
  [SEG(10), (t, d, T) => { // "After a month," — days and nights race by
    const day = Math.min(31, 1 + Math.floor(t * 12)), ph = (t * 12) % 1, isN = day % 2 === 0;
    screen(); (isN ? NIGHT : DAY)(1300); if (isN) P.stars(g, T, 100, 1250, 7);
    cam(540, 1000, lerp(1.0, 1.06, ss(t / d)), 0, T);
    if (isN) moon(lerp(-100, 1180, ph), 800 - 300 * Math.sin(ph * Math.PI), 60); else sun(lerp(-100, 1180, ph), 900 - 400 * Math.sin(ph * Math.PI), 90);
    sea(T, 1300, isN ? "night" : "day"); P.canoe(g, 540, 1580, 0.6, { T, sail: SAILC }); sea(T + 0.6, 1660, isN ? "night" : "day");
    bigNum("DAY " + day, GOLD, "AT SEA", 1, 330);
  }],
  [T_("white"), (t, d, T) => { // "white terns appeared." — terns circle, Mau points
    DAWN(1300); cam(540, 1100, lerp(1.0, 1.06, ss(t / d)), 0, T); sun(300, 1250, 110); sea(T, 1300, "dawn");
    P.canoe(g, 640, 1760, 1.1, { T, sail: SAILC, crew: ["#b98058", "#a87048", "#c48a5e"] });
    for (let i = 0; i < 4; i++) { const a = T * 1.2 + i * 1.6; P.tern(g, 560 + Math.cos(a) * 320, 640 + Math.sin(a) * 140, 0.95, T + i * 0.4, Math.sin(a) > 0 ? -1 : 1); }
    ch(820, 1640, 0.9, MAU, { expr: "grin", pose: "point", pointUp: 1.0, look: -1 }, -1, T, 4);
    screen(); tag("WHITE TERNS", 540, 330, "#fff", back(t / 0.25) * 1.2, 90);
  }],
  [T_("land"), (t, d, T) => { // "Land was near." — an island on the horizon, crew cheers
    DAWN(1300); cam(540, 1150, lerp(1.0, 1.1, ss(t / d)), 0, T); sun(760, 1240, 120);
    P.island(g, 760, 1290, lerp(80, 260, ss(t / d)), T, 2); sea(T, 1300, "dawn");
    for (let i = 0; i < 3; i++) ch(200 + i * 220, 1850, 0.8, i === 0 ? MAU : HAWAI(i + 2), { expr: "laugh", pose: "cheer" }, 1, T, 70 + i);
    sparkle(760, 1180, 80, T);
    screen(); tapa("LAND!", 330, back((t - 0.05) / 0.3), -0.04);
  }],
  [SEG(11), (t, d, T) => { // "On June fourth," — calendar
    DAY(1300); cam(540, 1000, lerp(1.0, 1.06, ss(t / d)), 0, T); sea(T, 1300, "day");
    const dd = 1 + Math.min(3, Math.floor(t * 7)), fl = (t * 7) % 1;
    calPage(540, 860, 1.5, "JUNE", dd, dd < 4 ? fl : 0, HIB);
    tag("1976", 540, 330, "#fff", 1, 100);
  }],
  [T_("they", 1), (t, d, T) => { // "they reached Tahiti." — arrival under green peaks
    DAY(1250); cam(540, 1150, lerp(1.0, 1.06, ss(t / d)), 0, T); P.cloud(g, 180 + T * 10, 380, 1.1);
    mountainsIsland(560, 1260, 1300, T, "#2f7a3a"); sea(T, 1270, "day");
    P.canoe(g, lerp(1000, 640, ss(t / d)), 1600, 0.8, { T, sail: SAILC, dir: -1, crew: ["#b98058", "#a87048"] }); sea(T + 0.6, 1700, "day");
    screen(); tapa("TAHITI", 330, back((T - T_("tahiti")) / 0.3), -0.03, "#2f6b5a");
    pin(560, 900, back((T - T_("tahiti")) / 0.3), HIB);
  }],
  [T_("over", 0), (t, d, T) => { // "Over seventeen thousand people were waiting." — the beach crowd
    DAY(1150); cam(540, 1150, lerp(1.0, 1.05, ss(t / d)), 0, T);
    mountainsIsland(540, 1150, 1500, T, "#2f7a3a"); P.ground(g, -3000, 4000, 1160, SAND);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) { const x = 40 + i * 165 + (r % 2) * 80, j = Math.abs(Math.sin(T * 6 + i + r)) * 16;
      ch(x, 1400 + r * 200 - j, 0.42 + r * 0.1, TAHI(i + r * 3), { expr: (i + r) % 3 ? "grin" : "laugh", pose: (i + r) % 2 ? "cheer" : undefined, wave: (i + r) % 2 ? undefined : Math.sin(T * 8 + i) }, i % 2 ? -1 : 1, T, 80 + i + r * 10); }
    petals(T, 50, 46);
    bigNum(Math.round(lerp(0, 17000, easeOut((T - T_("seventeen")) / 1.0)) / 100) * 100, GOLD, "PEOPLE", back((T - T_("seventeen") + 0.1) / 0.25), 330);
  }],
  [SEG(12), (t, d, T) => { // "The twist?"
    screen(); g.fillStyle = "#3a1630"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2 + T * 0.8; g.beginPath(); g.moveTo(540, 960); g.arc(540, 960, 1700, a, a + 0.14); g.closePath(); g.fillStyle = i % 2 ? "rgba(255,201,74,0.18)" : "rgba(232,71,90,0.18)"; g.fill(); }
    cam(540, 960, lerp(1.0, 1.1, ss(t / d)), 0, T);
    qmark(540, 1000, 2.2, T, GOLD);
    screen(); stamp("THE TWIST", 540, 330, clamp(t / 0.25, 0, 1), GOLD, -0.08, 120);
  }],
  [T_("family"), (t, d, T) => { // "This knowledge was a family secret." — an elder whispers to a boy in a hut
    screen(); g.fillStyle = "#5a3a22"; g.fillRect(0, 0, W, H); cam(540, 1100, lerp(1.0, 1.07, ss(t / d)), 0, T);
    hut(540, 1250, 1.2); g.fillStyle = "#7a5432"; g.fillRect(-500, 1250, 2100, 1200);
    const gr = g.createRadialGradient(540, 1400, 50, 540, 1400, 600); gr.addColorStop(0, "rgba(255,200,120,0.45)"); gr.addColorStop(1, "rgba(255,200,120,0)"); g.fillStyle = gr; g.fillRect(-200, 700, 1500, 1400);
    ch(360, 1800, 0.95, ELDER, { expr: "whistle", look: 1, pose: "cheek" }, 1, T, 90);
    ch(720, 1800, 0.95, BOY, { expr: "smile", look: -1 }, -1, T, 91);
    P.starCompass(g, 540, 900, 160, T, 0.8); P.bigStar(g, 540, 900, 40, T);
    // padlock
    const k = back((t - 0.4) / 0.3); if (k > 0) { g.save(); g.translate(880, 700); g.scale(k, k); g.beginPath(); g.arc(0, -40, 46, Math.PI, 0); g.lineWidth = 18; g.strokeStyle = "#c9ccd2"; g.stroke(); g.lineWidth = 6; g.strokeStyle = P.INK;
      g.beginPath(); g.roundRect(-70, -40, 140, 110, 16); g.fillStyle = GOLD; g.fill(); g.stroke(); g.beginPath(); g.arc(0, 10, 14, 0, Math.PI * 2); g.fillStyle = P.INK; g.fill(); g.restore(); }
    screen(); tapa("FAMILY SECRET", 330, back((t - 0.05) / 0.3), -0.03, "#5a2e1a");
  }],
  [T_("mau", 2), (t, d, T) => { // "Mau shared it anyway." — a glowing star travels from Mau's hand to a Hawaiian student's (new: object exchange mid-air)
    DAWN(1300); cam(540, 1150, lerp(1.0, 1.05, ss(t / d)), 0, T); sun(540, 1280, 120); sea(T, 1300, "dawn"); P.ground(g, -3000, 4000, 1520, SAND);
    const k = ss((t - 0.35) / 0.9), sx = lerp(400, 690, k), sy = 1210 - 160 * Math.sin(k * Math.PI);
    ch(260, 1840, 0.95, MAU, { expr: "grin", pose: "give", pointUp: 0.1, look: 1 }, 1, T, 4);
    ch(820, 1840, 0.95, NAINOA, { expr: k > 0.9 ? "grin" : "shock", pose: "give", pointUp: 0.1, look: -1 }, -1, T, 5);
    P.bigStar(g, sx, sy, 46, T); sparkle(sx, sy, 70, T);
    screen(); tapa("HE SHARED IT", 330, back((T - T_("shared")) / 0.3), 0.03);
  }],
  [SEG(13), (t, d, T) => { // "He trained a young Hawaiian, Nainoa Thompson," — night lesson inside a star compass of stones
    nightSea(T, 1250); cam(540, 1150, lerp(1.0, 1.06, ss(t / d)), 0, T);
    P.ground(g, -3000, 4000, 1450, "#c8b07a");
    g.save(); g.translate(540, 1650); g.scale(1, 0.3); P.starCompass(g, 0, 0, 480, T, 1); g.restore();
    P.bigStar(g, 820, 560, 40, T); P.bigStar(g, 300, 470, 28, T + 1);
    ch(380, 1760, 0.95, MAU, { expr: talk(T, "talk", "smile"), pose: "point", pointUp: 1.1, look: 1 }, 1, T, 4);
    ch(720, 1780, 0.9, NAINOA, { expr: "smile", pose: "chin", look: 1 }, -1, T, 5);
    screen(); tag("TRAINED", 540, 300, GOLD, back((t - 0.05) / 0.25) * 1.2, 90);
    tag("NAINOA THOMPSON", 540, 1740, "#fff", back((T - T_("nainoa")) / 0.25), 80);
  }],
  [T_("voyages"), (t, d, T) => { // "and the voyages never stopped." — routes multiply across the Pacific, years tick to 2026
    pacMap(T, { label: false, z: lerp(1.0, 1.06, ss(t / d)) }); const k = clamp(t / (d * 0.85), 0, 1);
    const R = [[LOC.haw, LOC.tah], [LOC.tah, [300, 1700]], [LOC.haw, [160, 300]], [LOC.tah, [900, 1500]], [LOC.haw, LOC.sat], [LOC.sat, [80, 1500]], [LOC.haw, [1000, 300]]];
    R.forEach(([a, b], i) => { const p = route(a, b, clamp(k * 1.6 - i * 0.12, 0, 1), i % 2 ? "#fff3b0" : "#ffffff", 0.15); if (p && k * 1.6 - i * 0.12 < 1) P.canoe(g, p[0], p[1] + 15, 0.1, { T, sail: SAILC, rock: 2 }); });
    bigNum(String(Math.round(lerp(1976, 2026, easeOut(k)))), GOLD, "STILL SAILING", 1, 330);
  }],
  [SEG(14), (t, d, T) => { // "Old knowledge isn't primitive." — the word gets crossed out
    screen(); g.fillStyle = INDIGO; g.fillRect(0, 0, W, H); P.stars(g, T, 80, H, 11);
    cam(540, 1000, lerp(1.0, 1.06, ss(t / d)), 0, T);
    tag("PRIMITIVE?", 540, 900, "#e8e1cf", back(t / 0.3) * 1.0, 130);
    const k = clamp((T - T_("primitive") - 0.25) / 0.35, 0, 1); if (k > 0) { g.beginPath(); g.moveTo(80, 930); g.lineTo(80 + 920 * k, 870); g.lineWidth = 30; g.lineCap = "round"; g.strokeStyle = "#e0303a"; g.stroke(); }
    face(540, 1330, 0.9, MAU, { expr: k > 0.5 ? "smile" : "deadpan" }, 1, T, 4);
    screen(); tag("OLD KNOWLEDGE", 540, 330, GOLD, back((t - 0.05) / 0.25) * 1.1, 84);
  }],
  [T_("its"), (t, d, T) => { // "It's science, stored in people." — a star map glows around Mau's head, connecting
    screen(); g.fillStyle = "#0e1540"; g.fillRect(0, 0, W, H); cam(540, 1000, lerp(1.0, 1.08, ss(t / d)), 0, T);
    const pts = []; for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, r = 330 + 60 * rnd(i, 2); pts.push([540 + Math.cos(a) * r, 900 + Math.sin(a) * r * 0.8]); }
    const k = clamp(t / 1.4, 0, 1);
    g.strokeStyle = "rgba(255,230,160,0.7)"; g.lineWidth = 5; g.beginPath(); pts.slice(0, Math.max(2, Math.floor(k * 14))).forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    pts.forEach(([x, y], i) => { if (i / 14 <= k) P.bigStar(g, x, y, 18, T + i); });
    P.starCompass(g, 540, 900, 240, T, 0.6);
    face(540, 920, 1.25, MAU, { expr: "grin" }, 1, T, 4);
    screen(); tag("SCIENCE", 540, 330, GOLD, back((T - T_("science")) / 0.25) * 1.5, 100);
    tag("STORED IN PEOPLE", 540, 1650, "#fff", back((T - T_("stored")) / 0.25), 70);
  }],
  [SEG(15), (t, d, T) => { // "Could you find your way home" — a phone with no signal, adrift
    nightSea(T, 1300); cam(540, 1100, lerp(1.0, 1.06, ss(t / d)), 0, T);
    P.phone(g, 540, 900 + 20 * Math.sin(T * 2), 760, 0.06 * Math.sin(T * 1.5), "NO\nSIGNAL", "#3a4a6a");
    g.save(); g.translate(540, 720); for (let i = 0; i < 4; i++) { g.beginPath(); g.rect(-75 + i * 40, 30 - i * 25, 26, 20 + i * 25); g.fillStyle = i < 1 ? "#fff" : "rgba(255,255,255,0.25)"; g.fill(); } g.restore();
    qmark(880, 560, 0.6, T, GOLD);
    sea(T + 0.5, 1500, "night");
    screen(); tag("FIND YOUR WAY HOME?", 540, 330, "#fff", back(t / 0.25) * 1.0, 74);
  }],
  [T_("without"), (t, d, T) => { // "without your phone?" — ending: Mau and Nainoa on the canoe under the stars
    nightSea(T, 1250); cam(540, 1150, lerp(1.0, 1.08, ss(t / d)), 0, T);
    P.bigStar(g, 760, 520, 46, T); P.starCompass(g, 760, 520, 130, T, 0.5);
    P.canoe(g, 540, 1720, 1.25, { T, sail: SAILC });
    ch(380, 1600, 0.75, MAU, { expr: "smile", pose: "point", pointUp: 1.3, look: 1 }, 1, T, 4);
    ch(640, 1590, 0.72, NAINOA, { expr: "grin", pose: "point", pointUp: 1.3, look: 1 }, 1, T, 5);
    sea(T + 0.6, 1800, "night");
    screen(); tapa("COMMENT ↓", 330, back((t - 0.15) / 0.3), -0.03);
  }],
];
const SH = SHOTS.map((s) => s[0]);

// ---------------- captions (star-gold accent on key words) ----------------
const allWords = segs.flatMap((s) => s.words);
const KEY = /^(two|men|pacific|one|right|thor|heyerdahl|norwegian|explorer|nineteen|fortyseven|peru|prove|south|america|accident|mau|piailug|tiny|satawal|hawaiian|ancient|may|seventysix|double|canoe|maui|compass|map|instruments|stars|swells|birds|fifteen|dog|pig|chickens|month|white|terns|land|june|fourth|tahiti|seventeen|thousand|twist|family|secret|shared|nainoa|thompson|voyages|primitive|science|people|home|phone)$/i;
function captions(T) {
  let w = null;
  for (let i = 0; i < allWords.length; i++) {
    const a = allWords[i], next = allWords[i + 1];
    const end = next && next.t0 - a.t1 < 0.25 ? next.t0 : a.t1 + 0.12;
    if (T >= a.t0 - 0.03 && T < end) { w = a; break; }
  }
  if (!w) return;
  screen();
  const txt = w.w.replace(/\.\.\./g, "").replace(/[.,:]$/g, "");
  const pop = back((T - w.t0 + 0.03) / 0.12);
  const key = KEY.test(txt.normalize("NFD").replace(/[^A-Za-z0-9]/g, ""));
  g.save(); g.translate(W / 2, H * 0.7); g.rotate(key ? -0.03 : 0); g.scale(0.85 + 0.15 * pop, 0.85 + 0.15 * pop);
  g.font = "900 104px Montserrat"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
  g.lineWidth = 22; g.strokeStyle = "#111"; g.strokeText(txt.toUpperCase(), 0, 0);
  g.fillStyle = key ? "#ffd84a" : "#ffffff"; g.fillText(txt.toUpperCase(), 0, 0);
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
  const fl = [SEG(12), T_("land")].map((s) => clamp(1 - Math.abs(T - s) / 0.12, 0, 1)).reduce((a, b) => Math.max(a, b), 0);
  if (fl > 0) { g.fillStyle = `rgba(255,255,255,${fl})`; g.fillRect(0, 0, W, H); }
  const v = g.createRadialGradient(W / 2, H / 2, 600, W / 2, H / 2, 1250); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.26)");
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  captions(T);
  return true;
};
window.ready = true;
