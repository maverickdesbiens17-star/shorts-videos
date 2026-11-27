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
const push = (t, d, cx = 540, cy = 1000, z0 = 1.0, z1 = 1.07, T = 0) => cam(cx, cy, lerp(z0, z1, ss(t / d)), 0, T);
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
/** NEW label for this story: a round ink POSTMARK (double ring, place around the top, date in the middle, wavy cancel lines) */
function postmark(date, place, x, y, k, col = COBALT, r = 190, rot = -0.14) {
  if (k <= 0) return; g.save(); g.translate(x, y); g.rotate(rot + 0.02 * Math.sin(k * 9)); const s = k < 1 ? lerp(2.2, 1, easeOut(k)) : 1; g.scale(s, s); g.globalAlpha = clamp(k * 2.2, 0, 1);
  g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 12; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); g.lineWidth = 6; g.beginPath(); g.arc(0, 0, r - 26, 0, Math.PI * 2); g.stroke();
  for (let i = 0; i < 4; i++) { g.beginPath(); for (let xx = r + 30; xx < r + 420; xx += 10) g.lineTo(xx, -66 + i * 44 + 14 * Math.sin(xx / 26)); g.lineWidth = 9; g.stroke(); }
  g.textAlign = "center"; g.textBaseline = "middle"; const fs = Math.round(r * 0.2); g.font = `900 ${fs}px Montserrat`;
  const rr = r - 26 - fs * 0.75, chars = place.split(""), step = (fs * 0.78) / rr, span = Math.min(2.9, chars.length * step);
  chars.forEach((c, i) => { const a = -Math.PI / 2 - span / 2 + (i + 0.5) * (span / chars.length); g.save(); g.rotate(a + Math.PI / 2); g.fillText(c, 0, -rr); g.restore(); });
  let ds = r * 0.42; g.font = `900 ${ds}px Montserrat`; const mw = g.measureText(date).width, lim = 2 * (r - 30) * 0.92; if (mw > lim) { ds *= lim / mw; g.font = `900 ${ds}px Montserrat`; }
  g.fillText(date, 0, r * 0.14); g.fillRect(-r * 0.55, r * 0.42, r * 1.1, 6);
  g.restore();
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

// « The Fur-Trade Secret » — Isobel Gunn, the Orkney woman who worked for the Hudson's Bay Company as "John Fubbister", 1806-1809.
// Structure: COUNTDOWN OF CLUES (5 → 1, each clue lands on a birch-bark clue card, then the reveal). Palette: northern winter
// (snow white / spruce green / slate-steel sky / birch cream / wool red) lit by EMBER firelight. Caption accent: ember orange.
// New labels: clueCard() (birch-bark card + red wax number), ledger() (company account book with handwritten entries).
const SNOW = "#eef3f8", SPRUCE = "#1f4a3a", SLATE = "#6f8fb0", BIRCH = "#efe6d2", WOOL = "#b8323a", EMBER = "#ff9a3c", STEEL = "#3a4a5e", NAVY = "#24304a";
const TERRA = WOOL, SUNY = "#ffd36a", COBALT = "#2f4f7a", OLIVE = "#5a7a4a", CYAN = EMBER;

// ---------------- cast ----------------
const JOHN = { jacket: "#3f6a4a", pants: "#6a4a30", boots: "#5a3a24", hat: "tuque", cap: "#2f4f7a", cuff: "#24406a", knot: "#e9e2cf", skin: "#f3d2b8" };
const ISOBEL = { ...JOHN, hat: "hair", hair: "#9a4a26", longHair: "#9a4a26" };
const ISO_WASH = { ...ISOBEL, jacket: "#8a6a9a", dress: "#8a6a9a" };
const OLD = { jacket: "#5a4a6a", dress: "#5a4a6a", pants: "#2a2026", boots: "#2a2026", hat: "hair", hair: "#d8d4cc", longHair: "#d8d4cc", skin: "#f0d0b8" };
const HENRY = { jacket: "#2a3a6a", pants: "#d8ccb0", boots: "#2a1c16", hat: "tophat", skin: "#f3d2b0", moustache: "#6a4a30", tie: "#f2efe6" };
const HENEY = { jacket: "#8a3a2a", pants: "#4a3a2a", boots: "#3a2a1e", hat: "tuque", cap: WOOL, knot: "#f2eadc", beard: "#7a5a3a", skin: "#eec6a0", build: "stout" };
const CLERK = { jacket: "#1e1c24", pants: "#1e1c24", boots: "#1a1416", hat: "tophat", skin: "#f6dcc4", tie: "#f2efe6", moustache: "#3a2a20" };
const MAN = (v) => ({ jacket: ["#7a4a3a", "#4a5a7a", "#6a6a3a", "#5a3a5a"][v % 4], pants: "#4a3a2a", boots: "#3a2a1e", hat: "tuque",
  cap: [WOOL, "#3a6a8a", "#6a4a8a", "#c8913a"][v % 4], knot: "#f2eadc", beard: ["#6a4a30", "#c8a070", "#3a2a20", "#8a5a3a"][v % 4], skin: ["#f0cfa8", "#e6c09a", "#f3d2b8", "#eec6a0"][v % 4] });
const PAD = (o) => ({ skin: o.skin, cap: o.cap, jacket: o.jacket, beard: o.beard });

// ---------------- story helpers ----------------
/** NEW label: birch-bark CLUE card with a red wax-seal number; k = appear 0..1 */
function clueCard(n, x, y, k, T, s = 1) {
  if (k <= 0) return; g.save(); g.translate(x, y); g.rotate(-0.06 + 0.04 * Math.sin(T * 2)); const sc = s * (k < 1 ? lerp(0.2, 1, back(k)) : 1); g.scale(sc, sc);
  g.beginPath(); const w = 560, h = 720; g.moveTo(-w / 2, -h / 2); for (let i = 0; i <= 14; i++) g.lineTo(-w / 2 + (i / 14) * w, -h / 2 + (i % 2 ? 10 : -6));
  for (let i = 0; i <= 14; i++) g.lineTo(w / 2 + (i % 2 ? 8 : -6), -h / 2 + (i / 14) * h); for (let i = 14; i >= 0; i--) g.lineTo(-w / 2 + (i / 14) * w, h / 2 + (i % 2 ? -8 : 8));
  g.closePath(); g.fillStyle = BIRCH; g.fill(); g.lineWidth = 10; g.strokeStyle = P.INK; g.stroke();
  for (let i = 0; i < 9; i++) { g.beginPath(); const yy = -300 + i * 70 + rnd(i, 2) * 20, xx = -220 + rnd(i, 3) * 300; g.moveTo(xx, yy); g.lineTo(xx + 60 + rnd(i, 4) * 80, yy); g.lineWidth = 6; g.strokeStyle = "#3a2e2a"; g.stroke(); }
  g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 110px Montserrat"; g.fillStyle = P.INK; g.fillText("CLUE", 0, -220);
  g.beginPath(); for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2, r = 190 + (i % 2) * 14; g.lineTo(Math.cos(a) * r, 70 + Math.sin(a) * r); } g.closePath(); g.fillStyle = WOOL; g.fill(); g.lineWidth = 8; g.stroke();
  g.beginPath(); g.arc(0, 70, 150, 0, Math.PI * 2); g.lineWidth = 6; g.strokeStyle = "#7a1a22"; g.stroke();
  g.font = "900 260px Montserrat"; g.fillStyle = "#fff3e0"; g.fillText(String(n), 0, 82); g.restore();
}
/** full-screen clue intro shot: card slams in over a dark spruce forest, snow, magnifier sweeps */
function clueShot(n, t, d, T, bg = NAVY) {
  SKY(bg, STEEL, 1500); push(t, d, 540, 960, 1.0, 1.06, T);
  for (let i = 0; i < 7; i++) P.spruce(g, -80 + i * 200, 1650 + (i % 2) * 60, 520 + (i % 3) * 80, "#163a2e");
  P.snowGround(g, 1700, "#dfe7f0");
  screen(); P.snowfall(g, T, 0.8, 80);
  clueCard(n, 540, 900, t / 0.3, T, 1.0);
  const mx = 540 + 220 * Math.sin(T * 2.2), my = 960 + 120 * Math.cos(T * 1.7);
  g.save(); g.translate(mx, my); g.rotate(0.6); g.beginPath(); g.arc(0, 0, 110, 0, Math.PI * 2); g.fillStyle = "rgba(200,230,255,0.25)"; g.fill(); g.lineWidth = 20; g.strokeStyle = P.INK; g.stroke(); g.lineWidth = 12; g.strokeStyle = "#c8a070"; g.stroke();
  g.beginPath(); g.roundRect(-20, 120, 40, 200, 14); g.fillStyle = "#6a4426"; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke(); g.restore();
}
/** NEW label: page of the company account book; lines = [[text, k]] (k = writing progress 0..1) */
function ledger(lines, x, y, k, rot = -0.05, w = 820, cross = 0) {
  if (k <= 0) return; g.save(); g.translate(x, y); g.rotate(rot); const s = k < 1 ? lerp(0.6, 1, back(k)) : 1; g.scale(s, s);
  const h = 140 + lines.length * 110; g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.fillStyle = "#f6efd9"; g.fill(); g.lineWidth = 10; g.strokeStyle = P.INK; g.stroke();
  for (let i = 0; i < lines.length + 1; i++) { g.beginPath(); g.moveTo(-w / 2 + 20, -h / 2 + 100 + i * 110); g.lineTo(w / 2 - 20, -h / 2 + 100 + i * 110); g.lineWidth = 3; g.strokeStyle = "#8fb0d0"; g.stroke(); }
  g.beginPath(); g.moveTo(-w / 2 + 90, -h / 2); g.lineTo(-w / 2 + 90, h / 2); g.lineWidth = 4; g.strokeStyle = "#d86a6a"; g.stroke();
  g.font = "italic 700 30px 'Noto Serif CJK SC', serif"; g.fillStyle = "#7a6a5a"; g.textAlign = "left"; g.textBaseline = "alphabetic"; g.fillText("Hudson's Bay Co. — servants engaged", -w / 2 + 110, -h / 2 + 60);
  lines.forEach(([txt, kk, col], i) => { if (kk <= 0) return; const n = Math.round(txt.length * clamp(kk, 0, 1));
    g.font = "italic 700 64px 'Noto Serif CJK SC', serif"; g.fillStyle = col ?? "#1e2a4a"; g.fillText(txt.slice(0, n), -w / 2 + 110, -h / 2 + 180 + i * 110); });
  if (cross > 0) bigX(0, -h / 2 + 160, 90, cross);
  g.restore();
}
function coin(x, y, r, T, i = 0) {
  g.save(); g.translate(x, y); g.scale(Math.abs(Math.cos(T * 5 + i)) * 0.7 + 0.3, 1); g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fillStyle = "#f2c84a"; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke();
  g.beginPath(); g.arc(0, 0, r * 0.7, 0, Math.PI * 2); g.lineWidth = 3; g.strokeStyle = "#b88a2a"; g.stroke(); g.restore();
}
function table(y, x0 = -400, x1 = 1500) { g.beginPath(); g.rect(x0, y, x1 - x0, 60); g.fillStyle = "#7a4e2c"; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke(); g.fillStyle = "#5a3a24"; g.fillRect(x0, y + 60, x1 - x0, 1200); }
function cabin(T, warm = 1) { // log-cabin interior lit by the fire
  screen(); g.fillStyle = "#2a1c16"; g.fillRect(0, 0, W, H);
  P.logWall(g, -600, -200, 1700, 1500, "#7a5232"); g.fillStyle = "#4a3020"; g.fillRect(-600, 1500, 2300, 1500);
  for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(-600, 1500 + i * 60); g.lineTo(1700, 1500 + i * 60); g.lineWidth = 4; g.strokeStyle = "#3a2418"; g.stroke(); }
  if (warm) { g.fillStyle = `rgba(255,140,50,${0.12 * warm * (1 + 0.15 * Math.sin(T * 9))})`; g.fillRect(-600, -200, 2300, 3000); }
}
function river(T, y0 = 1250, col = "#4a7a9a") { g.fillStyle = col; g.fillRect(-1200, y0, 3600, 2000); g.strokeStyle = "rgba(255,255,255,0.4)"; g.lineWidth = 6;
  for (let i = 0; i < 22; i++) { const x = ((rnd(i, 1) * 1800 + T * 260) % 1800) - 400, y = y0 + 30 + rnd(i, 2) * 600; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 50, y - 12, x - 100, y); g.stroke(); } }
function forest(T, horizon, speed = 0, col = SPRUCE, snow = true) {
  for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) { const x = (((i * 190 + r * 90 - T * speed * (r + 1)) % 1710) + 1710) % 1710 - 300; P.spruce(g, x, horizon + r * 40, 380 + r * 120 + (i % 3) * 40, r ? col : P.shadeHex(col, 1.25), snow); }
}
// stylised map frame shared by the route shots
const MP = { x: 40, y: 380, w: 1000, h: 1050 };
const MPT = { orkney: [0.9, 0.28], strait: [0.3, 0.2], moose: [0.19, 0.5], albany: [0.16, 0.47], pembina: [0.06, 0.66] };
const mp = ([u, v]) => [MP.x + u * MP.w, MP.y + v * MP.h];
function mapBase(T, t, d, z0 = 1.0, z1 = 1.08, cx = 540, cy = 900) {
  screen(); g.fillStyle = "#5f8fb4"; g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(255,255,255,0.14)"; g.lineWidth = 3; for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(0, 150 * i); g.lineTo(W, 150 * i); g.stroke(); g.beginPath(); g.moveTo(i * 120, 0); g.lineTo(i * 120, H); g.stroke(); }
  cam(cx, cy, lerp(z0, z1, ss(t / d)), 0, T); P.atlantic(g, MP.x, MP.y, MP.w, MP.h, T, "#e8dfc0");
}
function dashRoute(pts, k, col = WOOL, w = 14) {
  const P2 = pts.map(mp), n = P2.length - 1, kk = clamp(k, 0, 1) * n, last = Math.floor(kk);
  g.save(); g.setLineDash([26, 16]); g.lineCap = "round"; g.beginPath(); g.moveTo(...P2[0]); for (let i = 1; i <= last; i++) g.lineTo(...P2[i]); let end = P2[last];
  if (last < n) { const f = kk - last; end = [lerp(P2[last][0], P2[last + 1][0], f), lerp(P2[last][1], P2[last + 1][1], f)]; g.lineTo(...end); }
  g.lineWidth = w + 8; g.strokeStyle = "#fff8e8"; g.stroke(); g.lineWidth = w; g.strokeStyle = col; g.stroke(); g.restore(); return end;
}
function badge(n) { // small "CLUE n / 5" pill at the top centre during each clue's scenes
  screen(); g.save(); g.translate(540, 108); g.beginPath(); g.roundRect(-150, -44, 300, 88, 44); g.fillStyle = WOOL; g.fill(); g.lineWidth = 7; g.strokeStyle = "#111"; g.stroke();
  g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff3e0"; g.font = "900 50px Montserrat"; g.fillText("CLUE #" + n, 0, 4); g.restore();
}

// ---------------- backdrops ----------------
const SKY = (top, bot, horizon = 1250) => { const gr = g.createLinearGradient(0, -300, 0, horizon); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(-1200, -1200, 3600, 4400); };
const WINTER = (h = 1250) => SKY("#5f7fa4", "#dfe8f0", h);
const GREY = (h = 1250) => SKY("#7a8a9a", "#c8d0d8", h);
const NIGHT = (h = 1250) => SKY("#141c30", "#3a4a66", h);
function sun(x, y, r, col = "#ffe08a") { const gr = g.createRadialGradient(x, y, r * 0.5, x, y, r * 2.6); gr.addColorStop(0, "rgba(255,230,150,0.6)"); gr.addColorStop(1, "rgba(255,230,150,0)"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 2.6, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = col; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke(); }
function sea(T, y0, cols = ["#5a7a94", "#4a6a84", "#3a5a74", "#2e4a62"], amp = 1) { P.ocean(g, y0, T, cols, -1500, 2600, amp); }

// ---------------- shots: [start (s), fn(t in shot, shot length, global T)] ----------------
const SHOTS = [
  [0, (t, d, T) => { // "Five clues..." — opening (new): five clue cards fan out over a snowy night forest
    NIGHT(1500); push(t, d, 540, 960, 1.0, 1.06, T); P.stars(g, T, 90, 900, 4);
    forest(T, 1500, 0, "#163a2e"); P.snowGround(g, 1560, "#cfdbe8");
    screen(); P.snowfall(g, T, 0.7, 50);
    for (let i = 4; i >= 0; i--) { const k = clamp((t - 0.1 - (4 - i) * 0.12) / 0.35, 0, 1), a = (2 - i) * 0.24 * ss(k);
      g.save(); g.translate(540, 1250); g.rotate(a); clueCard(5 - i, 0, -420, k, T + i, 0.55); g.restore(); }
    tag("5 CLUES", 540, 230, EMBER, back((t - 0.05) / 0.25) * 1.3, 110);
  }],
  [T_("fur"), (t, d, T) => { // "one fur trader was hiding a huge secret" — close-up, eyes darting, SECRET stamp
    WINTER(1300); push(t, d, 540, 900, 1.05, 1.15, T); forest(T, 1300, 0); P.snowGround(g, 1340);
    face(540, 900, 1.6, JOHN, { expr: "nervous", look: Math.sin(T * 5) > 0 ? 1 : -1 }, 1, T, 5);
    sweat(760, 720, 1.4, T);
    screen(); tag("FUR TRADER", 540, 260, "#fff", back((t - 0.05) / 0.25) * 1.2, 90);
    stamp("SECRET", 540, 1180, (T - T_("secret") + 0.05) / 0.2, WOOL, -0.12, 120);
    P.snowfall(g, T, 0.4, 40);
  }],
  [SEG(1), (t, d, T) => clueShot(5, t, d, T)],
  [T_("orkney"), (t, d, T) => { // "Orkney, June 1806" — standing stones, crofts by the sea
    GREY(1100); push(t, d, 540, 1000, 1.0, 1.08, T); P.cloud(g, 120 + T * 14, 420, 1.3, "#e8ecf0"); P.cloud(g, 700 - T * 10, 300, 1.0, "#e8ecf0");
    sea(T, 1060); P.hills(g, -800, 2000, 1180, 40, "#7a9a5a", 3); P.ground(g, -3000, 4000, 1220, "#6a8a4a");
    P.standingStones(g, 420, 1250, 1.0); P.croft(g, 860, 1300, 0.7, false);
    for (let i = 0; i < 3; i++) P.tern(g, 200 + i * 160 + 40 * Math.sin(T + i), 520 + 30 * Math.sin(T * 2 + i), 0.6, T + i);
    ch(640, 1780, 0.95, JOHN, { expr: "neutral", look: -1 }, 1, T, 5);
    screen(); tag("ORKNEY, SCOTLAND", 540, 250, "#fff", back(t / 0.25) * 1.0, 84);
    stamp("JUNE 1806", 540, 420, (T - T_("june") + 0.05) / 0.2, WOOL, -0.1, 100);
  }],
  [SEG(2), (t, d, T) => { // "A young recruit called John Fubbister signs up" — the clerk's ledger
    cabin(T, 0.4); push(t, d, 540, 1100, 1.0, 1.06, T);
    ch(300, 1700, 0.95, CLERK, { expr: "deadpan", look: 1 }, 1, T, 21);
    ch(800, 1700, 0.95, JOHN, { expr: talk(T, "talk", "smile"), look: -1 }, -1, T, 5);
    table(1380);
    ledger([["John Fubbister", clamp((T - T_("john")) / 1.0, 0, 1)], ["labourer", clamp((T - T_("signs")) / 0.6, 0, 1)]], 540, 1640, back((t - 0.05) / 0.25), -0.03, 760);
    screen(); tag("JOHN FUBBISTER", 540, 260, EMBER, back((T - T_("john")) / 0.25) * 1.0, 90);
  }],
  [T_("three"), (t, d, T) => { // "for three years, at eight pounds a year"
    cabin(T, 0.4); push(t, d, 540, 1000, 1.0, 1.14, T); table(1300); g.beginPath(); g.rect(860, 1150, 50, 150); g.fillStyle = "#f2eadc"; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke(); P.flame(g, 885, 1150, 90, T);
    ledger([["3 years, £8 a year", clamp((T - T_("three")) / 1.2, 0, 1)]], 540, 1620, 1, 0.04, 760);
    for (let i = 0; i < 8; i++) { const k = clamp((T - T_("eight") - i * 0.12) / 0.3, 0, 1); if (k > 0) coin(330 + i * 60, lerp(700, 1270 - i * 4, easeOut(k)), 46, T, i); }
    bigNum("3 YEARS", BIRCH, null, back(t / 0.25), 420);
    bigNum("£8 A YEAR", SUNY, null, back((T - T_("eight")) / 0.25), 760);
  }],
  [SEG(3), (t, d, T) => { // "A ship carries him to Canada" — the ship ploughs west through grey Atlantic swells
    GREY(1200); push(t, d, 540, 1000, 1.0, 1.05, T); P.cloud(g, 200 - T * 20, 380, 1.2, "#e8ecf0");
    P.tallShip(g, 560, 1260, 1.0, T, { dir: -1, flag: WOOL, stripe: "#d8b04a" });
    sea(T, 1250, ["#5a7a94", "#4a6a84", "#3a5a74", "#2e4a62"], 1.4);
    screen(); tag("1806", 540, 260, "#fff", back(t / 0.25), 100);
  }],
  [T_("canada"), (t, d, T) => { // "to Canada" — route Orkney → Hudson Bay
    mapBase(T, t, d);
    const e = dashRoute([MPT.orkney, [0.6, 0.12], MPT.strait, [0.24, 0.3], MPT.moose], easeOut(clamp(t / (d * 0.85), 0, 1)));
    P.tallShip(g, e[0], e[1] + 10, 0.11, T, { dir: -1 });
    pin(...mp(MPT.orkney), 0.9, WOOL); tag("ORKNEY", ...[mp(MPT.orkney)[0] - 40, mp(MPT.orkney)[1] - 140], "#fff", 1, 46);
    screen(); tag("CANADA", 540, 250, EMBER, back((t - 0.05) / 0.25) * 1.3, 110);
  }],
  [T_("forts"), (t, d, T) => { // "the fur forts of the Hudson's Bay Company" — palisade fort, pelts drying
    WINTER(1300); push(t, d, 540, 1050, 1.0, 1.07, T); P.cloud(g, 160 + T * 10, 430, 1.1);
    forest(T, 1260, 0); P.snowGround(g, 1300);
    P.fort(g, 540, 1420, 0.95, T, { flag: WOOL });
    for (let i = 0; i < 3; i++) P.pelt(g, 170 + i * 120, 1500 + (i % 2) * 20, 0.55);
    screen(); P.snowfall(g, T, 0.35, 30);
    tag("HUDSON'S BAY COMPANY", 540, 260, "#fff", back((T - T_("hudsons")) / 0.25) * 0.95, 70);
    tag("FUR FORTS", 540, 380, EMBER, back((t - 0.05) / 0.25) * 1.0, 90);
  }],
  [SEG(4), (t, d, T) => clueShot(4, t, d, T)],
  [T_("hauls"), (t, d, T) => { // "he hauls freight" — carrying a heavy fur bale through the snow
    WINTER(1300); push(t, d, 540, 1050, 1.0, 1.07, T); forest(T, 1250, 40); P.snowGround(g, 1300);
    ch(540, 1780, 1.0, JOHN, { expr: "pained", mode: "march", phase: T * 0.9, pose: "hold", held: (gg, x, y, u) => { gg.save(); gg.translate(x, y - 30 * u); gg.scale(u / 1.3, u / 1.3); P.bale(gg, 0, -40, 1.0, 1); gg.restore(); } }, 1, T, 5);
    sweat(700, 1020, 1.2, T);
    screen(); P.snowfall(g, T, 0.4, 60); tag("HAULS FREIGHT", 540, 260, "#fff", back((t - 0.05) / 0.25) * 1.1, 96);
  }],
  [T_("chops"), (t, d, T) => { // "and chops wood" — axe swing, chips fly
    WINTER(1300); push(t, d, 540, 1050, 1.0, 1.06, T); forest(T, 1250, 0); P.snowGround(g, 1300);
    const sw = (T * 2.2) % 1, k = sw < 0.7 ? 0 : (sw - 0.7) / 0.3;
    ch(470, 1760, 1.0, JOHN, { expr: k > 0.5 ? "shout" : "stern", prop: ["axe", k] }, 1, T, 5);
    g.beginPath(); g.ellipse(770, 1720, 120, 34, 0, 0, Math.PI * 2); g.fillStyle = "#a8743c"; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke();
    g.beginPath(); g.rect(650, 1720, 240, 60); g.fillStyle = "#7a4e2c"; g.fill(); g.stroke();
    if (sw > 0.95 || sw < 0.25) { const c = sw > 0.95 ? 0 : sw / 0.25; for (let i = 0; i < 6; i++) { g.save(); g.translate(770 + (i - 2.5) * 50 * c * 3, 1680 - 200 * c + 300 * c * c); g.rotate(i + c * 5); g.fillStyle = "#d8b07a"; g.fillRect(-14, -8, 28, 16); g.restore(); } shakeAmt = 10 * (1 - c); }
    screen(); tag("CHOPS WOOD", 540, 260, EMBER, back((t - 0.05) / 0.25) * 1.1, 100);
  }],
  [T_("like"), (t, d, T) => { // "like the rest of the men" — a row of workers, all doing the same
    WINTER(1300); push(t, d, 540, 1050, 1.02, 1.08, T); forest(T, 1240, 0); P.snowGround(g, 1290);
    const xs = [150, 360, 580, 800, 1000];
    xs.forEach((x, i) => { const o = i === 2 ? JOHN : MAN(i); ch(x, 1600, 0.72, o, { expr: i === 2 ? "smile" : talk(T, "grin", "smile", i), mode: "march", phase: T * 0.8 + i * 0.2 }, 1, T, 30 + i); });
    g.beginPath(); g.arc(580, 1118, 110 + 8 * Math.sin(T * 6), 0, Math.PI * 2); g.lineWidth = 10; g.strokeStyle = EMBER; g.stroke();
    screen(); tag("LIKE THE REST", 540, 260, "#fff", back((T - T_("rest")) / 0.25) * 1.1, 100);
  }],
  [SEG(5), (t, d, T) => clueShot(3, t, d, T)],
  [T_("paddles"), (t, d, T) => { // "he paddles almost three thousand kilometres by canoe" — canoe through the forest, km counter
    WINTER(1150); push(t, d, 540, 1000, 1.0, 1.05, T); P.hills(g, -800, 2000, 860, 60, "#5a7a8a", 5);
    forest(T, 960, 70, "#244a3a", false); river(T, 990);
    P.furCanoe(g, 540, 1190, 1.05, T, { paddlers: [PAD(MAN(0)), PAD(JOHN), PAD(MAN(1)), PAD(MAN(3))], bales: 2, speed: 5 });
    bigNum(Math.round(lerp(0, 2900, easeOut(clamp((T - T_("thousand") + 0.3) / 1.6, 0, 1))) / 10) * 10, SUNY, "KILOMETRES", back((T - T_("almost")) / 0.25), 300);
    screen(); tag("BY CANOE", 540, 1620, "#fff", back((T - T_("canoe")) / 0.25) * 1.1, 90);
  }],
  [T_("keeps"), (t, d, T) => { // "and keeps up" — close-up: John paddles hard and grins
    WINTER(1250); push(t, d, 540, 950, 1.05, 1.12, T); forest(T, 1150, 160, "#244a3a", false); river(T, 1200);
    face(540, 880, 1.5, JOHN, { expr: "grin", look: 1, tilt: 0.04 * Math.sin(T * 6), pose: "hold", held: (gg, x, y, u) => { gg.save(); gg.translate(x, y); gg.rotate(0.9 + 0.35 * Math.sin(T * 6)); gg.fillStyle = "#a8743c"; gg.strokeStyle = P.INK; gg.lineWidth = 2 * u; gg.beginPath(); gg.rect(-3 * u, -70 * u, 6 * u, 120 * u); gg.fill(); gg.stroke(); gg.beginPath(); gg.ellipse(0, 72 * u, 12 * u, 30 * u, 0, 0, Math.PI * 2); gg.fillStyle = "#c08a4a"; gg.fill(); gg.stroke(); gg.restore(); } }, 1, T, 5);
    speedLines(T, 10, "rgba(255,255,255,0.55)", -1);
    screen(); tag("KEEPS UP!", 540, 260, EMBER, back((t - 0.05) / 0.25) * 1.3, 110);
  }],
  [SEG(6), (t, d, T) => clueShot(2, t, d, T)],
  [T_("winter"), (t, d, T) => { // "winter, 1807" — a blizzard, men on snowshoes in single file
    SKY("#8a9aaa", "#e8eef4", 1300); push(t, d, 540, 1050, 1.0, 1.06, T); forest(T, 1240, 30, "#2a4a40"); P.snowGround(g, 1290, "#f4f8fc");
    for (let i = 0; i < 4; i++) { const o = i === 1 ? JOHN : MAN(i), x = 220 + i * 210 + ((T * 30) % 210);
      ch(x, 1520 + i * 10, 0.62, o, { expr: "stern", mode: "march", phase: T * 0.7 + i * 0.25 }, 1, T, 40 + i);
      g.beginPath(); g.ellipse(x - 20, 1525 + i * 10, 70, 14, 0, 0, Math.PI * 2); g.lineWidth = 6; g.strokeStyle = "#8a5a34"; g.stroke(); }
    screen(); P.snowfall(g, T, 1.6, 420, W, H, 5); shakeAmt = 2;
    stamp("WINTER 1807", 540, 300, (t - 0.05) / 0.2, NAVY, -0.08, 104);
  }],
  [T_("south"), (t, d, T) => { // "a trip south to Pembina, on the Red River" — map: south from the bay
    mapBase(T, t, d, 1.35, 1.5, 300, 960);
    g.save(); g.lineCap = "round"; g.beginPath(); g.moveTo(...mp([0.05, 0.5])); g.quadraticCurveTo(...mp([0.09, 0.6]), ...mp([0.07, 0.74])); g.lineWidth = 14; g.strokeStyle = "#5f8fb4"; g.stroke();
    g.lineWidth = 7; g.strokeStyle = "#d8323a"; g.globalAlpha = clamp((T - T_("red")) / 0.3, 0, 1); g.stroke(); g.restore();
    const e = dashRoute([MPT.moose, MPT.albany, [0.1, 0.56], MPT.pembina], easeOut(clamp(t / (d * 0.6), 0, 1)), NAVY, 12);
    g.beginPath(); g.arc(e[0], e[1], 16, 0, Math.PI * 2); g.fillStyle = EMBER; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke();
    pin(...mp(MPT.pembina), back((T - T_("pembina")) / 0.25) * 0.8, WOOL);
    tag("PEMBINA", mp(MPT.pembina)[0] + 70, mp(MPT.pembina)[1] - 140, "#fff", back((T - T_("pembina")) / 0.25) * 0.9, 54);
    tag("RED RIVER", mp([0.1, 0.76])[0] + 40, mp([0.1, 0.76])[1] + 50, "#ff6a6a", back((T - T_("red")) / 0.25) * 0.8, 50);
    screen(); tag("SOUTH", 540, 260, "#fff", back((t - 0.05) / 0.25) * 1.2, 110);
  }],
  [SEG(7), (t, d, T) => clueShot(1, t, d, T, "#2a1418")],
  [T_("december"), (t, d, T) => { // "December twenty-ninth" — calendar page flips to 29
    cabin(T, 0.6); push(t, d, 540, 960, 1.0, 1.06, T);
    const k = clamp((T - T_("twentyninth")) / 0.35, 0, 1);
    g.save(); g.translate(540, 900); g.beginPath(); g.roundRect(-300, -380, 600, 760, 26); g.fillStyle = "#f6efd9"; g.fill(); g.lineWidth = 10; g.strokeStyle = P.INK; g.stroke();
    g.beginPath(); g.roundRect(-300, -380, 600, 200, [26, 26, 0, 0]); g.fillStyle = WOOL; g.fill(); g.stroke();
    g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 96px Montserrat"; g.fillText("DECEMBER", 0, -280);
    g.fillStyle = P.INK; g.font = "900 330px Montserrat"; g.fillText(k < 0.5 ? "28" : "29", 0, 60);
    g.font = "900 70px Montserrat"; g.fillText("1807", 0, 290);
    if (k > 0 && k < 1) { g.save(); g.scale(1, Math.abs(1 - 2 * k)); g.beginPath(); g.rect(-300, -180, 600, 560); g.fillStyle = "#efe4c8"; g.fill(); g.lineWidth = 6; g.stroke(); g.restore(); }
    g.restore();
  }],
  [T_("rival"), (t, d, T) => { // "At a rival post" — the other company's fort at dusk, trader at the gate
    SKY("#2a3050", "#c87a5a", 1300); push(t, d, 540, 1050, 1.0, 1.07, T);
    forest(T, 1240, 0, "#1a3a30"); P.snowGround(g, 1290, "#d8d8e8");
    P.fort(g, 560, 1420, 0.9, T, { flag: "#2a6a3a", gateOpen: 0.7, inside: true });
    ch(850, 1860, 0.95, HENRY, { expr: "smile", wave: Math.sin(T * 6) }, -1, T, 50);
    screen(); P.snowfall(g, T, 0.5, 40); tag("RIVAL POST", 540, 260, EMBER, back((t - 0.05) / 0.25) * 1.1, 100);
  }],
  [T_("asks"), (t, d, T) => { // "John asks to rest by the fire"
    cabin(T, 1); push(t, d, 540, 1100, 1.0, 1.07, T); P.hearth(g, 540, 1500, 1.0, T);
    ch(260, 1820, 0.9, HENRY, { expr: "neutral", look: 1 }, 1, T, 50);
    ch(800, 1820, 0.9, JOHN, { expr: talk(T, "talk", "nervous"), look: -1, pose: "cheek" }, -1, T, 5);
    sweat(880, 1060, 1.0, T);
    screen(); tag("BY THE FIRE", 540, 260, EMBER, back((T - T_("fire")) / 0.25) * 1.1, 100);
  }],
  [SEG(8), (t, d, T) => { // "The trader finds him on the hearth, crying out in pain."
    cabin(T, 1.2); push(t, d, 540, 1050, 1.0, 1.1, T); P.hearth(g, 700, 1500, 0.9, T);
    face(300, 860, 1.1, HENRY, { expr: "shock", look: 1 }, 1, T, 50);
    g.save(); g.translate(680, 1300); g.rotate(-0.3); face(0, 0, 1.15, JOHN, { expr: T > T_("crying") ? talk(T, "shout2", "pained") : "pained", look: -1 }, -1, T, 5); g.restore();
    sweat(820, 1020, 1.3, T); sweat(560, 1060, 1.1, T + 0.4);
    if (T > T_("crying")) shakeAmt = 8;
    screen(); tag("IN PAIN!", 540, 260, "#fff", back((T - T_("pain")) / 0.2) * 1.3, 110);
  }],
  [SEG(9), (t, d, T) => { // "Then John opens his jacket." — drum roll, jacket flaps part on a burst of light
    cabin(T, 1.4); push(t, d, 540, 1000, 1.0, 1.18, T);
    face(540, 640, 2.3, JOHN, { expr: "nervous", look: 0, pose: "hold" }, 1, T, 5);
    const k = clamp((T - T_("jacket") + 0.1) / 0.5, 0, 1);
    screen(); if (k > 0) { g.fillStyle = `rgba(255,246,220,${k})`; g.fillRect(540 - 540 * k, 0, 1080 * k, H); }
    for (const sd of [-1, 1]) { const x = 540 + sd * 540 * k; g.beginPath(); g.rect(sd < 0 ? x - 1100 : x, 0, 1100, H); g.fillStyle = JOHN.jacket; g.globalAlpha = k > 0 ? 1 : 0; g.fill(); g.globalAlpha = 1; }
    qmark(870, 330, 0.9, T, EMBER);
  }],
  [SEG(10), (t, d, T) => { // "John is a woman, Isobel Gunn." — the tuque flies off, long hair falls
    screen(); g.fillStyle = "#fff6dc"; g.fillRect(0, 0, W, H); push(t, d, 540, 1000, 1.0, 1.06, T);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + T * 0.3; g.beginPath(); g.moveTo(540, 900); g.arc(540, 900, 1800, a, a + 0.12); g.closePath(); g.fillStyle = "rgba(255,154,60,0.16)"; g.fill(); }
    const rev = T >= T_("woman") - 0.1;
    face(540, 900, 1.6, rev ? ISOBEL : JOHN, { expr: rev ? "smile_closed" : "neutral" }, 1, T, 5);
    if (rev) { const k = clamp((T - T_("woman") + 0.1) / 0.6, 0, 1); g.save(); g.translate(540 + 300 * k, 560 - 500 * k + 700 * k * k); g.rotate(k * 6); g.beginPath(); g.ellipse(0, 0, 120, 70, 0, Math.PI, 0); g.fillStyle = JOHN.cap; g.fill(); g.lineWidth = 8; g.strokeStyle = P.INK; g.stroke(); g.restore();
      sparkle(540, 700, 300, T); }
    screen(); tag("A WOMAN!", 540, 250, WOOL, back((T - T_("woman")) / 0.2) * 1.4, 120);
    ledger([["John Fubbister", 1], ["Isobel Gunn", clamp((T - T_("isobel")) / 0.6, 0, 1), WOOL]], 540, 1600, back((T - T_("isobel") + 0.1) / 0.25), -0.04, 760, clamp((T - T_("isobel")) / 0.4, 0, 1));
  }],
  [T_("within"), (t, d, T) => { // "And within an hour" — clock sweeps one hour
    cabin(T, 0.8); push(t, d, 540, 960, 1.0, 1.06, T); P.clockFace(g, 540, 880, 330, ss(clamp(t / (d * 0.9), 0, 1)));
    screen(); bigNum("1 HOUR", EMBER, null, back((T - T_("hour")) / 0.25), 1420);
  }],
  [T_("she"), (t, d, T) => { // "she gives birth to a baby boy" — Isobel by the fire, baby in her arms
    cabin(T, 1.2); push(t, d, 540, 1100, 1.0, 1.06, T); P.hearth(g, 250, 1500, 0.7, T, 180);
    ch(620, 1820, 1.0, ISOBEL, { expr: "smile_closed", pose: "hold", held: (gg, x, y, u) => P.babyBundle(gg, x, y - 6 * u, u * 0.95, T) }, -1, T, 5);
    sparkle(620, 1050, 180, T, "#fff6c2");
    screen(); tag("BABY BOY", 540, 260, "#fff", back((T - T_("baby")) / 0.25) * 1.3, 110);
  }],
  [SEG(11), (t, d, T) => { // "Women were banned from the posts." — fort gate, NO WOMEN sign crossed
    WINTER(1300); push(t, d, 540, 1050, 1.0, 1.07, T); forest(T, 1240, 0); P.snowGround(g, 1290);
    P.fort(g, 540, 1420, 0.9, T, { flag: WOOL, sign: "MEN ONLY" });
    ch(820, 1780, 0.85, ISOBEL, { expr: "stern", look: -1 }, -1, T, 5);
    ch(300, 1780, 0.85, MAN(2), { expr: "stern", pose: "point", pointUp: 0.1, look: 1 }, 1, T, 33);
    screen(); tag("WOMEN BANNED", 540, 260, "#fff", back((T - T_("banned")) / 0.25) * 1.0, 100);
    bigX(540, 560, 130, clamp((T - T_("banned")) / 0.3, 0, 1));
  }],
  [T_("so", 0), (t, d, T) => { // "So the company made her a washerwoman"
    WINTER(1300); push(t, d, 540, 1050, 1.0, 1.07, T); P.fort(g, 540, 1300, 0.6, T, { flag: WOOL }); P.snowGround(g, 1300);
    g.beginPath(); g.moveTo(-50, 1060); g.quadraticCurveTo(540, 1130, 1130, 1060); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke();
    for (let i = 0; i < 6; i++) { const x = 80 + i * 180, y = 1080 + 20 * Math.sin((i / 5) * Math.PI); g.save(); g.translate(x, y); g.rotate(0.08 * Math.sin(T * 2 + i)); g.beginPath(); g.rect(-50, 0, 100, 120); g.fillStyle = ["#f2efe6", WOOL, "#8fb0d0", "#f2efe6", "#c8a070", "#f2efe6"][i]; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke(); g.restore(); }
    ch(540, 1800, 1.0, ISO_WASH, { expr: "deadpan", pose: "hold", held: (gg, x, y, u) => { gg.beginPath(); gg.roundRect(x - 20 * u, y - 8 * u + 6 * u * Math.sin(T * 9), 40 * u, 16 * u, 4 * u); gg.fillStyle = "#f2efe6"; gg.fill(); gg.lineWidth = 2 * u; gg.strokeStyle = P.INK; gg.stroke(); } }, 1, T, 5);
    P.washtub(g, 540, 1830, 0.95, T);
    screen(); tag("WASHERWOMAN", 540, 260, EMBER, back((T - T_("washerwoman")) / 0.25) * 1.1, 100);
  }],
  [SEG(12), (t, d, T) => { // "and in 1809, it shipped her home." — the ship sails east, map back to Orkney
    GREY(1200); push(t, d, 540, 1000, 1.0, 1.05, T);
    P.tallShip(g, lerp(380, 700, t / d), 1260, 0.9, T, { dir: 1 });
    sea(T, 1250, ["#5a7a94", "#4a6a84", "#3a5a74", "#2e4a62"], 1.2);
    stamp("1809", 540, 330, (T - T_("eighteenohnine") + 0.05) / 0.2, WOOL, -0.1, 130);
    screen(); tag("SHIPPED HOME", 540, 560, "#fff", back((T - T_("shipped")) / 0.25) * 1.1, 96);
  }],
  [SEG(13), (t, d, T) => { // "Her boss admitted she worked at anything" — the boss, grudging nod; jobs ticked
    WINTER(1300); push(t, d, 540, 1050, 1.0, 1.06, T); forest(T, 1240, 0); P.snowGround(g, 1290);
    face(330, 1000, 1.15, HENEY, { expr: talk(T, "talk", "deadpan"), look: 1 }, 1, T, 60);
    const items = [(x, y) => P.bale(g, x, y, 0.9), (x, y) => { g.save(); g.translate(x, y); g.rotate(0.7); g.fillStyle = "#8a5a34"; g.fillRect(-10, -90, 20, 180); g.beginPath(); g.ellipse(0, 110, 28, 60, 0, 0, Math.PI * 2); g.fillStyle = "#c08a4a"; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke(); g.restore(); },
      (x, y) => { g.beginPath(); g.ellipse(x, y + 30, 80, 24, 0, 0, Math.PI * 2); g.fillStyle = "#a8743c"; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke(); g.fillStyle = "#9aa3ad"; g.fillRect(x - 10, y - 90, 20, 110); }];
    g.beginPath(); g.roundRect(660, 480, 380, 860, 30); g.fillStyle = "rgba(239,230,210,0.92)"; g.fill(); g.lineWidth = 8; g.strokeStyle = P.INK; g.stroke();
    items.forEach((f, i) => { const y = 620 + i * 280, k = clamp((T - T_("anything") - i * 0.18) / 0.25, 0, 1); f(790, y); check(950, y, 55, k); });
    screen(); tag("ANYTHING", 540, 260, EMBER, back((T - T_("anything")) / 0.25) * 1.2, 100);
  }],
  [T_("well"), (t, d, T) => { // "as well as the men" — balance scale: Isobel = the men
    WINTER(1300); push(t, d, 540, 1050, 1.0, 1.06, T); P.snowGround(g, 1450);
    ch(260, 1800, 0.85, ISOBEL, { expr: "smile", pose: "cheer" }, 1, T, 5);
    ch(700, 1800, 0.75, MAN(0), { expr: "deadpan" }, -1, T, 30); ch(900, 1810, 0.75, MAN(1), { expr: "gulp" }, -1, T, 31);
    tag("=", 470, 1150, EMBER, back((t - 0.1) / 0.25) * 1.5, 160);
    screen(); tag("AS WELL AS THE MEN", 540, 260, "#fff", back((t - 0.05) / 0.25) * 0.95, 80);
  }],
  [SEG(14), (t, d, T) => { // "History remembers who was allowed to do the job"
    screen(); g.fillStyle = "#3a2a22"; g.fillRect(0, 0, W, H); push(t, d, 540, 1000, 1.0, 1.14, T); g.beginPath(); g.rect(880, 1380, 60, 180); g.fillStyle = "#f2eadc"; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke(); P.flame(g, 910, 1380, 110, T);
    g.save(); g.translate(540, 900 + 12 * Math.sin(T * 2.4)); g.rotate(0.03 * Math.sin(T * 1.7)); g.beginPath(); g.rect(-420, -300, 840, 600); g.fillStyle = "#f6efd9"; g.fill(); g.lineWidth = 10; g.strokeStyle = P.INK; g.stroke(); g.beginPath(); g.moveTo(0, -300); g.lineTo(0, 300); g.stroke();
    g.fillStyle = "#5a3a24"; g.font = "900 64px Montserrat"; g.textAlign = "center"; g.fillText("HISTORY", -210, -200);
    for (let i = 0; i < 4; i++) { const a = clamp((T - T_("allowed") - i * 0.12) / 0.2, 0, 1); g.save(); g.translate(-330 + i * 85, 110); g.scale(0.34, 0.34); if (a) { const o = MAN(i); ch(0, 400, 1, o, { expr: "smile", noShadow: true }, 1, T, 30 + i); } g.restore(); }
    g.save(); g.translate(210, 105); g.scale(0.4, 0.4); ch(0, 400, 1, ISOBEL, { expr: "neutral", noShadow: true }, 1, T, 5); g.restore();
    g.globalAlpha = clamp((T - T_("allowed")) / 0.4, 0, 1); g.fillStyle = "rgba(246,239,217,0.75)"; g.fillRect(40, -280, 360, 560); g.globalAlpha = 1;
    g.restore();
    screen(); tag("WHO WAS ALLOWED", 540, 260, "#fff", back((T - T_("allowed")) / 0.25) * 1.0, 90);
  }],
  [T_("not", 0), (t, d, T) => { // "not who could." — Isobel lifts a heavy bale over her head
    SKY("#ff9a5a", "#ffe0a8", 1300); push(t, d, 540, 1050, 1.0, 1.08, T); sun(540, 1150, 200, "#ffe09a"); forest(T, 1260, 0, SPRUCE); P.snowGround(g, 1300, "#fbe8d8");
    ch(540, 1820, 1.05, ISOBEL, { expr: "grin", pose: "cheer" }, 1, T, 5);
    P.bale(g, 540, 875 + 8 * Math.sin(T * 3), 1.2, 2);
    sparkle(540, 760, 240, T);
    screen(); tag("WHO COULD", 540, 260, EMBER, back((T - T_("could")) / 0.25) * 1.3, 120);
  }],
  [SEG(15), (t, d, T) => { // ending (new): old Isobel knitting stockings at a lit window in Stromness, dusk
    SKY("#3a4a6a", "#e89a6a", 1250); push(t, d, 540, 1100, 1.0, 1.07, T); sea(T, 1120, ["#6a7a94", "#5a6a84", "#4a5a74", "#3a4a62"], 0.6);
    P.croft(g, 200, 1250, 0.6, true); P.croft(g, 900, 1240, 0.55, true); P.ground(g, -3000, 4000, 1260, "#5a6a4a");
    g.beginPath(); g.moveTo(-50, 1320); g.lineTo(1130, 1320); g.lineWidth = 4; g.strokeStyle = P.INK; g.stroke();
    for (let i = 0; i < 4; i++) P.stocking(g, 180 + i * 240, 1420 + 10 * Math.sin(T * 2 + i), 0.8, [WOOL, "#2f4f7a", "#c8913a", "#3f6a4a"][i], 0.06 * Math.sin(T * 2 + i));
    ch(540, 1840, 0.95, OLD, { expr: "smile_closed", pose: "hold", held: (gg, x, y, u) => { gg.lineCap = "round"; gg.beginPath(); gg.moveTo(x - 30 * u, y - 18 * u + 3 * u * Math.sin(T * 8)); gg.lineTo(x + 18 * u, y + 10 * u); gg.moveTo(x + 30 * u, y - 18 * u - 3 * u * Math.sin(T * 8)); gg.lineTo(x - 18 * u, y + 10 * u); gg.lineWidth = 2.5 * u; gg.strokeStyle = "#c8c0b0"; gg.stroke(); gg.beginPath(); gg.arc(x, y + 12 * u, 13 * u, 0, Math.PI * 2); gg.fillStyle = WOOL; gg.fill(); gg.lineWidth = 2 * u; gg.strokeStyle = P.INK; gg.stroke(); } }, 1, T, 5);
    screen(); tag("STROMNESS, ORKNEY", 540, 1240 - 1000 + 120, "#fff", back(t / 0.25) * 0.8, 60);
    tag("KEEP HER SECRET?", 540, 200, EMBER, back((t - 0.1) / 0.25) * 1.0, 92);
    clueCard("?", 870, 620, clamp((t - 0.4) / 0.35, 0, 1), T, 0.42);
    tag("COMMENT ↓", 330, 640, "#fff", back((t - 0.6) / 0.3) * 1.0, 84);
  }],
];
const SH = SHOTS.map((s) => s[0]);

// ---------------- captions (ember accent on key words) ----------------
const allWords = segs.flatMap((s) => s.words);
const KEY = /^(five|clues|fur|trader|secret|orkney|june|eighteenohsix|john|fubbister|three|years|eight|pounds|ship|canada|forts|hudsons|bay|company|four|hauls|freight|chops|wood|men|paddles|thousand|kilometres|canoe|keeps|two|winter|eighteenohseven|south|pembina|red|river|one|december|twentyninth|rival|fire|hearth|pain|jacket|woman|isobel|gunn|hour|baby|boy|banned|washerwoman|eighteenohnine|home|anything|history|allowed|could|kept)$/i;
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
  let fs = 104; g.font = `900 ${fs}px Montserrat`; const mw = g.measureText(txt.toUpperCase()).width; if (mw > 980) { fs *= 980 / mw; g.font = `900 ${fs}px Montserrat`; }
  g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
  g.lineWidth = 22; g.strokeStyle = "#111"; g.strokeText(txt.toUpperCase(), 0, 0);
  g.fillStyle = key ? EMBER : "#ffffff"; g.fillText(txt.toUpperCase(), 0, 0);
  g.restore();
}

// ---------------- frame ----------------
window.SHOT_STARTS = SH;
const CLUES = [[SEG(1), 5], [SEG(4), 4], [SEG(5), 3], [SEG(6), 2], [SEG(7), 1]];
window.renderFrame = (f) => {
  const T = f / FPS;
  let i = SH.length - 1; while (i > 0 && T < SH[i]) i--;
  const t = T - SH[i], d = (i + 1 < SH.length ? SH[i + 1] : DUR) - SH[i];
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
  shakeAmt = 0;
  SHOTS[i][1](t, d, T);
  screen();
  // clue badge during each clue's scenes (not on the clue cards themselves)
  if (T < SEG(8)) { const c = CLUES.filter(([s]) => T >= s).pop(); if (c && !CLUES.some(([s]) => SH[i] === s)) badge(c[1]); }
  const fl = [SEG(10), T_("woman")].map((s) => clamp(1 - Math.abs(T - s) / 0.12, 0, 1)).reduce((a, b) => Math.max(a, b), 0);
  if (fl > 0) { g.fillStyle = `rgba(255,255,255,${fl})`; g.fillRect(0, 0, W, H); }
  // cold vignette
  const v = g.createRadialGradient(W / 2, H / 2, 600, W / 2, H / 2, 1250); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(10,20,40,0.3)");
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  captions(T);
  return true;
};
window.ready = true;
