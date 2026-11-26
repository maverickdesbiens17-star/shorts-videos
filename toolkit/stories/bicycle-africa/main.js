import { Pen, bodyFront } from "./toon.js";
import * as P from "./paint.js";
const { clamp, lerp, ss, easeOut, back, rnd } = P;

export const W = 1080, H = 1920, FPS = 30;
const cv = document.getElementById("c"); cv.width = W; cv.height = H;
const g = cv.getContext("2d");

// « The Bicycle Diaries » — Kazimierz Nowak crosses Africa by bicycle, 1931-1936.
// Structure: TRAVEL DIARY TIMELINE (every date lands as a postmark on a running route map). Palette: sun-baked postcard
// (terracotta / sun yellow / acacia olive / sepia cream / stamp cobalt). Caption accent: sky cyan. New label: postmark().
const TERRA = "#c8553d", SUNY = "#f6c34a", OLIVE = "#6f8a3a", CREAM = "#f3e6c8", COBALT = "#2f5fb3", SAND = "#efc27a", SEPIA = "#7a5232", CYAN = "#7fdcff";

// ---------------- cast ----------------
const NOWAK = { jacket: "#d8c08a", pants: "#7a5a3a", boots: "#4a3424", hat: "safari", cap: "#efe4bf", band: "#6a4428", skin: "#f3d2a8", hair: "#6a4a30" };
const NOWAK_R = { skin: "#f3d2a8", shirt: "#d8c08a", pants: "#7a5a3a", boots: "#4a3424", hat: "safari", hatCol: "#efe4bf", band: "#6a4428", pack: "#8a6a3a" };
const SOLDIER = (v) => ({ jacket: "#a29a68", pants: "#7a7450", boots: "#2a2420", hat: "cap", cap: "#8a8458", skin: ["#f0cfa8", "#e6c09a"][v % 2], moustache: v ? "#3a2a20" : undefined, rifle: true });
const BRIT = { jacket: "#f2efe6", pants: "#e8e2d2", boots: "#5a3a24", hat: "safari", cap: "#fbf8ef", band: "#2a2026", tie: "#2a4a8a", skin: "#f6d8bc", moustache: "#c9a070" };
const FARMER = { jacket: "#6a8a5a", pants: "#4a3a2a", boots: "#3a2a1e", hat: "fedora", cap: "#7a5a3a", band: "#3a2a20", skin: "#eec6a0", beard: "#9a7a5a", build: "stout" };
const MARIA = { jacket: COBALT, dress: COBALT, pants: "#2a2a36", boots: "#2a2026", hat: "hair", hair: "#5a3a26", skin: "#f6d8bc" };
const OFFICIAL = { jacket: "#e8e2d2", pants: "#e8e2d2", boots: "#2a2020", hat: "safari", cap: "#ffffff", band: "#8a2a2a", tie: "#8a2a2a", skin: "#f8dcc4", moustache: "#5a4030", build: "stout" };
const VILLAGER = (v) => ({ jacket: ["#d9813a", "#2f8a6a", "#e8c547", "#b8323a", "#6a4aa0"][v % 5], dress: v % 2 ? ["#e8c547", "#2f8a6a", "#d9813a"][v % 3] : undefined, pants: "#4a3424", boots: "#5a3a24",
  hat: "hair", hair: ["#141218", "#2a1c16"][v % 2], skin: ["#6a4430", "#7a4e34", "#5a3828", "#8a5a3c"][v % 4], beard: v === 3 ? "#d8d8d8" : undefined });
const FAN = (v) => ({ jacket: ["#ff5a3a", "#2fb0e0", "#ffd84a", "#5ac06a"][v % 4], pants: "#2a2a36", boots: "#ffffff", hat: "cap", cap: ["#ffffff", "#222222"][v % 2], skin: ["#f3d2a8", "#e6b892", "#c48a5e"][v % 3] });

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
function envelope(x, y, s, rot = 0, col = CREAM) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.beginPath(); g.rect(-90, -58, 180, 116); g.fillStyle = col; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke();
  g.beginPath(); g.moveTo(-90, -58); g.lineTo(0, 10); g.lineTo(90, -58); g.lineWidth = 5; g.stroke();
  g.beginPath(); g.rect(46, -48, 34, 40); g.fillStyle = TERRA; g.fill(); g.lineWidth = 3; g.stroke();
  g.restore();
}
function polFlag(x, y, w, T = 0) {
  const h = w * 0.62; g.beginPath(); g.rect(x - 6, y - 20, 12, h * 2.6); g.fillStyle = "#c9ccd2"; g.fill(); g.lineWidth = 4; g.strokeStyle = P.INK; g.stroke();
  g.save(); g.translate(x, y); g.transform(1, 0.04 * Math.sin(T * 3), 0, 1, 0, 0);
  g.beginPath(); g.rect(0, 0, w, h); g.fillStyle = "#ffffff"; g.fill(); g.fillStyle = "#dc143c"; g.fillRect(0, h / 2, w, h / 2); g.beginPath(); g.rect(0, 0, w, h); g.lineWidth = 5; g.stroke(); g.restore();
}

// ---------------- backdrops ----------------
const SKY = (top, bot, horizon = 1250) => { const gr = g.createLinearGradient(0, -300, 0, horizon); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(-800, -800, 2700, 3600); };
const DAYSKY = (h = 1250) => SKY("#4fa8d8", "#f6e2b0", h);
const DUSK = (h = 1250) => SKY("#5a3a7a", "#f2905a", h);
const NIGHTSKY = (h = 1250) => SKY("#0f1430", "#2a2a5a", h);
function sun(x, y, r, col = "#ffe08a") { const gr = g.createRadialGradient(x, y, r * 0.5, x, y, r * 2.6); gr.addColorStop(0, "rgba(255,230,150,0.6)"); gr.addColorStop(1, "rgba(255,230,150,0)"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 2.6, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = col; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke(); }
function savanna(T, horizon = 1250, col = "#d9b25a") { P.hills(g, -800, 2000, horizon - 40, 40, "#b89a4a", 7); P.ground(g, -3000, 4000, horizon, col);
  for (let i = 0; i < 30; i++) { const x = rnd(i, 1) * 1600 - 260, y = horizon + 30 + rnd(i, 2) * 700; g.beginPath(); g.moveTo(x - 16, y); g.lineTo(x - 6, y - 26 - 6 * Math.sin(T * 2 + i)); g.lineTo(x, y); g.lineTo(x + 8, y - 30); g.lineTo(x + 16, y); g.lineWidth = 4; g.strokeStyle = "#8a6a2a"; g.stroke(); } }
function jungle(T, horizon = 1300) { SKY("#7ab8a0", "#d8e8b0", horizon);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) { const x = -150 + i * 170 + r * 60, y = horizon - 260 + r * 140, rr = 150 - r * 20;
    g.beginPath(); g.arc(x, y + 6 * Math.sin(T + i), rr, 0, Math.PI * 2); g.fillStyle = ["#2f6a3a", "#3f7a3a", "#4f8a3a"][r]; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke(); } }
function river(T, y0 = 1350) { g.fillStyle = "#6a8a6a"; g.fillRect(-800, y0, 2700, 2000); g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 5;
  for (let i = 0; i < 18; i++) { const x = ((rnd(i, 1) * 1500 - T * 60) % 1500 + 1500) % 1500 - 200, y = y0 + 40 + rnd(i, 2) * 500; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 40, y - 10, x + 80, y); g.stroke(); } }
/** the running diary MAP: Africa + route drawn up to progress k (0..1 over the whole trip) + rider dot */
const MX = 120, MY = 280, MW = 840, MH = 1000;
const LOC = { tripoli: [0.42, 0.13], ghat: [0.4, 0.25], aswan: [0.68, 0.24], khartoum: [0.68, 0.36], rwanda: [0.66, 0.52], zambia: [0.6, 0.66], cape: [0.47, 0.965],
  namibia: [0.42, 0.78], angola: [0.39, 0.63], luebo: [0.52, 0.55], kinshasa: [0.42, 0.54], chad: [0.47, 0.33], ouargla: [0.31, 0.16], algiers: [0.29, 0.1], poland: [0.5, -0.24] };
const ROUTE = ["tripoli", "ghat", "aswan", "khartoum", "rwanda", "zambia", "cape", "namibia", "angola", "luebo", "kinshasa", "chad", "ouargla", "algiers"].map((n) => LOC[n]);
const mp = ([u, v]) => [MX + u * MW, MY + v * MH];
function routeTo(k, col = TERRA, w = 13) {
  const pts = ROUTE.map(mp), n = pts.length - 1, kk = clamp(k, 0, 1) * n, last = Math.floor(kk);
  g.save(); g.setLineDash([24, 14]); g.lineCap = "round"; g.lineWidth = w + 8; g.strokeStyle = "#fff6e0"; g.beginPath(); g.moveTo(...pts[0]);
  for (let i = 1; i <= last; i++) g.lineTo(...pts[i]); let end = pts[last];
  if (last < n) { const f = kk - last; end = [lerp(pts[last][0], pts[last + 1][0], f), lerp(pts[last][1], pts[last + 1][1], f)]; g.lineTo(...end); }
  g.stroke(); g.lineWidth = w; g.strokeStyle = col; g.stroke(); g.restore();
  return end;
}
const PROG = { tripoli: 0, ghat: 1 / 13, khartoum: 3 / 13, zambia: 5 / 13, cape: 6 / 13, namibia: 7 / 13, luebo: 9 / 13, chad: 11 / 13, algiers: 1 };
function diaryMap(T, k0, k1, t, d, o = {}) {
  screen(); g.fillStyle = o.bg ?? "#7cb8c8"; g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(255,255,255,0.16)"; g.lineWidth = 3; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(0, 160 * i); g.lineTo(W, 160 * i); g.stroke(); g.beginPath(); g.moveTo(i * 120, 0); g.lineTo(i * 120, H); g.stroke(); }
  const z = o.z ?? lerp(1.0, 1.12, ss(t / d)); cam(o.cx ?? 540, o.cy ?? 800, z, 0, T);
  P.africa(g, MX, MY, MW, MH, SAND, T);
  const k = lerp(k0, k1, ss(clamp(t / (o.dur ?? d * 0.85), 0, 1))), e = routeTo(k);
  if (o.bike !== false) P.bikeSide(g, e[0], e[1] + 6, 0.17, T, NOWAK_R, { dir: o.dir ?? 1, bags: false });
  return e;
}

// ---------------- shots: [start (s), fn(t in shot, shot length, global T)] ----------------
const SHOTS = [
  [0, (t, d, T) => { // "One man." — opening (new): a lone face silhouetted against a giant rising sun
    SKY("#f2905a", "#ffd88a", 1300); push(t, d, 540, 1000, 1.0, 1.08, T);
    sun(540, 1060, lerp(260, 300, t / d), "#ffe9a0");
    savanna(T, 1320, "#c9973a");
    face(540, 980, 1.55, NOWAK, { expr: "neutral", look: 0 }, 1, T, 3);
    screen(); tag("ONE MAN", 540, 300, "#fff", back((t - 0.05) / 0.25) * 1.5, 100);
  }],
  [T_("one", 1), (t, d, T) => { // "One old bicycle." — the battered 1930s bike rolls in
    screen(); g.fillStyle = CREAM; g.fillRect(0, 0, W, H); push(t, d, 540, 1100, 1.0, 1.08, T);
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2 + T * 0.2; g.beginPath(); g.moveTo(540, 1000); g.arc(540, 1000, 1700, a, a + 0.12); g.closePath(); g.fillStyle = "rgba(200,85,61,0.13)"; g.fill(); }
    P.shadow(g, 540, 1500, 330, 0.25);
    P.bikeSide(g, lerp(-200, 540, easeOut(t / 0.6)), 1500, 1.25, T * (t < 0.6 ? 1 : 0.2), null, { frame: "#5a6a7a" });
    screen(); tag("ONE OLD BICYCLE", 540, 300, TERRA, back((t - 0.05) / 0.25) * 1.2, 88);
  }],
  [T_("forty"), (t, d, T) => { // "Forty thousand kilometres across Africa." — the whole route draws itself, odometer climbs
    diaryMap(T, 0, 1, t, d, { dur: d * 0.9 });
    bigNum(Math.round(lerp(0, 40000, easeOut(clamp((t - 0.1) / (d * 0.8), 0, 1))) / 100) * 100, SUNY, "KILOMETRES", back(t / 0.25), 250);
    screen(); tag("AFRICA", 540, 1680, "#fff", back((T - T_("africa")) / 0.25) * 1.3, 90);
  }],
  [SEG(1), (t, d, T) => { // "Meet Kazimierz Nowak," — waving, postcard frame
    screen(); g.fillStyle = "#e8d6a8"; g.fillRect(0, 0, W, H); push(t, d, 540, 1050, 1.0, 1.06, T);
    g.beginPath(); g.roundRect(90, 330, 900, 1160, 30); g.fillStyle = "#fffaf0"; g.fill(); g.lineWidth = 10; g.strokeStyle = P.INK; g.stroke();
    g.save(); g.beginPath(); g.roundRect(130, 370, 820, 1080, 20); g.clip(); DAYSKY(1100); sun(800, 560, 70); savanna(T, 1150, "#d9b25a"); P.acacia(g, 230, 1180, 330, OLIVE, T);
    ch(540, 1560, 1.12, NOWAK, { expr: talk(T, "grin", "smile"), wave: Math.sin(T * 8), look: 0 }, 1, T, 3); g.restore();
    for (let i = 0; i < 30; i++) { g.beginPath(); g.rect(90 + i * 30 + (i % 2) * 15, 330, 15, 12); g.fillStyle = i % 2 ? TERRA : COBALT; g.fill(); }
    screen(); tag("KAZIMIERZ NOWAK", 540, 250, SUNY, back((T - T_("kazimierz")) / 0.25) * 1.0, 82);
  }],
  [T_("polish"), (t, d, T) => { // "a Polish reporter" — flag, notebook + camera
    DAYSKY(1200); push(t, d, 540, 1100, 1.0, 1.07, T); P.cloud(g, 160 + T * 10, 420, 1.1);
    P.ground(g, -3000, 4000, 1220, "#9aa86a"); polFlag(760, 640, 240, T);
    ch(400, 1830, 1.0, NOWAK, { expr: "smile", pose: "hold", held: (gg, x, y, u) => { gg.beginPath(); gg.roundRect(x - 34 * u, y - 22 * u, 68 * u, 46 * u, 6 * u); gg.fillStyle = "#2a2a30"; gg.fill(); gg.lineWidth = 3 * u; gg.strokeStyle = P.INK; gg.stroke();
      gg.beginPath(); gg.arc(x, y, 15 * u, 0, Math.PI * 2); gg.fillStyle = "#8ab0d0"; gg.fill(); gg.stroke(); if (Math.floor(T * 3) % 3 === 0) { gg.beginPath(); gg.arc(x + 24 * u, y - 18 * u, 6 * u, 0, Math.PI * 2); gg.fillStyle = "#fff6b0"; gg.fill(); } } }, 1, T, 3);
    screen(); tag("POLISH", 540, 300, "#fff", back(t / 0.25) * 1.2, 90); tag("REPORTER", 540, 420, SUNY, back((T - T_("reporter")) / 0.25) * 1.1, 84);
  }],
  [T_("almost"), (t, d, T) => { // "with almost no money." — empty pockets, a lonely coin, a moth flies out
    screen(); g.fillStyle = "#6a5a8a"; g.fillRect(0, 0, W, H); push(t, d, 540, 1000, 1.05, 1.12, T);
    face(540, 1000, 1.45, NOWAK, { expr: t > 0.4 ? "gulp" : "nervous", look: 0 }, 1, T, 3);
    g.beginPath(); g.ellipse(250, 1400, 110, 70, 0, 0, Math.PI * 2); g.fillStyle = "#8a6a3a"; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke(); // open wallet
    g.beginPath(); g.ellipse(250, 1380, 80, 26, 0, 0, Math.PI * 2); g.fillStyle = "#3a2a1e"; g.fill();
    const mk = clamp((t - 0.2) / 1.0, 0, 1); g.save(); g.translate(250 + 140 * mk, 1360 - 360 * mk); const f = Math.sin(T * 40);
    for (const k of [-1, 1]) { g.beginPath(); g.ellipse(k * 22, 0, 24, 14 + 8 * f, k * 0.4, 0, Math.PI * 2); g.fillStyle = "#d8d0c0"; g.fill(); g.lineWidth = 3; g.stroke(); } g.restore();
    sweat(800, 760, 1.4, T);
    screen(); tag("ALMOST NO MONEY", 540, 300, "#fff", back((T - T_("almost")) / 0.25) * 1.1, 84);
    bigNum("$0", SUNY, "", back((T - T_("money")) / 0.25), 470);
  }],
  [SEG(2), (t, d, T) => { // "November 1931:" — first diary postmark over the map, start pin
    diaryMap(T, 0, 0, t, d, { bike: true });
    pin(...mp(LOC.tripoli), back(t / 0.3), TERRA);
    screen(); postmark("NOV 1931", "DIARY · DAY 1", 540, 330, clamp((t - 0.05) / 0.3, 0, 1), COBALT, 190);
  }],
  [T_("he", 0), (t, d, T) => { // "he rides out of Libya." — side view, palm-lined coast road, Tripoli arches behind
    DAYSKY(1250); push(t, d, 540, 1150, 1.0, 1.05, T); sun(860, 380, 80);
    g.save(); g.translate(-T * 80 % 600, 0); for (let i = 0; i < 6; i++) { const x = i * 300 - 100; g.beginPath(); g.rect(x, 900, 240, 340); g.fillStyle = "#f6efe0"; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke();
      g.beginPath(); g.roundRect(x + 70, 1000, 100, 240, [50, 50, 0, 0]); g.fillStyle = "#c89a6a"; g.fill(); g.stroke(); } g.restore();
    for (let i = 0; i < 5; i++) P.palm(g, ((i * 320 - T * 160) % 1700 + 1700) % 1700 - 300, 1260, 380, T + i, "#4f8a3a");
    P.ground(g, -3000, 4000, 1250, "#e0c07a"); g.fillStyle = "#b8a080"; g.fillRect(-500, 1420, 2100, 120);
    P.bikeSide(g, 560, 1560, 0.9, T, NOWAK_R);
    speedLines(T, 6, "rgba(255,255,255,0.45)");
    screen(); postmark("LIBYA", "TRIPOLI", 860, 330, back((T - T_("libya")) / 0.3), TERRA, 140, 0.1); tag("HEADING SOUTH", 360, 330, "#fff", back((t - 0.1) / 0.25), 64);
  }],
  [SEG(3), (t, d, T) => { // "In the Sahara," — a tiny rider in a sea of dunes
    SKY("#f2a65a", "#ffe2a0", 1000); push(t, d, 540, 1050, 1.0, 1.08, T); sun(780, 600, 120, "#fff2b0");
    P.dunes(g, 1000, T); P.bikeSide(g, lerp(380, 640, t / d), 1160, 0.28, T, NOWAK_R);
    screen(); tag("SAHARA", 540, 330, "#fff", back(t / 0.25) * 1.5, 120);
  }],
  [T_("soldiers"), (t, d, T) => { // "soldiers think he's a spy." — two colonial soldiers inspect him with a magnifier
    SKY("#f2a65a", "#ffe2a0", 1150); push(t, d, 540, 1150, 1.02, 1.1, T); sun(200, 500, 90, "#fff2b0");
    P.dunes(g, 1180, T * 0.2);
    P.bikeSide(g, 820, 1560, 0.55, 0, null, { still: true });
    ch(560, 1830, 0.92, NOWAK, { expr: "nervous", look: -1 }, 1, T, 3); sweat(650, 1180, 1.1, T);
    ch(240, 1840, 0.88, SOLDIER(0), { expr: talk(T, "shout", "stern"), pose: "point", pointUp: 0.4, look: 1 }, 1, T, 21);
    ch(900, 1880, 0.82, SOLDIER(1), { expr: "stern", pose: "hold", held: (gg, x, y, u) => { gg.beginPath(); gg.arc(x - 30 * u, y - 30 * u, 26 * u, 0, Math.PI * 2); gg.fillStyle = "rgba(200,230,255,0.6)"; gg.fill(); gg.lineWidth = 5 * u; gg.strokeStyle = P.INK; gg.stroke(); gg.beginPath(); gg.moveTo(x - 12 * u, y - 12 * u); gg.lineTo(x + 6 * u, y + 8 * u); gg.lineWidth = 8 * u; gg.stroke(); }, look: -1 }, -1, T, 22);
    screen(); stamp("SPY?", 540, 330, clamp((T - T_("spy")) / 0.25, 0, 1), "#d8323a", -0.1, 130);
  }],
  [T_("on", 0), (t, d, T) => { // "On the dunes, he carries his bike." — walking with the bike held over his head
    SKY("#f29a4a", "#ffd890", 1150); push(t, d, 540, 1150, 1.0, 1.07, T); sun(820, 520, 110, "#fff2b0"); P.dunes(g, 1150, 0);
    const ph = (T * 1.2) % 1;
    g.save(); g.translate(0, -8 * Math.abs(Math.sin(ph * Math.PI * 2))); P.bikeSide(g, 540, 1135, 0.62, 0, null, { still: true }); g.restore();
    ch(540, 1820, 0.95, NOWAK, { expr: "gulp", pose: "cheer", mode: "march", phase: ph, look: 0 }, 1, T, 3);
    sweat(660, 1160, 1.2, T); sweat(410, 1200, 1.0, T + 0.4);
    for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(380 + i * 110, 1835 + (i % 2) * 20, 34, 12, 0, 0, Math.PI * 2); g.fillStyle = "rgba(150,90,40,0.4)"; g.fill(); }
    screen(); tag("CARRIED", 540, 330, "#fff", back((T - T_("carries")) / 0.25) * 1.3, 100);
  }],
  [SEG(4), (t, d, T) => { // "Then malaria." — shivering in his tent, mosquitoes, thermometer
    jungle(T, 1300); push(t, d, 540, 1100, 1.02, 1.1, T); P.ground(g, -3000, 4000, 1300, "#5a6a3a");
    P.tent(g, 540, 1700, 1.6, "#c9b27a");
    const sh = 5 * Math.sin(T * 50);
    face(540 + sh, 1180, 1.0, NOWAK, { expr: "gulp", look: 0 }, 1, T, 3);
    g.beginPath(); g.roundRect(700, 1050, 26, 200, 13); g.fillStyle = "#fff"; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke(); g.fillStyle = "#e0303a"; const th = lerp(40, 180, clamp(t / 1.0, 0, 1)); g.fillRect(704, 1250 - th, 18, th);
    for (let i = 0; i < 4; i++) P.mosquito(g, 540 + 330 * Math.cos(T * 2 + i * 1.6), 850 + 160 * Math.sin(T * 3 + i), 1.1, T + i);
    screen(); stamp("MALARIA", 540, 330, clamp((T - T_("malaria")) / 0.25, 0, 1), "#2f8a3a", -0.08, 110);
  }],
  [T_("and", 0), (t, d, T) => { // "And one night, a lion." — a lion roars at the tent
    NIGHTSKY(1250); shakeAmt = T > T_("lion") ? 12 : 0; push(t, d, 540, 1150, 1.0, 1.1, T);
    P.stars && P.stars(g, T, 80, 1100, 17);
    g.beginPath(); g.arc(860, 330, 60, 0, Math.PI * 2); g.fillStyle = "#f6f0d8"; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke();
    P.ground(g, -3000, 4000, 1250, "#3a3a2a"); P.acacia(g, 150, 1260, 380, "#2a3a2a", T);
    P.tent(g, 760, 1540, 1.2, "#8a7a5a", 0.6 + 0.4 * Math.sin(T * 6));
    const lk = ss((T - T_("lion") + 0.3) / 0.5); P.lion(g, lerp(-300, 250, lk), 1720, 1.05, T, T > T_("lion") ? 0.6 + 0.4 * Math.sin(T * 9) : 0);
    face(760, 1330, 0.55, NOWAK, { expr: T > T_("lion") ? "shock" : "neutral", look: -1 }, 1, T, 3);
    screen(); tag("ONE NIGHT...", 540, 300, "#fff", back(t / 0.25), 80); tag("A LION!", 540, 430, SUNY, back((T - T_("lion")) / 0.2) * 1.3, 110);
  }],
  [SEG(5), (t, d, T) => { // "April 1934:" — postmark + map reaches the south tip
    diaryMap(T, PROG.zambia, PROG.cape, t, d, { dur: d * 0.7 });
    screen(); postmark("APR 1934", "DIARY · YEAR 3", 540, 330, clamp((t - 0.05) / 0.3, 0, 1), COBALT, 190);
  }],
  [T_("cape"), (t, d, T) => { // "Cape Agulhas," — lighthouse on the cape, Nowak cheers with his bike
    DAYSKY(1200); push(t, d, 540, 1150, 1.0, 1.06, T); P.cloud(g, 120 + T * 12, 420, 1.2);
    g.fillStyle = "#3a8ab0"; g.fillRect(-800, 1180, 2700, 800); // cold sea where two oceans meet
    g.beginPath(); g.moveTo(-200, 1300); g.quadraticCurveTo(400, 1150, 760, 1260); g.lineTo(1300, 1400); g.lineTo(1300, 2400); g.lineTo(-200, 2400); g.closePath(); g.fillStyle = "#8aa05a"; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
    P.lighthouse(g, 820, 1310, 640, T);
    P.bikeSide(g, 260, 1740, 0.55, 0, null, { still: true });
    ch(500, 1840, 0.95, NOWAK, { expr: "laugh", pose: "cheer" }, 1, T, 3);
    sparkle(500, 1100, 120, T);
    screen(); tag("CAPE AGULHAS", 540, 300, SUNY, back((T - T_("cape")) / 0.25) * 1.15, 96);
  }],
  [T_("tip"), (t, d, T) => { // "the tip of Africa." — map zooms onto the southernmost point
    const z = lerp(1.0, 2.2, ss(t / (d * 0.8))); const tp = mp(LOC.cape);
    diaryMap(T, PROG.cape, PROG.cape, t, d, { z, cx: lerp(540, tp[0], ss(t / d)), cy: lerp(800, tp[1] - 200, ss(t / d)) });
    pin(tp[0], tp[1], back(t / 0.3), TERRA);
    screen(); tag("THE TIP OF AFRICA", 540, 330, "#fff", back(t / 0.25), 84); tag("SOUTHERNMOST POINT ↓", 540, 1660, SUNY, back((t - 0.4) / 0.25), 60);
  }],
  [SEG(6), (t, d, T) => { // "The British offer him a free ticket home." — official hands over a FIRST CLASS ticket
    screen(); g.fillStyle = "#cfe0e8"; g.fillRect(0, 0, W, H); push(t, d, 540, 1150, 1.0, 1.06, T);
    g.beginPath(); g.rect(0, 1200, W, 800); g.fillStyle = "#b89a70"; g.fill(); // office floor
    g.beginPath(); g.rect(120, 420, 360, 300); g.fillStyle = "#fffaf0"; g.fill(); g.lineWidth = 8; g.strokeStyle = P.INK; g.stroke(); // poster of a steamship
    g.beginPath(); g.moveTo(170, 640); g.lineTo(430, 640); g.lineTo(400, 690); g.lineTo(200, 690); g.closePath(); g.fillStyle = "#2a2a30"; g.fill(); g.beginPath(); g.rect(250, 560, 40, 80); g.rect(320, 560, 40, 80); g.fillStyle = TERRA; g.fill(); g.lineWidth = 4; g.stroke();
    g.fillStyle = P.INK; g.font = "900 36px Montserrat"; g.textAlign = "center"; g.fillText("TO EUROPE", 300, 480);
    const k = ss((T - T_("free") + 0.2) / 0.6);
    ch(300, 1830, 0.95, BRIT, { expr: talk(T, "talk", "smile"), pose: "give", pointUp: 0.1, look: 1 }, 1, T, 31);
    ch(800, 1830, 0.95, NOWAK, { expr: "smile", look: -1 }, -1, T, 3);
    g.save(); g.translate(lerp(470, 560, k), 1290 - 30 * k); g.rotate(-0.1); g.beginPath(); g.rect(-90, -50, 180, 100); g.fillStyle = SUNY; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke();
    g.fillStyle = P.INK; g.font = "900 26px Montserrat"; g.textAlign = "center"; g.fillText("FIRST CLASS", 0, -8); g.fillText("FREE", 0, 26); g.restore();
    screen(); tag("FREE TICKET HOME", 540, 300, "#fff", back((T - T_("free")) / 0.25) * 1.1, 84);
  }],
  [T_("he", 2), (t, d, T) => { // "He says no," — head shake, ticket crossed out
    screen(); g.fillStyle = "#cfe0e8"; g.fillRect(0, 0, W, H); push(t, d, 540, 1000, 1.05, 1.12, T);
    const shake = 0.12 * Math.sin(T * 16) * (t < 0.9 ? 1 : 0);
    face(540, 960, 1.5, NOWAK, { expr: "deadpan", headTilt: shake, look: 0 }, 1, T, 3);
    g.save(); g.translate(540, 1420); g.rotate(-0.1); g.beginPath(); g.rect(-150, -80, 300, 160); g.fillStyle = SUNY; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
    g.fillStyle = P.INK; g.font = "900 40px Montserrat"; g.textAlign = "center"; g.fillText("FIRST CLASS", 0, 14); g.restore();
    bigX(540, 1420, 150, clamp((t - 0.2) / 0.3, 0, 1));
    screen(); stamp("NO, THANKS", 540, 320, clamp((t - 0.1) / 0.25, 0, 1), "#d8323a", -0.08, 100);
  }],
  [T_("rides", 1), (t, d, T) => { // "and rides back north." — map: turnaround, the route heads north again
    diaryMap(T, PROG.cape, PROG.namibia, t, d, { dur: d * 0.9 });
    screen(); g.save(); g.translate(880, 560); const k = back(t / 0.3); g.scale(k, k); g.beginPath(); g.moveTo(0, -110); g.lineTo(60, 0); g.lineTo(22, 0); g.lineTo(22, 90); g.lineTo(-22, 90); g.lineTo(-22, 0); g.lineTo(-60, 0); g.closePath();
    g.fillStyle = SUNY; g.fill(); g.lineWidth = 8; g.strokeStyle = "#111"; g.stroke(); g.restore(); tag("N", 880, 420, "#fff", k, 70);
    tag("BACK NORTH", 540, 300, "#fff", back((T - T_("back")) / 0.25) * 1.2, 96);
  }],
  [SEG(7), (t, d, T) => { // "In Namibia, his bike breaks." — the bike falls apart, a wheel rolls away
    SKY("#e8905a", "#ffd8a0", 1250); push(t, d, 540, 1150, 1.0, 1.08, T); P.ground(g, -3000, 4000, 1250, "#c9784a");
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-200 + i * 400, 1250); g.lineTo(0 + i * 400, 1050 - (i % 2) * 80); g.lineTo(220 + i * 400, 1250); g.fillStyle = "#b8603a"; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke(); }
    const bk = clamp((T - T_("breaks")) / 0.6, 0, 1);
    if (bk <= 0) P.bikeSide(g, 520, 1640, 0.85, T, NOWAK_R);
    else { shakeAmt = bk < 0.5 ? 14 : 0;
      g.save(); g.translate(520, 1640); g.rotate(0.3 * bk); P.bikeSide(g, 0, 0, 0.85, 0, null, { still: true, bags: false }); g.restore();
      g.save(); g.translate(520 + 160 + 500 * bk, 1640 - 95 - 60 * Math.abs(Math.sin(bk * 9))); g.rotate(bk * 12); g.beginPath(); g.arc(0, 0, 95, 0, Math.PI * 2); g.lineWidth = 20; g.strokeStyle = P.INK; g.stroke(); g.lineWidth = 11; g.strokeStyle = "#2a2a30"; g.stroke(); g.restore();
      for (let i = 0; i < 6; i++) { const a = i * 1.1, rr = 300 * bk; g.save(); g.translate(560 + Math.cos(a) * rr, 1450 - Math.sin(a) * rr * 0.8 + 400 * bk * bk); g.rotate(T * 8 + i); g.fillStyle = "#8d949c"; g.fillRect(-18, -5, 36, 10); g.restore(); }
      ch(300, 1830, 0.9, NOWAK, { expr: "shock", pose: "cheek" }, 1, T, 3); P.burst(g, 560, 1500, 60, 220, bk, "#fff3b0"); }
    screen(); postmark("NAMIBIA", "DIARY · YEAR 3", 540, 330, back(t / 0.3), TERRA, 160, -0.1);
    stamp("BROKEN", 540, 560, clamp((T - T_("breaks")) / 0.25, 0, 1), "#d8323a", 0.1, 90);
  }],
  [T_("farmer"), (t, d, T) => { // "A farmer gives him a horse." — handing over the reins
    DAYSKY(1250); push(t, d, 540, 1150, 1.0, 1.06, T); P.cloud(g, 200 + T * 10, 400, 1.1); savanna(T, 1260, "#d9a85a");
    P.acacia(g, 900, 1270, 360, OLIVE, T);
    P.horse(g, 560, 1700, 1.05, 0.15 * Math.sin(T * 2), "#8a5a3a");
    ch(230, 1840, 0.9, FARMER, { expr: talk(T, "talk", "smile"), pose: "give", pointUp: 0.3, look: 1 }, 1, T, 41);
    ch(880, 1860, 0.88, NOWAK, { expr: "grin", look: -1 }, -1, T, 3);
    g.beginPath(); g.moveTo(420, 1230); g.quadraticCurveTo(560, 1330, 700, 1420); g.lineWidth = 6; g.strokeStyle = "#5a3a24"; g.stroke();
    screen(); tag("A FARMER", 540, 300, "#fff", back(t / 0.25) * 1.1, 90); tag("+ A HORSE", 540, 420, SUNY, back((T - T_("horse")) / 0.25) * 1.2, 90);
  }],
  [SEG(8), (t, d, T) => { // "Then a boat named after his wife," — the MARYS on a jungle river
    jungle(T, 1350); push(t, d, 540, 1150, 1.0, 1.07, T); river(T, 1350);
    P.riverBoat(g, lerp(620, 480, t / d), 1560, 1.15, T, "MARYS");
    face(640, 1250, 0.55, NOWAK, { expr: "smile", look: 1 }, 1, T, 3);
    const hk = back((T - T_("wife")) / 0.3); if (hk > 0) { g.save(); g.translate(820, 1050 - 20 * Math.sin(T * 3)); g.scale(hk, hk); g.beginPath(); g.moveTo(0, 30); g.bezierCurveTo(-70, -20, -40, -80, 0, -40); g.bezierCurveTo(40, -80, 70, -20, 0, 30); g.fillStyle = "#e8475a"; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke(); g.restore(); }
    screen(); tag("A BOAT", 540, 300, "#fff", back(t / 0.25) * 1.2, 96); tag("“MARYS” = MARIA", 540, 420, SUNY, back((T - T_("named")) / 0.25), 76);
  }],
  [T_("five"), (t, d, T) => { // "then five months on a camel." — swaying camel ride through the Sahara
    SKY("#f2a65a", "#ffe2a0", 1150); push(t, d, 540, 1150, 1.0, 1.06, T); sun(820, 520, 100, "#fff2b0"); P.dunes(g, 1180, 0);
    const ph = (T * 0.8) % 1, x = lerp(480, 600, t / d);
    const seatY = P.camel(g, x, 1760, 1.0, ph, "#d9a866");
    ch(x - 20, 1760 + seatY + 45, 0.55, NOWAK, { expr: "grin", mode: "sit", look: 1, noShadow: true }, 1, T, 3);
    P.camel(g, x - 520, 1720, 0.75, (ph + 0.4) % 1, "#c99a5a");
    bigNum(Math.min(5, 1 + Math.floor(clamp((T - T_("five")) / 0.9, 0, 1) * 5)), SUNY, "MONTHS ON A CAMEL", back((T - T_("five")) / 0.25), 330);
  }],
  [SEG(9), (t, d, T) => { // "All along, he mailed stories and photos home," — envelopes fly from Africa to Poland
    diaryMap(T, PROG.luebo, PROG.chad, t, d, { cy: 650, z: lerp(0.86, 0.9, t / d) });
    const pl = mp(LOC.poland); g.beginPath(); g.ellipse(pl[0], pl[1], 150, 80, 0, 0, Math.PI * 2); g.fillStyle = "#9ab86a"; g.fill(); g.lineWidth = 8; g.strokeStyle = P.INK; g.stroke();
    polFlag(pl[0] - 20, pl[1] - 170, 110, T);
    for (let i = 0; i < 6; i++) { const k = ((t * 0.8 + i / 6) % 1), a = mp([0.45 + 0.1 * Math.sin(i), 0.45]); envelope(lerp(a[0], pl[0], k), lerp(a[1], pl[1], k) - 150 * Math.sin(k * Math.PI), 0.7, Math.sin(T * 3 + i) * 0.3); }
    screen(); tag("STORIES + PHOTOS", 540, 1640, "#fff", back((T - T_("stories")) / 0.25), 76); tag("POLAND", 540, 250, SUNY, back(t / 0.25), 70);
  }],
  [T_("and", 3), (t, d, T) => { // "and Maria got them printed." — Maria with the newspaper showing his photo
    screen(); g.fillStyle = "#e8d6a8"; g.fillRect(0, 0, W, H); push(t, d, 540, 1150, 1.0, 1.06, T);
    g.beginPath(); g.rect(0, 1250, W, 800); g.fillStyle = "#9a7a5a"; g.fill();
    for (let i = 0; i < 5; i++) { g.save(); g.translate(150 + i * 200, 560 + (i % 2) * 40); g.rotate(-0.1 + i * 0.05); g.beginPath(); g.rect(-80, -100, 160, 200); g.fillStyle = "#f1ead8"; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke(); g.fillStyle = "#9a948a"; g.fillRect(-60, -70, 120, 70); g.restore(); }
    ch(320, 1840, 0.95, MARIA, { expr: "grin", look: 1 }, 1, T, 51);
    const k = back((T - T_("printed")) / 0.3);
    g.save(); g.translate(720, 1350); g.scale(Math.max(0.01, k), Math.max(0.01, k)); P.newspaper(g, 0, 0, 380, 0.06, "ACROSS AFRICA", "BY BICYCLE", "KURIER"); P.bikeSide(g, -80, 120, 0.2, 0, NOWAK_R, { still: true }); g.restore();
    screen(); tag("MARIA", 540, 300, COBALT === "#2f5fb3" ? "#9fc4ff" : "#fff", back(t / 0.25) * 1.2, 96); tag("PRINTED!", 540, 420, SUNY, back((T - T_("printed")) / 0.25) * 1.2, 86);
  }],
  [SEG(10), (t, d, T) => { // "November 1936:" — last postmark, route reaches Algiers
    diaryMap(T, PROG.chad, 1, t, d, { dur: d * 0.6 });
    screen(); postmark("NOV 1936", "DIARY · YEAR 5", 540, 330, clamp((t - 0.05) / 0.3, 0, 1), COBALT, 190);
  }],
  [T_("algiers"), (t, d, T) => { // "Algiers." — the white city, finish line
    DAYSKY(1200); push(t, d, 540, 1150, 1.0, 1.06, T); sun(200, 400, 80);
    P.whiteTown(g, 1260, T); P.ground(g, -3000, 4000, 1260, "#e8d6a8");
    P.bikeSide(g, lerp(1300, 560, easeOut(t / 0.8)), 1700, 0.8, T, NOWAK_R, { dir: -1 });
    screen(); tag("ALGIERS", 540, 300, SUNY, back((T - T_("algiers")) / 0.25) * 1.3, 110);
  }],
  [T_("five", 1), (t, d, T) => { // "Five years. Done." — cheering finish, odometer and tick
    SKY("#4fa8d8", "#ffe2a0", 1250); push(t, d, 540, 1150, 1.02, 1.1, T); P.whiteTown(g, 1260, T); P.ground(g, -3000, 4000, 1260, "#e8d6a8");
    P.bikeSide(g, 280, 1720, 0.6, 0, null, { still: true });
    ch(600, 1840, 1.0, NOWAK, { expr: "laugh", pose: "cheer" }, 1, T, 3);
    check(880, 1000, 110, clamp((T - T_("done")) / 0.3, 0, 1));
    confetti(T, T_("five", 1));
    bigNum("5 YEARS", SUNY, "40,000 KM", back(t / 0.25), 330);
  }],
  [SEG(11), (t, d, T) => { // "The twist?"
    screen(); g.fillStyle = "#3a1e30"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2 + T * 0.8; g.beginPath(); g.moveTo(540, 960); g.arc(540, 960, 1700, a, a + 0.14); g.closePath(); g.fillStyle = i % 2 ? "rgba(246,195,74,0.18)" : "rgba(200,85,61,0.2)"; g.fill(); }
    cam(540, 960, lerp(1.0, 1.1, ss(t / d)), 0, T); qmark(540, 1000, 2.2, T, SUNY);
    screen(); stamp("THE TWIST", 540, 330, clamp(t / 0.25, 0, 1), SUNY, -0.08, 120);
  }],
  [T_("in", 2), (t, d, T) => { // "In an age of colonial arrogance," — a pompous official on a podium, nose up, a 1930s map with flags
    screen(); g.fillStyle = "#8a7a9a"; g.fillRect(0, 0, W, H); push(t, d, 540, 1100, 1.0, 1.13, T);
    g.save(); g.translate(540, 600); g.scale(0.56, 0.56); P.africa(g, -420, -500, 840, 1000, "#d8c8a0", T);
    for (const [u, v, c] of [[0.3, 0.2, "#2f5fb3"], [0.55, 0.3, "#c8323a"], [0.5, 0.55, "#2a2a2a"], [0.6, 0.75, "#c8323a"], [0.2, 0.33, "#2f5fb3"], [0.75, 0.45, "#3f8a3a"]]) { const x = -420 + u * 840, y = -500 + v * 1000; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 110); g.lineWidth = 8; g.strokeStyle = P.INK; g.stroke(); g.beginPath(); g.rect(x, y - 110 + 6 * Math.sin(T * 5 + x), 70, 46); g.fillStyle = c; g.fill(); g.lineWidth = 5; g.stroke(); }
    g.restore();
    ch(540, 1640, 0.9, OFFICIAL, { expr: "smirk", headTilt: -0.12, look: 0, noShadow: true }, 1, T, 61);
    g.beginPath(); g.rect(220, 1450, 640, 500); g.fillStyle = "#6a3a2a"; g.fill(); g.lineWidth = 8; g.strokeStyle = P.INK; g.stroke();
    g.fillStyle = SUNY; g.beginPath(); g.arc(540, 1600, 50, 0, Math.PI * 2); g.fill(); g.lineWidth = 6; g.stroke();
    screen(); tag("COLONIAL", 540, 1690, "#fff", back(t / 0.25) * 1.2, 96); tag("ARROGANCE", 540, 1810, SUNY, back((T - T_("arrogance")) / 0.25) * 1.2, 96);
  }],
  [T_("he", 4), (t, d, T) => { // "he treated Africans as equals," — sharing a meal at the same fire, laughing together
    DUSK(1250); push(t, d, 540, 1150, 1.0, 1.06, T); savanna(T, 1260, "#b8803a"); P.acacia(g, 880, 1270, 340, "#4a5a2a", T);
    const gr = g.createRadialGradient(540, 1700, 40, 540, 1700, 600); gr.addColorStop(0, "rgba(255,190,90,0.5)"); gr.addColorStop(1, "rgba(255,190,90,0)"); g.fillStyle = gr; g.fillRect(-200, 1000, 1500, 1200);
    const xs = [170, 400, 680, 910];
    ch(xs[0], 1790, 0.78, VILLAGER(0), { expr: talk(T, "laugh", "grin"), look: 1 }, 1, T, 71);
    ch(xs[1], 1760, 0.82, NOWAK, { expr: talk(T, "laugh", "grin", 1), look: 1 }, 1, T, 3);
    ch(xs[2], 1760, 0.82, VILLAGER(3), { expr: talk(T, "laugh", "grin", 2), look: -1 }, -1, T, 72);
    ch(xs[3], 1790, 0.78, VILLAGER(1), { expr: "grin", look: -1 }, -1, T, 73);
    g.beginPath(); g.moveTo(470, 1840); g.lineTo(610, 1840); g.lineWidth = 16; g.strokeStyle = "#5a3a24"; g.stroke();
    for (let i = 0; i < 3; i++) { const f = 1 + 0.15 * Math.sin(T * 12 + i); g.beginPath(); g.moveTo(500 + i * 40, 1835); g.quadraticCurveTo(495 + i * 40, 1760 - 40 * f, 520 + i * 40, 1720 - 50 * f); g.quadraticCurveTo(540 + i * 40, 1770, 540 + i * 40, 1835); g.fillStyle = i === 1 ? "#ffd84a" : "#ff8a3a"; g.fill(); g.lineWidth = 4; g.strokeStyle = P.INK; g.stroke(); }
    screen(); tag("AS EQUALS", 540, 300, SUNY, back((T - T_("equals")) / 0.25) * 1.3, 110);
  }],
  [T_("criticised"), (t, d, T) => { // "and criticised colonial rule." — his article; a red pen slashes COLONIAL RULE
    screen(); g.fillStyle = "#5a4a3a"; g.fillRect(0, 0, W, H); push(t, d, 540, 1000, 1.0, 1.08, T);
    g.save(); g.translate(540, 900); g.rotate(-0.04); g.scale(0.82, 0.82); g.beginPath(); g.rect(-380, -480, 760, 960); g.fillStyle = "#f6efdc"; g.fill(); g.lineWidth = 8; g.strokeStyle = P.INK; g.stroke();
    g.fillStyle = "#9a948a"; for (let i = 0; i < 12; i++) g.fillRect(-320, -160 + i * 50, 640 - (i % 3) * 90, 14);
    g.fillStyle = P.INK; g.font = "900 78px Montserrat"; g.textAlign = "center"; g.fillText("COLONIAL", 0, -360); g.fillText("RULE", 0, -270);
    const k = clamp((T - T_("criticised") - 0.2) / 0.4, 0, 1); if (k > 0) { g.beginPath(); g.moveTo(-300, -330); g.lineTo(-300 + 600 * k, -300); g.lineWidth = 26; g.lineCap = "round"; g.strokeStyle = "#e0303a"; g.stroke(); }
    g.restore();
    face(540, 1500, 0.75, NOWAK, { expr: "stern", look: 0 }, 1, T, 3);
    screen(); stamp("CRITICISED", 540, 220, clamp((T - T_("criticised")) / 0.25, 0, 1), "#d8323a", -0.08, 96);
  }],
  [SEG(12), (t, d, T) => { // "He died the next year," — sepia framed portrait, candle, 1897–1937
    screen(); g.fillStyle = "#2a2026"; g.fillRect(0, 0, W, H); push(t, d, 540, 1000, 1.0, 1.06, T);
    g.beginPath(); g.rect(260, 480, 560, 700); g.fillStyle = "#6a4a2a"; g.fill(); g.lineWidth = 10; g.strokeStyle = P.INK; g.stroke();
    g.save(); g.beginPath(); g.rect(300, 520, 480, 620); g.clip(); g.fillStyle = "#d8c49a"; g.fillRect(300, 520, 480, 620); face(540, 820, 0.95, NOWAK, { expr: "smile", look: 0 }, 1, 0, 3); g.restore();
    g.save(); g.globalAlpha = 0.3; g.fillStyle = "#7a5232"; g.fillRect(300, 520, 480, 620); g.restore();
    const fl = 1 + 0.12 * Math.sin(T * 14); g.beginPath(); g.rect(800, 1250, 60, 160); g.fillStyle = "#f6f0d8"; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke();
    g.beginPath(); g.ellipse(830, 1220, 16, 34 * fl, 0, 0, Math.PI * 2); g.fillStyle = "#ffd84a"; g.fill(); g.stroke();
    screen(); tag("1897 – 1937", 540, 300, CREAM, back(t / 0.25) * 1.1, 96);
  }],
  [T_("forgotten"), (t, d, T) => { // "and was forgotten," — his book gathers dust on a shelf, colour drains
    screen(); g.fillStyle = "#4a4048"; g.fillRect(0, 0, W, H); push(t, d, 540, 1000, 1.06, 1.0, T);
    g.fillStyle = "#6a5040"; g.fillRect(0, 1040, W, 40); g.fillRect(0, 640, W, 40);
    for (let i = 0; i < 9; i++) { g.beginPath(); g.rect(60 + i * 105, 760, 80, 280); g.fillStyle = ["#7a6a8a", "#6a7a6a", "#8a6a5a"][i % 3]; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke(); }
    g.beginPath(); g.rect(460, 740, 110, 300); g.fillStyle = TERRA; g.fill(); g.lineWidth = 6; g.stroke();
    g.save(); g.translate(515, 890); g.rotate(-Math.PI / 2); g.fillStyle = "#fff"; g.font = "900 34px Montserrat"; g.textAlign = "center"; g.fillText("NOWAK", 0, 12); g.restore();
    const k = clamp(t / 1.2, 0, 1); g.fillStyle = `rgba(130,125,120,${0.65 * k})`; g.fillRect(0, 0, W, H);
    g.strokeStyle = `rgba(230,230,230,${0.8 * k})`; g.lineWidth = 3; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(560, 680); g.lineTo(560 + 140 * Math.cos(i * 0.5), 680 + 140 * Math.sin(i * 0.5)); g.stroke(); }
    for (let r = 40; r < 150; r += 35) { g.beginPath(); g.arc(560, 680, r, 0, 2.6); g.stroke(); }
    screen(); tag("FORGOTTEN", 540, 330, "#ddd", back(t / 0.25) * 1.3, 110);
  }],
  [T_("until"), (t, d, T) => { // "until fans rode his route again, in relay." — modern riders pass a baton
    DAYSKY(1250); push(t, d, 540, 1150, 1.0, 1.06, T); savanna(T, 1260, "#d9b25a"); P.acacia(g, 160, 1270, 300, OLIVE, T);
    const k = clamp((t - 0.2) / (d - 0.3), 0, 1);
    for (let i = 0; i < 3; i++) P.bikeSide(g, ((i * 420 + T * 260) % 1500) - 250, 1560 + (i % 2) * 120, 0.55, T + i, { skin: ["#f3d2a8", "#c48a5e", "#e6b892"][i], shirt: ["#ff5a3a", "#2fb0e0", "#ffd84a"][i], pants: "#2a2a36", boots: "#fff", hat: "hair", hair: "#2a2020" }, { bags: false, frame: ["#e8e8e8", "#2a2a30", "#c8323a"][i] });
    screen(); g.save(); g.translate(120, 1640); g.scale(0.32, 0.32); P.africa(g, 0, 0, 840, 1000, SAND, T); g.restore();
    g.save(); g.translate(120, 1640); g.scale(0.32, 0.32); g.translate(-MX, -MY); routeTo(k, CYAN, 20); g.restore();
    tag("FANS", 540, 300, "#fff", back((T - T_("fans")) / 0.25) * 1.2, 96); tag("2009 – 2012 · RELAY", 540, 420, SUNY, back((T - T_("relay")) / 0.25), 70);
  }],
  [SEG(13), (t, d, T) => { // "The best explorers don't conquer." — a planted flag gets crossed out
    DAYSKY(1250); push(t, d, 540, 1100, 1.0, 1.07, T); P.cloud(g, 200 + T * 10, 450, 1.1);
    g.beginPath(); g.moveTo(-200, 1450); g.quadraticCurveTo(540, 900, 1300, 1450); g.lineTo(1300, 2400); g.lineTo(-200, 2400); g.closePath(); g.fillStyle = "#9aa86a"; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
    const fk = easeOut(clamp(t / 0.5, 0, 1)); g.beginPath(); g.moveTo(540, 1130); g.lineTo(540, 1130 - 420 * fk); g.lineWidth = 14; g.strokeStyle = P.INK; g.stroke();
    g.save(); g.translate(540, 1130 - 420 * fk); g.transform(1, 0.04 * Math.sin(T * 4), 0, 1, 0, 0); g.beginPath(); g.rect(0, 0, 220, 140); g.fillStyle = "#8a2a2a"; g.fill(); g.lineWidth = 7; g.stroke(); g.restore();
    bigX(600, 900, 260, clamp((T - T_("conquer")) / 0.35, 0, 1));
    screen(); tag("DON'T CONQUER", 540, 300, "#fff", back((T - T_("dont")) / 0.25) * 1.1, 96);
  }],
  [T_("they"), (t, d, T) => { // "They listen." — Nowak listens to an elder, hand to ear
    DUSK(1250); push(t, d, 540, 1100, 1.02, 1.1, T); savanna(T, 1260, "#b8803a");
    ch(330, 1840, 1.0, VILLAGER(3), { expr: talk(T, "talk", "smile"), pose: "point", pointUp: 0.6, look: 1 }, 1, T, 72);
    ch(770, 1840, 1.0, NOWAK, { expr: "smile", pose: "cheek", look: -1 }, -1, T, 3);
    for (let i = 0; i < 3; i++) { const k = ((t * 1.2 + i / 3) % 1); g.beginPath(); g.arc(470, 1110, 60 + 160 * k, -0.5, 0.5); g.lineWidth = 8; g.strokeStyle = `rgba(255,255,255,${1 - k})`; g.stroke(); }
    screen(); tag("THEY LISTEN", 540, 300, CYAN, back((T - T_("listen")) / 0.25) * 1.3, 110);
  }],
  [SEG(14), (t, d, T) => { // ending (new): riding into the sunset across the savanna, comment postmark
    DUSK(1250); push(t, d, 540, 1150, 1.0, 1.08, T); sun(540, 1180, 200, "#ffd06a"); savanna(T, 1260, "#a8703a");
    for (let i = 0; i < 3; i++) P.acacia(g, ((i * 520 - T * 90) % 1600 + 1600) % 1600 - 260, 1270, 300 + i * 30, "#3a3a22", T);
    P.bikeSide(g, 540, 1650, 0.9, T, NOWAK_R);
    screen(); tag("WOULD YOU?", 540, 300, "#fff", back(t / 0.25) * 1.2, 100);
    postmark("COMMENT", "YOUR ANSWER", 470, 560, back((t - 0.5) / 0.35), "#ffffff", 160, -0.08);
  }],
];
const SH = SHOTS.map((s) => s[0]);

// ---------------- captions (sky-cyan accent on key words) ----------------
const allWords = segs.flatMap((s) => s.words);
const KEY = /^(one|man|bicycle|forty|thousand|kilometres|africa|kazimierz|nowak|polish|reporter|money|november|nineteen|thirtyone|libya|sahara|soldiers|spy|dunes|carries|malaria|night|lion|april|thirtyfour|cape|agulhas|tip|british|free|ticket|no|north|namibia|breaks|farmer|horse|boat|wife|five|months|camel|stories|photos|maria|printed|thirtysix|algiers|years|done|twist|colonial|arrogance|equals|criticised|died|forgotten|fans|relay|conquer|listen|continent)$/i;
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
  g.fillStyle = key ? CYAN : "#ffffff"; g.fillText(txt.toUpperCase(), 0, 0);
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
  const fl = [SEG(11), T_("five", 1)].map((s) => clamp(1 - Math.abs(T - s) / 0.12, 0, 1)).reduce((a, b) => Math.max(a, b), 0);
  if (fl > 0) { g.fillStyle = `rgba(255,255,255,${fl})`; g.fillRect(0, 0, W, H); }
  // warm postcard grain + vignette
  const v = g.createRadialGradient(W / 2, H / 2, 600, W / 2, H / 2, 1250); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(40,20,10,0.28)");
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  captions(T);
  return true;
};
window.ready = true;
