import { Pen, bodyFront } from "./toon.js";
import * as P from "./paint.js";
const { clamp, lerp, ss, easeOut, back, rnd } = P;

export const W = 1080, H = 1920, FPS = 30;
const cv = document.getElementById("c"); cv.width = W; cv.height = H;
const g = cv.getContext("2d");

// « The Rhino Who Won » — São Paulo 1959 + Quebec 1963. Structure: cold open on the result, VHS rewind, then the story.
// Palette: mid-century tropical (teal / coral / sunflower / cream); caption accent: coral.
const TEAL = "#2fb3a6", CORAL = "#ff7a6b", SUN = "#ffc93c", CREAM = "#fff4dc", NAVY = "#1d2a5c", LEAF = "#3f9e5a";

// ---------------- cast (new designs: 1950s suits + fedoras, students, a rhino, a Quebec writer) ----------------
const SK = ["#f3d2a8", "#d9a97c", "#b97a50", "#8a5a3a", "#f6dcb8", "#c48a5e"];
const JOURNO = { jacket: "#8a6a4a", pants: "#5a4632", boots: "#2a1c16", hat: "fedora", cap: "#6b5440", band: "#2a2026", tie: "#c8323a", skin: SK[0], moustache: "#3a2a1e" };
const STU_A = { jacket: SUN, dress: TEAL, pants: TEAL, boots: "#7a3b2a", hat: "hair", hair: "#2a1c16", skin: SK[2] };
const STU_B = { jacket: TEAL, pants: "#3a3f5a", boots: "#2a2420", hat: "hair", hair: "#1c1a22", skin: SK[1] };
const OLDMAN = { jacket: "#6b7a8a", pants: "#3a3f4a", boots: "#2a2420", hat: "fedora", cap: "#d8c49a", band: "#7a3b2a", tie: "#2f6b5a", skin: SK[1], moustache: "#ececec", build: "stout" };
const LADY = { jacket: CORAL, dress: "#ff9a8b", pants: "#ff9a8b", boots: "#3a2a22", hat: "hair", hair: "#5a3a22", skin: SK[3] };
const POL = (v) => ({ jacket: ["#2a2f45", "#4a3a42", "#26363a", "#3a3a52"][v % 4], pants: "#22232e", boots: "#111111", hat: v % 3 === 2 ? "fedora" : "hair",
  cap: "#2a2a30", band: "#111", hair: ["#bdbdbd", "#2a201a", "#5a4a3a", "#8a8a8a"][v % 4], tie: ["#d62f3a", SUN, TEAL, "#ff9a8b"][v % 4], skin: SK[v % 6], moustache: v % 2 ? "#2a201a" : undefined, build: "stout" });
const OFFICIAL = { jacket: "#5a5f6a", pants: "#3a3d47", boots: "#111111", hat: "fedora", cap: "#3a3d47", band: "#111", tie: NAVY, skin: SK[4], build: "stout", moustache: "#2a201a" };
const FERRON = { jacket: "#1d3f7a", pants: "#2a2a36", boots: "#2a1c16", hat: "cap", cap: "#d62f3a", tie: "#f6f3ea", shirt: "#cfe0f0", skin: SK[0] };
const FOLK = (v) => ({ jacket: [CORAL, TEAL, SUN, "#9b7fd0", "#6fbf73", "#f6f3ea"][v % 6], pants: ["#3a3f5a", "#5a4632", "#2a2a36"][v % 3], boots: "#2a2420",
  hat: v % 4 === 1 ? "fedora" : "hair", cap: "#6b5440", band: "#2a2026", hair: ["#1c1a22", "#5a3a22", "#2a1c16", "#8a5a3a"][v % 4], skin: SK[(v * 5) % 6],
  dress: v % 3 === 0 ? ["#ff9a8b", "#2fb3a6", "#ffc93c"][v % 3] : undefined, build: v % 7 === 3 ? "stout" : undefined });
const QFOLK = (v) => ({ jacket: ["#d62f3a", "#1d3f7a", "#2f6b5a", "#6b4a8a"][v % 4], pants: "#2a2a36", boots: "#2a1c16", hat: "cap", cap: ["#f6f3ea", "#ffc93c", "#d62f3a", TEAL][v % 4], skin: SK[v % 5] });
const RH = (o = {}) => ({ col: "#8f97a3", ...o });

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
const rhino = (x, y, s, T, o = {}) => P.rhino(g, x, y, s, { blink: ((T + 0.3) % 2.9) < 0.12 ? 1 : 0, ear: Math.max(0, Math.sin(T * 5)) * (((T * 0.7) % 2) < 0.5 ? 1 : 0), ...RH(o) });
/** held objects for pose "hold"/"give" (character space, u = 1 % of the head width) */
const HOLD = {
  ballot: (rot = -0.1, mark = 1) => (gg, x, y, u) => P.ballot(gg, x + 6 * u, y - 8 * u, 60 * u, rot, "CACARECO", mark),
  paper: (head = "RHINO!", line = "") => (gg, x, y, u) => P.newspaper(gg, x, y - 20 * u, 62 * u, 0.04, head, line),
  sign: (txt, col = CORAL) => (gg, x, y, u) => { gg.save(); gg.beginPath(); gg.rect(x - 3 * u, y - 120 * u, 6 * u, 120 * u); gg.fillStyle = "#8a5a34"; gg.fill(); gg.lineWidth = 2 * u; gg.strokeStyle = P.INK; gg.stroke();
    gg.beginPath(); gg.rect(x - 46 * u, y - 150 * u, 92 * u, 50 * u); gg.fillStyle = col; gg.fill(); gg.lineWidth = 3 * u; gg.stroke();
    gg.fillStyle = "#fff"; gg.font = `900 ${17 * u}px Montserrat`; gg.textAlign = "center"; gg.textBaseline = "middle"; gg.fillText(txt, x, y - 124 * u); gg.restore(); },
  mic: (gg, x, y, u) => { gg.beginPath(); gg.roundRect(x - 4 * u, y - 10 * u, 8 * u, 30 * u, 3 * u); gg.fillStyle = "#3a3440"; gg.fill(); gg.beginPath(); gg.arc(x, y - 16 * u, 10 * u, 0, Math.PI * 2); gg.fillStyle = "#c9ccd2"; gg.fill(); gg.lineWidth = 2.5 * u; gg.strokeStyle = P.INK; gg.stroke(); },
  megaphone: (gg, x, y, u) => { gg.save(); gg.translate(x, y); gg.rotate(-0.25); gg.beginPath(); gg.moveTo(-8 * u, -8 * u); gg.lineTo(40 * u, -26 * u); gg.lineTo(40 * u, 26 * u); gg.lineTo(-8 * u, 8 * u); gg.closePath(); gg.fillStyle = SUN; gg.fill(); gg.lineWidth = 2.5 * u; gg.strokeStyle = P.INK; gg.stroke();
    gg.beginPath(); gg.ellipse(40 * u, 0, 6 * u, 26 * u, 0, 0, Math.PI * 2); gg.fillStyle = "#e0a020"; gg.fill(); gg.stroke(); gg.restore(); },
  stamp: (gg, x, y, u) => { gg.beginPath(); gg.rect(x - 22 * u, y - 4 * u, 44 * u, 14 * u); gg.fillStyle = "#d62f3a"; gg.fill(); gg.lineWidth = 2.5 * u; gg.strokeStyle = P.INK; gg.stroke(); gg.beginPath(); gg.roundRect(x - 6 * u, y - 34 * u, 12 * u, 30 * u, 5 * u); gg.fillStyle = "#6b3a24"; gg.fill(); gg.stroke(); },
};

// ---------------- timing ----------------
const segs = window.SEGS;
export const DUR = window.DUR;
for (const s of segs) {
  const ws = s.text.split(/\s+/), weights = ws.map((w) => w.replace(/[^A-Za-z0-9]/g, "").length + 1.5 + (/[.,]$/.test(w) ? 2 : 0));
  const tot = weights.reduce((a, b) => a + b, 0); let t = s.start;
  s.words = ws.map((w, i) => { const d = ((s.end - s.start) * weights[i]) / tot; const o = { w, t0: t, t1: t + d }; t += d; return o; });
}
/** start time of the nth occurrence (whole script) of an exact word (accents stripped, punctuation ignored) */
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
const tone = (key, a) => {
  screen();
  const c = { golden: "rgba(255,140,40,", night: "rgba(30,50,140,", sepia: "rgba(150,100,40,", cold: "rgba(80,130,220,", warm: "rgba(255,120,90," }[key];
  if (!c) return;
  g.globalCompositeOperation = key === "sepia" ? "color" : "multiply"; g.fillStyle = c + a + ")"; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "source-over";
};
function sweat(x, y, s, T) {
  const dy = ((T * 1.5) % 1) * 60 * s;
  g.beginPath(); g.moveTo(x, y + dy - 30 * s); g.quadraticCurveTo(x + 18 * s, y + dy, x, y + dy + 14 * s); g.quadraticCurveTo(x - 18 * s, y + dy, x, y + dy - 30 * s);
  g.fillStyle = "#9fdcff"; g.fill(); g.lineWidth = 4 * s; g.strokeStyle = P.INK; g.stroke();
}
function angry(x, y, s, T) { // anger vein
  const k = s * (1 + 0.15 * Math.sin(T * 14));
  g.save(); g.translate(x, y); g.scale(k, k); g.strokeStyle = "#e0303a"; g.lineWidth = 12; g.lineCap = "round";
  for (let i = 0; i < 4; i++) { g.save(); g.rotate((i * Math.PI) / 2); g.beginPath(); g.moveTo(10, 10); g.quadraticCurveTo(30, 10, 34, 34); g.stroke(); g.restore(); } g.restore();
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
function confetti(T, n = 60, t0 = 0) {
  screen(); const cols = [CORAL, TEAL, SUN, "#ffffff", "#9b7fd0"];
  for (let i = 0; i < n; i++) {
    const k = (T - t0) * (0.35 + rnd(i, 1) * 0.4) + rnd(i, 2), y = (k % 1) * (H + 200) - 100, x = rnd(i, 3) * W + 40 * Math.sin(T * 3 + i);
    g.save(); g.translate(x, y); g.rotate(T * 5 + i); g.scale(1, Math.abs(Math.sin(T * 6 + i)) + 0.2); g.fillStyle = cols[i % 5]; g.fillRect(-12, -7, 24, 14); g.restore();
  }
}
function qmark(x, y, s, T, col = SUN) {
  g.save(); g.translate(x, y + 8 * Math.sin(T * 5)); g.rotate(0.08 * Math.sin(T * 3)); g.scale(s, s);
  g.font = "900 200px Montserrat"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round"; g.lineWidth = 22; g.strokeStyle = "#111"; g.strokeText("?", 0, 0); g.fillStyle = col; g.fillText("?", 0, 0); g.restore();
}
function bigNum(n, col, label, pop = 1, y = 330) {
  screen(); g.save(); g.translate(W / 2, y); const k = clamp(pop, 0, 1.3); g.scale(k, k);
  g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
  g.font = "900 170px Montserrat"; g.lineWidth = 26; g.strokeStyle = "#111"; const s = typeof n === "number" ? n.toLocaleString("en-US") : n;
  g.strokeText(s, 0, 0); g.fillStyle = col; g.fillText(s, 0, 0);
  g.font = "900 64px Montserrat"; g.lineWidth = 16; g.strokeText(label, 0, 120); g.fillStyle = "#fff"; g.fillText(label, 0, 120);
  g.restore();
}
function tag(txt, x, y, col, k = 1, size = 60) {
  if (k <= 0) return;
  g.save(); g.translate(x, y); g.scale(k, k); g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
  g.font = `900 ${size}px Montserrat`; g.lineWidth = size / 3.7; g.strokeStyle = "#111"; g.strokeText(txt, 0, 0); g.fillStyle = col; g.fillText(txt, 0, 0); g.restore();
}
/** campaign-placard label (new for this story): rounded board, cream border, a star on each side */
function placard(txt, y, pop, bg = CORAL, rot = -0.035, fg = CREAM) {
  if (pop <= 0) return; screen(); g.save(); g.translate(W / 2, y); g.rotate(rot + 0.02 * Math.sin(pop * 8)); const k = clamp(pop, 0, 1.3); g.scale(k, k);
  g.font = "900 84px Montserrat"; g.textAlign = "center"; g.textBaseline = "middle";
  const w = g.measureText(txt).width + 190;
  g.beginPath(); g.roundRect(-w / 2, -76, w, 152, 30); g.fillStyle = bg; g.fill(); g.lineWidth = 12; g.strokeStyle = "#111"; g.stroke();
  g.beginPath(); g.roundRect(-w / 2 + 16, -60, w - 32, 120, 20); g.lineWidth = 6; g.strokeStyle = fg; g.stroke();
  for (const sx of [-1, 1]) star(sx * (w / 2 - 55), 0, 26, fg);
  g.fillStyle = fg; g.fillText(txt, 0, 6); g.restore();
}
function star(x, y, r, col) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fillStyle = col; g.fill(); }
const pin = (x, y, k, col = CORAL) => { if (k <= 0) return; g.save(); g.translate(x, y); g.scale(k, k); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-40, -50, -40, -95, 0, -95); g.bezierCurveTo(40, -95, 40, -50, 0, 0); g.fillStyle = col; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke(); g.beginPath(); g.arc(0, -62, 14, 0, Math.PI * 2); g.fillStyle = "#fff"; g.fill(); g.restore(); };
function bulb(x, y, s, on, T) {
  g.save(); g.translate(x, y); g.scale(s, s);
  if (on) { for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + T; g.beginPath(); g.moveTo(Math.cos(a) * 110, Math.sin(a) * 110); g.lineTo(Math.cos(a) * 150, Math.sin(a) * 150); g.lineWidth = 10; g.strokeStyle = SUN; g.stroke(); } }
  g.beginPath(); g.arc(0, 0, 80, 0, Math.PI * 2); g.fillStyle = on ? "#fff3a0" : "#d8d8d8"; g.fill(); g.lineWidth = 8; g.strokeStyle = P.INK; g.stroke();
  g.beginPath(); g.rect(-36, 70, 72, 50); g.fillStyle = "#9aa0a8"; g.fill(); g.stroke(); g.restore();
}
function chair(x, y, s, col = "#9a5a34", seat = TEAL) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.beginPath(); g.roundRect(-50, -190, 100, 110, 16); g.fillStyle = seat; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke();
  g.beginPath(); g.roundRect(-60, -90, 120, 30, 8); g.fillStyle = seat; g.fill(); g.stroke();
  for (const lx of [-50, 42]) { g.beginPath(); g.rect(lx, -60, 8, 60); g.fillStyle = col; g.fill(); g.stroke(); }
  g.restore();
}
function brFlag(x, y, w, T = 0) { // Brazil flag (simplified) on a pole
  const h = w * 0.7, wv = (k) => 8 * Math.sin(T * 3 + k * 4);
  g.beginPath(); g.rect(x - 6, y - 40, 12, h * 2.4); g.fillStyle = "#c9ccd2"; g.fill(); g.lineWidth = 4; g.strokeStyle = P.INK; g.stroke();
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + wv(1)); g.lineTo(x + w, y + h + wv(1)); g.lineTo(x, y + h); g.closePath(); g.fillStyle = "#2e9e4f"; g.fill(); g.lineWidth = 5; g.stroke();
  g.beginPath(); g.moveTo(x + w * 0.08, y + h / 2 + wv(0.1)); g.lineTo(x + w / 2, y + h * 0.1 + wv(0.5)); g.lineTo(x + w * 0.92, y + h / 2 + wv(0.9)); g.lineTo(x + w / 2, y + h * 0.9 + wv(0.5)); g.closePath(); g.fillStyle = SUN; g.fill();
  g.beginPath(); g.arc(x + w / 2, y + h / 2 + wv(0.5), h * 0.22, 0, Math.PI * 2); g.fillStyle = "#24408e"; g.fill();
}
function qcFlag(x, y, w, T = 0) { // Quebec flag (simplified)
  const h = w * 0.66;
  g.beginPath(); g.rect(x - 6, y - 40, 12, h * 2.6); g.fillStyle = "#c9ccd2"; g.fill(); g.lineWidth = 4; g.strokeStyle = P.INK; g.stroke();
  g.save(); g.translate(x, y); g.transform(1, 0.03 * Math.sin(T * 3), 0, 1, 0, 0);
  g.beginPath(); g.rect(0, 0, w, h); g.fillStyle = "#1d5fb3"; g.fill(); g.lineWidth = 5; g.stroke();
  g.fillStyle = "#fff"; g.fillRect(w / 2 - w * 0.06, 0, w * 0.12, h); g.fillRect(0, h / 2 - w * 0.06, w, w * 0.12);
  [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]].forEach(([a, b]) => P.fleur(g, w * a, h * b + w * 0.02, w * 0.14));
  g.restore();
}
function podium(x, y, w, label, col = TEAL) {
  g.beginPath(); g.moveTo(x - w / 2, y - w * 0.9); g.lineTo(x + w / 2, y - w * 0.9); g.lineTo(x + w * 0.4, y); g.lineTo(x - w * 0.4, y); g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
  g.beginPath(); g.rect(x - w * 0.55, y - w * 0.98, w * 1.1, w * 0.1); g.fillStyle = P.shadeHex(col, 0.8); g.fill(); g.stroke();
  if (label) { star(x, y - w * 0.55, w * 0.16, CREAM); tag(label, x, y - w * 0.25, CREAM, 1, w * 0.12); }
}
function crowd(T, y, n, s, seed = 0, expr = "grin", wave = true) {
  for (let i = 0; i < n; i++) { const x = -60 + (i + 0.5) * (1200 / n) + (rnd(i, seed) - 0.5) * 40, yy = y + (i % 2) * 40, j = Math.abs(Math.sin(T * 6 + i)) * 18;
    ch(x, yy - j, s, FOLK(i + seed), { expr: typeof expr === "function" ? expr(i) : expr, wave: wave ? Math.sin(T * 8 + i) : undefined }, i % 2 ? -1 : 1, T, 200 + i + seed); }
}
function donkeyEars(x, y, s, T) { // two grey donkey ears over a politician's head
  for (const sx of [-1, 1]) { g.save(); g.translate(x + sx * 40 * s, y); g.rotate(sx * (0.35 + 0.08 * Math.sin(T * 6 + sx))); g.beginPath(); g.ellipse(0, -90 * s, 30 * s, 95 * s, 0, 0, Math.PI * 2); g.fillStyle = "#9a9aa6"; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke();
    g.beginPath(); g.ellipse(0, -90 * s, 14 * s, 66 * s, 0, 0, Math.PI * 2); g.fillStyle = "#e7a9a0"; g.fill(); g.restore(); }
}

// ---------------- backdrops ----------------
function city(T, base = 1250, sky = "day", tram = false) {
  P.sky(g, W, H, sky); P.cloud(g, 120 + T * 12, 300, 1.2, "#fff8ea"); P.cloud(g, 780 - T * 9, 470, 1.5, "#fff8ea");
  P.skyline50s(g, base, T, 3);
  P.palm(g, 60, base + 40, 520, T); P.palm(g, 980, base + 60, 600, T + 2);
  P.ground(g, -3000, 4000, base, "#c9c2b6"); g.fillStyle = "#e8dfcc"; g.fillRect(-3000, base, 7000, 70);
  g.fillStyle = "#8a8f98"; g.fillRect(-3000, base + 70, 7000, 2000);
  g.strokeStyle = "#f6f3ea"; g.lineWidth = 12; g.setLineDash([60, 50]); g.beginPath(); g.moveTo(-3000, base + 330); g.lineTo(4000, base + 330); g.stroke(); g.setLineDash([]);
  if (tram) P.bonde(g, ((T * 260) % 2200) - 500, base + 260, 1.0, TEAL);
}
function chamber(T) {
  g.fillStyle = "#e9dcc0"; g.fillRect(-900, -400, 2900, 2800);
  for (let i = 0; i < 7; i++) { g.beginPath(); g.rect(-200 + i * 220, 0, 150, 1100); g.fillStyle = "#c9a878"; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke(); }
  g.fillStyle = "#8a5a34"; g.fillRect(-900, 1100, 2900, 60);
  brFlag(820, 260, 200, T);
  g.fillStyle = "#6b3a24"; g.fillRect(-900, 1160, 2900, 1400);
}
function newsroom(T) {
  g.fillStyle = "#cfe8e2"; g.fillRect(-900, -400, 2900, 2800);
  g.save(); g.beginPath(); g.rect(560, 250, 440, 640); g.clip(); P.sky(g, W, H, "day"); P.skyline50s(g, 900, T, 8); g.restore();
  g.beginPath(); g.rect(560, 250, 440, 640); g.lineWidth = 16; g.strokeStyle = "#8a5a34"; g.stroke(); g.lineWidth = 8; g.beginPath(); g.moveTo(780, 250); g.lineTo(780, 890); g.moveTo(560, 570); g.lineTo(1000, 570); g.stroke();
  [[120, 360, -0.08, "CRATERS!"], [330, 420, 0.06, "FLOODS!"]].forEach(([x, y, r, h]) => P.newspaper(g, x, y, 170, r, h, "", "A GAZETA"));
  g.fillStyle = "#b89068"; g.fillRect(-900, 1350, 2900, 1200);
}
function zoo(T) {
  P.sky(g, W, H, "day"); P.cloud(g, 200 + T * 8, 280, 1.3); P.cloud(g, 760 - T * 6, 420, 1.0);
  P.hills(g, -2000, 3000, 980, 70, "#7fc48a", 1.4);
  for (let i = 0; i < 5; i++) P.palm(g, -40 + i * 270, 1050 + (i % 2) * 30, 480 + (i % 3) * 80, T + i, i % 2 ? LEAF : "#2f8a4a");
  P.ground(g, -3000, 4000, 1050, "#b8d68a");
  g.beginPath(); g.ellipse(540, 1560, 620, 220, 0, 0, Math.PI * 2); g.fillStyle = "#a8865a"; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
}
function fence(y, x0 = -100, x1 = 1200) { g.strokeStyle = P.INK; for (let x = x0; x <= x1; x += 70) { g.beginPath(); g.rect(x - 9, y - 230, 18, 230); g.fillStyle = "#8a5a34"; g.fill(); g.lineWidth = 5; g.stroke(); }
  g.beginPath(); g.rect(x0, y - 200, x1 - x0, 18); g.fillStyle = "#9a6a3e"; g.fill(); g.stroke(); g.beginPath(); g.rect(x0, y - 90, x1 - x0, 18); g.fill(); g.stroke(); }
function hall(T) {
  g.fillStyle = "#f3e6c8"; g.fillRect(-900, -400, 2900, 2800);
  g.fillStyle = "#9fd3c7"; g.fillRect(-900, 900, 2900, 450);
  g.save(); g.translate(540, 300); g.rotate(-0.02); g.beginPath(); g.roundRect(-360, -70, 720, 140, 20); g.fillStyle = NAVY; g.fill(); g.lineWidth = 8; g.strokeStyle = P.INK; g.stroke();
  g.fillStyle = SUN; g.font = "900 78px Montserrat"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("ELEIÇÕES 1959", 0, 6); g.restore();
  for (let i = 0; i < 7; i++) { const x = 60 + i * 160; g.beginPath(); g.moveTo(x, 420); g.lineTo(x + 40, 470 + 10 * Math.sin(T * 3 + i)); g.lineTo(x + 80, 420); g.closePath(); g.fillStyle = [CORAL, TEAL, SUN][i % 3]; g.fill(); g.lineWidth = 4; g.strokeStyle = P.INK; g.stroke(); }
  g.fillStyle = "#b8865a"; g.fillRect(-900, 1350, 2900, 1200);
}
function snowy(T) {
  P.sky(g, W, H, "night");
  for (let i = 0; i < 4; i++) { const x = -60 + i * 300, h = 520 + (i % 2) * 120, c = ["#c8d6e8", "#e8c9b0", "#d6e0c8", "#e0c8d6"][i];
    g.beginPath(); g.rect(x, 1250 - h, 260, h); g.fillStyle = c; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke();
    g.beginPath(); g.moveTo(x - 20, 1250 - h); g.lineTo(x + 130, 1250 - h - 200); g.lineTo(x + 280, 1250 - h); g.closePath(); g.fillStyle = "#5a6b8a"; g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x - 20, 1250 - h); g.lineTo(x + 130, 1250 - h - 200); g.lineTo(x + 280, 1250 - h); g.lineTo(x + 230, 1250 - h - 30); g.lineTo(x + 130, 1250 - h - 150); g.lineTo(x + 30, 1250 - h - 30); g.closePath(); g.fillStyle = "#ffffff"; g.fill();
    for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) { g.beginPath(); g.rect(x + 40 + k * 110, 1250 - h + 60 + r * 150, 70, 90); g.fillStyle = (r + k + i) % 3 ? "#ffe08a" : "#3a4a6a"; g.fill(); g.lineWidth = 4; g.stroke(); } }
  P.ground(g, -3000, 4000, 1250, "#eef4ff");
  snow(T);
}
function snow(T) { g.fillStyle = "#ffffff"; for (let i = 0; i < 70; i++) { const y = ((T * (60 + rnd(i, 1) * 80) + rnd(i, 2) * 2000) % 2000) - 40, x = rnd(i, 3) * 1080 + 30 * Math.sin(T + i); g.beginPath(); g.arc(x, y, 4 + rnd(i, 4) * 7, 0, Math.PI * 2); g.fill(); } }
function stage(T) {
  g.fillStyle = "#2a1f3a"; g.fillRect(-900, -400, 2900, 2800);
  const gr = g.createRadialGradient(540, 700, 60, 540, 800, 900); gr.addColorStop(0, "rgba(255,230,160,0.35)"); gr.addColorStop(1, "rgba(255,230,160,0)"); g.fillStyle = gr; g.fillRect(-400, -200, 1900, 2200);
  g.save(); g.translate(540, 330); g.beginPath(); g.roundRect(-470, -150, 940, 300, 26); g.fillStyle = "#1d5fb3"; g.fill(); g.lineWidth = 10; g.strokeStyle = P.INK; g.stroke();
  g.fillStyle = "#fff"; g.font = "900 74px Montserrat"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("RHINOCEROS", 70, -40); g.fillText("PARTY", 70, 50); g.restore();
  P.rhino(g, 175, 430, 0.34, { expr: "happy", col: "#c9ccd8" });
  g.fillStyle = "#6b3a54"; g.fillRect(-900, 1350, 2900, 1200);
  qcFlag(40, 620, 160, T); qcFlag(880, 620, 160, T + 1);
}

// scoreboard: bars rising; idx of the rhino bar gets the rhino head
function scoreboard(T, k, rhinoK, labels = ["A", "B", "C", "D"], rhinoAt = 3) {
  g.beginPath(); g.roundRect(80, 560, 920, 900, 30); g.fillStyle = NAVY; g.fill(); g.lineWidth = 10; g.strokeStyle = P.INK; g.stroke();
  g.strokeStyle = "rgba(255,255,255,0.15)"; g.lineWidth = 4; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(120, 1380 - i * 140); g.lineTo(960, 1380 - i * 140); g.stroke(); }
  labels.forEach((lb, i) => {
    const x = 180 + i * 210, hh = i === rhinoAt ? lerp(40, 760, rhinoK) : lerp(20, [260, 340, 220, 300][i] * 0.9, k);
    g.beginPath(); g.rect(x - 60, 1380 - hh, 120, hh); g.fillStyle = i === rhinoAt ? CORAL : ["#9fd3c7", SUN, "#b7c7e8", "#e8e1cf"][i]; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke();
    tag(lb, x, 1420, "#fff", 0.8, 50);
    if (i === rhinoAt && rhinoK > 0.2) P.rhino(g, x + 10, 1380 - hh - 4, 0.22, { expr: "proud", col: "#8f97a3" });
  });
}
function printer(x, y, T) {
  g.beginPath(); g.roundRect(x - 230, y - 380, 460, 380, 30); g.fillStyle = "#4a5a6a"; g.fill(); g.lineWidth = 8; g.strokeStyle = P.INK; g.stroke();
  for (const [cx, r] of [[x - 90, 90], [x + 90, 90]]) { g.save(); g.translate(cx, y - 230); g.rotate(T * 8); g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fillStyle = "#9aa6b2"; g.fill(); g.lineWidth = 7; g.stroke();
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(i) * r, Math.sin(i) * r); g.lineWidth = 5; g.stroke(); } g.restore(); }
}
function globe(T) {
  g.beginPath(); g.arc(540, 1000, 470, 0, Math.PI * 2); g.fillStyle = "#5fb8d8"; g.fill(); g.lineWidth = 10; g.strokeStyle = P.INK; g.stroke();
  g.save(); g.beginPath(); g.arc(540, 1000, 465, 0, Math.PI * 2); g.clip();
  const land = (pts, c) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fillStyle = c; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke(); };
  land([[250, 560], [420, 520], [640, 540], [720, 640], [640, 720], [560, 820], [470, 880], [420, 840], [330, 760], [260, 680]], "#9fd08a"); // North America
  land([[560, 1000], [680, 1000], [800, 1080], [780, 1200], [700, 1300], [640, 1420], [600, 1440], [580, 1320], [540, 1180], [520, 1080]], "#9fd08a"); // South America
  g.restore();
}
function calendar(x, y, s, year, flip) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.beginPath(); g.roundRect(-200, -230, 400, 460, 24); g.fillStyle = "#fffdf4"; g.fill(); g.lineWidth = 9; g.strokeStyle = P.INK; g.stroke();
  g.beginPath(); g.roundRect(-200, -230, 400, 120, [24, 24, 0, 0]); g.fillStyle = CORAL; g.fill(); g.stroke();
  for (const rx of [-110, 110]) { g.beginPath(); g.roundRect(rx - 12, -270, 24, 80, 10); g.fillStyle = "#c9ccd2"; g.fill(); g.stroke(); }
  g.fillStyle = P.INK; g.font = "900 130px Montserrat"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(year), 0, 50);
  if (flip > 0) { g.save(); g.transform(1, 0, 0, 1 - flip, 0, -230 * flip); g.beginPath(); g.rect(-200, -110, 400, 340); g.fillStyle = "#f1ead8"; g.fill(); g.lineWidth = 6; g.stroke(); g.restore(); }
  g.restore();
}

// ---------------- shots: [start (s), fn(t in shot, shot length, global T)] ----------------
const SHOTS = [
  [0, (t, d, T) => { // "In nineteen fifty-nine," — a spinning newsreel paper lands
    screen(); const gr = g.createRadialGradient(540, 900, 80, 540, 900, 1100); gr.addColorStop(0, "#ffe7a8"); gr.addColorStop(1, CORAL); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    cam(540, 960, lerp(1.0, 1.08, ss(t / d)), 0, T);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + T * 0.3; g.beginPath(); g.moveTo(540, 960); g.arc(540, 960, 1600, a, a + 0.1); g.closePath(); g.fillStyle = "rgba(255,255,255,0.16)"; g.fill(); }
    const k = easeOut(t / 0.9);
    P.newspaper(g, 540, 980, lerp(80, 640, k), (1 - k) * 9, "1959", "SÃO PAULO VOTES", "A GAZETA");
  }],
  [T_("sao"), (t, d, T) => { // "São Paulo's" — the 1950s city
    cam(540, 1000, lerp(1.0, 1.06, ss(t / d)), 0, T); city(T, 1250, "day", true);
    for (let i = 0; i < 9; i++) { const k = (T * 0.5 + rnd(i, 1)) % 1; P.ballot(g, 100 + rnd(i, 2) * 880, -80 + k * 1400, 110, T * 2 + i, "", 0); }
    screen(); tag("SÃO PAULO", 540, 330, SUN, back((t - 0.05) / 0.25) * 1.6);
  }],
  [T_("top"), (t, d, T) => { // "top vote-getter..."
    screen(); g.fillStyle = "#23305e"; g.fillRect(0, 0, W, H);
    cam(540, 1000, lerp(1.0, 1.05, ss(t / d)), 0, T);
    scoreboard(T, ss(t / 0.8), 0.05 + 0.25 * ss(t / d), ["?", "?", "?", "?"], 9);
    qmark(860 + 0 * t, 470, 0.7, T);
    placard("TOP VOTE-GETTER", 330, back((t - 0.1) / 0.3), TEAL);
  }],
  [T_("was", 0), (t, d, T) => { // "was a rhinoceros." — the reveal
    P.sky(g, W, H, "golden"); shakeAmt = t > 0.42 && t < 0.8 ? 9 : 0; cam(540, 1050, lerp(1.12, 1.0, easeOut(t / 0.6)), 0, T);
    city(T, 1250, "golden");
    const up = back((t - 0.22) / 0.4);
    if (up > 0.5) P.burst(g, 540, 1050, 120, 760, ((t - 0.4) * 0.8) % 1, "#fff3b0", 16);
    // the rhino rises from behind the podium (drawn first, so the podium hides its lower half until it stands on top)
    if (up > 0) { g.save(); g.beginPath(); g.rect(-500, -500, 2100, 1752); g.clip(); rhino(540, lerp(1900, 1240, clamp(up, 0, 1.1)), 1.1, T, { expr: t > 0.5 ? "proud" : "shock", sash: CORAL, headUp: 0.08 * Math.sin(T * 4) }); g.restore(); }
    podium(540, 1640, 420, "", CORAL);
    crowd(T, 1900, 6, 0.55, 3, "grin");
    if (t > 0.42) confetti(T, 70, 3.8);
    placard("RHINOCEROS!", 330, back((T - 3.86) / 0.3), CORAL);
  }],
  [SEG(1), (t, d, T) => { // "Her name was Cacareco," — close-up wink
    P.sky(g, W, H, "day"); cam(540, 1000, lerp(1.0, 1.1, ss(t / d)), 0, T); zoo(T);
    rhino(380, 1650, 2.1, T, { expr: T > 5.85 && T < 6.3 ? "wink" : "happy", ear: Math.max(0, Math.sin(T * 6)) });
    sparkle(820, 760, 120, T);
    placard("CACARECO", 1720, back((T - 5.83) / 0.3), TEAL, 0.03);
  }],
  [T_("and", 0), (t, d, T) => { // "and about a hundred thousand" — counter + ballots pour into the box
    screen(); g.fillStyle = "#f6e7c8"; g.fillRect(0, 0, W, H);
    cam(540, 1050, lerp(1.0, 1.08, ss(t / d)), 0, T);
    for (let i = 0; i < 14; i++) { const k = (T * 1.4 + rnd(i, 1)) % 1; P.ballot(g, 540 + (rnd(i, 2) - 0.5) * 500 * (1 - k), lerp(500, 1250, k), 140, T * 3 + i, "CACARECO", 1); }
    P.ballotBox(g, 540, 1700, 520, "VOTOS", "#b5793f");
    bigNum(Math.round(lerp(0, 100000, easeOut((T - 6.9) / 1.0)) / 100) * 100, CORAL, "VOTES", 1, 380);
  }],
  [T_("people"), (t, d, T) => { // "people voted for her." — a queue of voters hands in ballots
    cam(540, 1050, lerp(1.0, 1.05, ss(t / d)), 0, T); hall(T);
    P.ballotBox(g, 830, 1500, 300, "VOTOS");
    const k = (T * 1.6) % 1;
    ch(560, 1820, 0.8, LADY, { expr: "grin", pose: "give", pointUp: 0.15, held: HOLD.ballot(0.2) }, 1, T, 11);
    for (let i = 0; i < 4; i++) ch(330 - i * 150, 1800 + (i % 2) * 30, 0.7, FOLK(i + 2), { expr: talk(T, "smile", "grin", i), pose: "hold", held: HOLD.ballot(-0.1) }, 1, T, 12 + i);
    if (k < 0.5) P.ballot(g, 830 + 10 * Math.sin(T * 9), lerp(1150, 1240, k * 2), 110, 0.3, "CACARECO", 1);
    screen(); tag("VOTED!", 540, 640, CORAL, back((T - 8.36) / 0.25) * 1.5);
  }],
  [SEG(2), (t, d, T) => { // "Let's rewind." — VHS rewind (new transition)
    const back_ = t * 3.5; // play the cold open backwards
    cam(540, 1050, 1.0, 0, T); city(9.6 - back_, 1250, "golden");
    rhino(540, lerp(1240, 1900, clamp(t / 0.9, 0, 1)), 1.1, 9.6 - back_, { expr: "shock", sash: CORAL });
    screen(); g.globalCompositeOperation = "multiply"; g.fillStyle = "rgba(110,140,200,0.55)"; g.fillRect(0, 0, W, H); g.globalCompositeOperation = "source-over";
    for (let i = 0; i < 6; i++) { const y = ((T * 900 + i * 330) % (H + 200)) - 100; g.fillStyle = "rgba(255,255,255,0.22)"; g.fillRect(0, y, W, 26 + rnd(i, 1) * 30); }
    g.fillStyle = "rgba(0,0,0,0.12)"; for (let y = 0; y < H; y += 8) g.fillRect(0, y, W, 3);
    speedLines(T, 10, "rgba(255,255,255,0.5)", -1);
    tag("◀◀ REWIND", 300, 220, "#ffffff", 1, 74); tag("1959", 880, 220, SUN, 1, 60);
  }],
  [SEG(3), (t, d, T) => { // "São Paulo's streets were full of holes," — a man steps into a pothole
    cam(540, 1250, lerp(1.0, 1.08, ss(t / d)), 0, T); city(T, 1150, "day", true);
    P.pothole(g, 330, 1650, 220, T); P.pothole(g, 860, 1500, 150, T + 0.3); P.pothole(g, 700, 1800, 120, T + 0.6);
    const drop = clamp((t - 1.0) / 0.25, 0, 1);
    ch(lerp(120, 320, clamp(t / 1.0, 0, 1)), 1680 + 120 * drop, 0.75, OLDMAN, { expr: drop > 0 ? "shock" : "whistle", mode: drop > 0 ? "stand" : "stroll", phase: T * 1.8 }, 1, T, 21);
    if (drop > 0) { P.puff(g, 330, 1640, 120, 0.8 * (1 - (t - 1.0)), "#9fd8ff"); P.burst(g, 330, 1600, 60, 220, clamp((t - 1.0) * 1.5, 0, 1), "#bfe8ff", 10); }
    screen(); placard("HOLES", 330, back((T - 12.66) / 0.3), "#8a5a34");
  }],
  [T_("and", 1), (t, d, T) => { // "and its sewers overflowed." — manhole geyser
    shakeAmt = t > 0.3 && t < 0.9 ? 7 : 0; cam(540, 1150, lerp(1.05, 1.12, ss(t / d)), 0, T); city(T, 1150, "day");
    const up = clamp((t - 0.25) / 0.4, 0, 1);
    g.save(); g.translate(560, 1600 - 420 * back(up)); g.rotate(T * 6 * up); g.beginPath(); g.ellipse(0, 0, 130, 46, 0, 0, Math.PI * 2); g.fillStyle = "#5a5f6a"; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke(); g.restore();
    if (up > 0) { for (let i = 0; i < 24; i++) { const k = (T * 1.6 + rnd(i, 1)) % 1, a = -Math.PI / 2 + (rnd(i, 2) - 0.5) * 1.1; g.beginPath(); g.arc(560 + Math.cos(a) * 700 * k, 1640 + Math.sin(a) * 900 * k + 900 * k * k, 26 * (1 - k) + 8, 0, Math.PI * 2); g.fillStyle = "#7fb4c8"; g.fill(); }
      g.beginPath(); g.moveTo(500, 1660); g.quadraticCurveTo(540, 1300 - 60 * Math.sin(T * 9), 560, 1150 * up + 1660 * (1 - up)); g.quadraticCurveTo(580, 1300 + 60 * Math.sin(T * 9), 620, 1660); g.closePath(); g.fillStyle = "#8fc4d8"; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke(); }
    g.beginPath(); g.ellipse(560, 1670, 160, 50, 0, 0, Math.PI * 2); g.fillStyle = "#2a2a30"; g.fill();
    face(880, 1300, 0.95, LADY, { expr: up > 0.3 ? "shock" : "neutral", look: -1, facing: -1 }, -1, T, 22);
    if (up > 0.3) sweat(990, 1330, 1.1, T);
    screen(); placard("SEWERS", 330, back((T - 13.54) / 0.3), "#3f7f9a");
  }],
  [SEG(4), (t, d, T) => { // "Five hundred and forty candidates" — a wall of election posters
    screen(); g.fillStyle = "#e9dcc0"; g.fillRect(0, 0, W, H);
    cam(540, 1000, lerp(1.0, 1.2, ss(t / d)), 0, T);
    const n = Math.min(48, Math.floor(t * 26) + 1);
    for (let i = 0; i < n; i++) { const x = 90 + (i % 6) * 180, y = 620 + Math.floor(i / 6) * 200, k = back((t - i / 26) / 0.15);
      g.save(); g.translate(x, y); g.rotate((rnd(i, 1) - 0.5) * 0.2); g.scale(k, k);
      g.beginPath(); g.rect(-75, -90, 150, 180); g.fillStyle = [CREAM, "#ffd9cf", "#d6f0ea", "#fff0b8"][i % 4]; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke();
      g.beginPath(); g.arc(0, -20, 42, 0, Math.PI * 2); g.fillStyle = SK[i % 6]; g.fill(); g.stroke();
      g.beginPath(); g.arc(-14, -26, 5, 0, Math.PI * 2); g.arc(14, -26, 5, 0, Math.PI * 2); g.fillStyle = P.INK; g.fill();
      g.beginPath(); g.arc(0, -10, 16, 0.2, Math.PI - 0.2); g.lineWidth = 4; g.stroke();
      g.fillStyle = [CORAL, TEAL, NAVY][i % 3]; g.fillRect(-60, 46, 120, 26); g.restore(); }
    bigNum(Math.min(540, Math.round(lerp(0, 540, easeOut((T - 15.2) / 1.1)))), SUN, "CANDIDATES", 1, 330);
  }],
  [T_("fighting"), (t, d, T) => { // "were fighting for just forty-five seats." — musical chairs in the council
    shakeAmt = 4; cam(540, 1150, lerp(1.0, 1.06, ss(t / d)), 0, T); chamber(T);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 5; i++) chair(160 + i * 190, 1260 + r * 160, 0.9 - r * 0.0, "#6b3a24", [TEAL, CORAL, SUN][r]);
    for (let i = 0; i < 7; i++) { const a = T * 1.8 + (i / 7) * Math.PI * 2; ch(540 + Math.cos(a) * 420, 1800 + Math.sin(a) * 90, 0.55, POL(i), { expr: talk(T, "shout", "yell", i), mode: "march", phase: T * 2.4 + i }, Math.sin(a) > 0 ? -1 : 1, T, 30 + i); }
    speedLines(T, 6, "rgba(255,255,255,0.4)");
    if (T > 18.2) bigNum(45, CORAL, "SEATS", back((T - 18.2) / 0.3), 330);
  }],
  [SEG(5), (t, d, T) => { // "And voters were fed up with all of them."
    cam(540, 1000, lerp(1.0, 1.08, ss(t / d)), 0, T); chamber(T);
    for (let i = 0; i < 3; i++) ch(250 + i * 290, 1450, 0.55, POL(i + 1), { expr: talk(T, "talk", "grin", i), pose: i === 1 ? "point" : undefined, pointUp: 0.4 }, i === 2 ? -1 : 1, T, 40 + i);
    for (let i = 0; i < 3; i++) { const x = 250 + i * 290, k = back((t - 0.2 - i * 0.2) / 0.25); if (k > 0) { g.save(); g.translate(x + 60, 820); g.scale(k, k); g.beginPath(); g.ellipse(0, 0, 120, 60, 0, 0, Math.PI * 2); g.fillStyle = "#fff"; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke(); g.fillStyle = P.INK; g.font = "900 40px Montserrat"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("BLAH", 0, 2); g.restore(); } }
    face(540, 1300, 1.25, OLDMAN, { expr: t > 0.9 ? "stern" : "deadpan", look: 0 }, 1, T, 21);
    if (t > 0.9) angry(720, 1250, 1.2, T);
    screen(); placard("FED UP", 330, back((T - 20.32) / 0.3), "#8a3a3a");
  }],
  [SEG(6), (t, d, T) => { // "So a journalist had an idea:"
    cam(540, 1050, lerp(1.0, 1.06, ss(t / d)), 0, T); newsroom(T);
    ch(380, 1750, 1.0, JOURNO, { expr: T > 23.25 ? "grin" : "neutral", look: 1, pose: T > 23.25 ? "point" : "chin", pointUp: 0.7 }, 1, T, 50);
    // desk + typewriter
    g.beginPath(); g.rect(560, 1430, 520, 60); g.fillStyle = "#8a5a34"; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
    g.beginPath(); g.roundRect(640, 1260, 300, 170, 20); g.fillStyle = "#2f6b5a"; g.fill(); g.stroke();
    g.beginPath(); g.rect(680, 1160 - 10 * Math.abs(Math.sin(T * 10)), 220, 110); g.fillStyle = "#fffdf4"; g.fill(); g.lineWidth = 5; g.stroke();
    for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(680 + i * 45, 1380, 14, 0, Math.PI * 2); g.fillStyle = "#e8e1cf"; g.fill(); g.lineWidth = 4; g.stroke(); }
    bulb(420, 560, 0.9, T > 23.25, T);
    screen(); tag("JOURNALIST", 540, 330, SUN, back((T - 22.3) / 0.25) * 1.4);
  }],
  [T_("vote", 0), (t, d, T) => { // "vote for the star of the new zoo."
    P.sky(g, W, H, "day"); cam(540, 1100, lerp(1.08, 1.0, ss(t / d)), 0, T); zoo(T);
    // gate arch
    g.beginPath(); g.rect(90, 520, 70, 900); g.rect(920, 520, 70, 900); g.fillStyle = "#e8e1cf"; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
    g.beginPath(); g.roundRect(60, 430, 960, 180, 40); g.fillStyle = LEAF; g.fill(); g.stroke();
    g.fillStyle = CREAM; g.font = "900 110px Montserrat"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("ZOO", 540, 528);
    const sp = ss(t / 0.5); g.save(); g.globalAlpha = 0.35 * sp; g.beginPath(); g.moveTo(480, 610); g.lineTo(140, 1700); g.lineTo(940, 1700); g.lineTo(600, 610); g.closePath(); g.fillStyle = "#fff6c2"; g.fill(); g.restore();
    fence(1450, -100, 1200);
    rhino(560, 1520, 1.05, T, { expr: "happy", phase: T * 0.8 });
    star(540, 920, 90 * back((T - 24.27) / 0.3), SUN); sparkle(540, 1100, 260, T);
    screen(); if (T > 24.27) placard("STAR OF THE ZOO", 1760, back((T - 24.27) / 0.3), TEAL, 0.03);
  }],
  [SEG(7), (t, d, T) => { // "A five-year-old female rhino,"
    P.sky(g, W, H, "day"); cam(540, 1050, lerp(1.0, 1.08, ss(t / d)), 0, T); zoo(T);
    rhino(470, 1620, 1.6, T, { expr: "happy", ear: Math.max(0, Math.sin(T * 7)) });
    // pink bow on the ear = female
    const bk = back((T - 26.76) / 0.25); if (bk > 0) { g.save(); g.translate(640, 900); g.scale(bk, bk); g.rotate(-0.3); for (const s of [-1, 1]) { g.beginPath(); g.moveTo(0, 0); g.lineTo(s * 80, -50); g.lineTo(s * 80, 50); g.closePath(); g.fillStyle = "#ff8fb1"; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke(); } g.beginPath(); g.arc(0, 0, 24, 0, Math.PI * 2); g.fillStyle = "#ff8fb1"; g.fill(); g.stroke(); g.restore(); }
    bigNum(5, SUN, "YEARS OLD", back((T - 26.03) / 0.3), 360);
    screen(); tag("FEMALE", 760, 700, "#ff8fb1", bk * 1.2);
  }],
  [T_("loan") - 0.21, (t, d, T) => { // "on loan from Rio." — Rio -> São Paulo map
    screen(); g.fillStyle = "#7fc8e8"; g.fillRect(0, 0, W, H);
    cam(540, 1000, lerp(1.0, 1.1, ss(t / d)), 0, T);
    g.beginPath(); [[-100, 300], [700, 300], [900, 560], [960, 760], [760, 900], [560, 1040], [380, 1200], [260, 1500], [-100, 1600]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fillStyle = "#b8d68a"; g.fill(); g.lineWidth = 9; g.strokeStyle = P.INK; g.stroke();
    const rio = [720, 880], sp = [330, 1160], k = ss((t - 0.2) / 1.1);
    g.setLineDash([24, 18]); g.beginPath(); g.moveTo(...rio); g.quadraticCurveTo(560, 900, lerp(rio[0], sp[0], k), lerp(rio[1], sp[1], k)); g.lineWidth = 10; g.strokeStyle = CORAL; g.stroke(); g.setLineDash([]);
    pin(rio[0], rio[1], 1, TEAL); pin(sp[0], sp[1], back((t - 1.2) / 0.25), CORAL);
    // little crate truck carrying the rhino
    const px = lerp(rio[0], sp[0], k), py = lerp(rio[1], sp[1], k) - 40 * Math.sin(k * Math.PI) - 60;
    g.beginPath(); g.rect(px - 90, py - 70, 180, 110); g.fillStyle = "#c9a060"; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke();
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(px - 90 + i * 45, py - 70); g.lineTo(px - 90 + i * 45, py + 40); g.stroke(); }
    P.rhino(g, px + 10, py + 20, 0.2, { expr: "happy" });
    tag("RIO", rio[0] + 80, rio[1] + 70, "#fff", 1.1); if (t > 1.2) tag("SÃO PAULO", sp[0] + 60, sp[1] + 80, SUN, back((t - 1.2) / 0.25));
    screen(); placard("ON LOAN", 330, back((t - 0.1) / 0.3), TEAL);
  }],
  [SEG(8), (t, d, T) => { // "Students printed two hundred thousand ballots"
    shakeAmt = 3; cam(540, 1150, lerp(1.0, 1.06, ss(t / d)), 0, T); newsroom(T);
    printer(540, 1450, T);
    for (let i = 0; i < 10; i++) { const k = (T * 1.2 + i / 10) % 1; P.ballot(g, 540 + k * 520 * (i % 2 ? 1 : -1), 1300 - Math.sin(k * Math.PI) * 500 + k * 300, 130, k * 6, "CACARECO", 1); }
    ch(150, 1850, 0.75, STU_A, { expr: "laugh", pose: "cheer" }, 1, T, 60);
    ch(930, 1850, 0.75, STU_B, { expr: "grin", wave: Math.sin(T * 8) }, -1, T, 61);
    bigNum(Math.round(lerp(0, 200000, easeOut((T - 30.0) / 1.0)) / 1000) * 1000, CORAL, "BALLOTS", 1, 360);
    screen(); tag("STUDENTS", 540, 1720, "#fff", back((t - 0.05) / 0.25) * 1.1);
  }],
  [T_("with", 1), (t, d, T) => { // "with her name." — a student hands a ballot to a voter
    cam(540, 1050, lerp(1.05, 1.12, ss(t / d)), 0, T); city(T, 1250, "day");
    ch(330, 1800, 1.0, STU_A, { expr: talk(T, "talk", "grin"), pose: "give", pointUp: 0.1, held: HOLD.ballot(-0.05) }, 1, T, 60);
    ch(800, 1800, 1.0, LADY, { expr: t > 0.3 ? "grin" : "shock", pose: "give", pointUp: 0.1 }, -1, T, 11);
    P.ballot(g, 560, 900, 420 * back((t - 0.1) / 0.3), -0.06, "CACARECO", clamp((t - 0.3) / 0.4, 0, 1));
  }],
  [SEG(9), (t, d, T) => { // "As one voter put it," — the old man speaks
    cam(540, 1000, lerp(1.0, 1.1, ss(t / d)), 0, T); hall(T);
    P.ballotBox(g, 860, 1500, 260, "VOTOS");
    face(460, 1050, 1.3, OLDMAN, { expr: talk(T, "talk", "smile"), pose: "point", pointUp: 0.3 }, 1, T, 21);
    screen(); tag("ONE VOTER", 540, 640, SUN, back((t - 0.05) / 0.25) * 1.4);
  }],
  [T_("better"), (t, d, T) => { // "better to elect a rhino than an ass."
    screen(); g.fillStyle = "#9fd3c7"; g.fillRect(0, 0, W / 2, H); g.fillStyle = "#ffd9cf"; g.fillRect(W / 2, 0, W / 2, H);
    cam(540, 1000, 1.0 + 0.03 * t, 0, T);
    g.beginPath(); g.moveTo(540, 0); g.lineTo(540, 1920); g.lineWidth = 12; g.strokeStyle = P.INK; g.stroke();
    rhino(250, 1380, 0.8, T, { expr: "happy", sash: TEAL });
    const ears = back((T - 35.6) / 0.25);
    ch(820, 1500, 0.8, POL(0), { expr: T > 35.6 ? "shock" : "smile" }, -1, T, 70);
    if (ears > 0) { g.save(); g.translate(820, 1500 - 975 * 0.8 + 140 * 0.8); g.scale(ears, ears); donkeyEars(0, 0, 0.9, T); g.restore(); }
    tag("✓", 270, 1620, "#2e9e4f", back((T - 34.9) / 0.25) * 2.2); if (T > 35.6) tag("✗", 820, 1620, "#e0303a", back((T - 35.6) / 0.25) * 2.2);
    screen(); placard("BETTER A RHINO...", 330, back((t - 0.1) / 0.3), TEAL);
  }],
  [SEG(10), (t, d, T) => { // "On election day,"
    cam(540, 1050, lerp(1.06, 1.0, ss(t / d)), 0, T); hall(T);
    P.ballotBox(g, 540, 1500, 340, "VOTOS");
    for (let i = 0; i < 5; i++) { const side = i % 2 ? 1 : -1; ch(540 + side * (200 + Math.floor(i / 2) * 170), 1820, 0.72, FOLK(i + 7), { expr: "smile", pose: "hold", held: HOLD.ballot() }, -side, T, 80 + i); }
    const k = (T * 1.5) % 1; P.ballot(g, 560, lerp(1050, 1200, k), 100, 0.2, "CACARECO", 1);
    screen(); placard("ELECTION DAY", 1720, back((t - 0.1) / 0.3), NAVY, 0.03, SUN);
  }],
  [T_("cacareco", 1), (t, d, T) => { // "Cacareco beat every human candidate."
    screen(); g.fillStyle = "#23305e"; g.fillRect(0, 0, W, H);
    shakeAmt = t > 0.8 && t < 1.3 ? 6 : 0; cam(540, 1050, lerp(1.0, 1.06, ss(t / d)), 0, T);
    scoreboard(T, 1, easeOut((t - 0.2) / 1.0), ["A", "B", "C", ""], 3);
    tag("RHINO", 810, 1420, CORAL, 0.8, 50);
    for (let i = 0; i < 3; i++) face(200 + i * 230, 1520, 0.5, POL(i), { expr: t > 0.9 ? "shock" : "neutral", look: 1 }, 1, T, 90 + i);
    if (t > 0.9) for (let i = 0; i < 3; i++) sweat(290 + i * 230, 1560, 0.6, T + i * 0.3);
    screen(); placard("BEAT THEM ALL", 330, back((T - 38.16) / 0.3), CORAL);
  }],
  [SEG(11), (t, d, T) => { // "Officials rejected her," — the stamp
    shakeAmt = t > 0.48 && t < 0.7 ? 12 : 0; cam(540, 1050, lerp(1.0, 1.06, ss(t / d)), 0, T); chamber(T);
    g.beginPath(); g.rect(80, 1360, 920, 60); g.fillStyle = "#8a5a34"; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
    for (let i = 0; i < 6; i++) P.ballot(g, 300 + i * 18, 1340 - i * 14, 300, -0.05 + i * 0.02, "CACARECO", 1);
    const down = t < 0.5 ? 0 : 1;
    ch(760, 1900, 1.0, OFFICIAL, { expr: "stern", pose: down ? "give" : "point", pointUp: down ? -0.1 : 0.6, held: HOLD.stamp }, -1, T, 95);
    if (down) { g.save(); g.translate(360, 1240); g.rotate(-0.15); const k = back((t - 0.5) / 0.15); g.scale(k, k); g.lineWidth = 10; g.strokeStyle = "#d62f3a"; g.strokeRect(-210, -60, 420, 120); g.fillStyle = "#d62f3a"; g.font = "900 78px Montserrat"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("REJECTED", 0, 4); g.restore(); }
    screen(); tag("OFFICIALS", 540, 330, "#fff", back((t - 0.05) / 0.25) * 1.4);
  }],
  [T_("so", 1), (t, d, T) => { // "so she never took a seat." — empty chair, rhino at the door
    cam(540, 1100, lerp(1.0, 1.1, ss(t / d)), 0, T); chamber(T);
    g.save(); g.globalAlpha = 0.3; g.beginPath(); g.moveTo(480, 0); g.lineTo(300, 1500); g.lineTo(700, 1500); g.lineTo(600, 0); g.closePath(); g.fillStyle = "#fff6c2"; g.fill(); g.restore();
    chair(500, 1460, 2.2, "#6b3a24", CORAL);
    g.beginPath(); g.rect(330, 1110, 340, 90); g.fillStyle = CREAM; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke(); tag("CACARECO", 500, 1156, NAVY, 0.85, 50);
    rhino(lerp(1250, 900, ss(t / 0.8)), 1840, 0.75, T, { expr: "neutral", dir: -1 });
    sweat(lerp(1250, 900, ss(t / 0.8)) - 230, 1480, 1.0, T);
    screen(); placard("NO SEAT", 330, back((T - 41.95) / 0.3), "#8a3a3a");
  }],
  [SEG(12), (t, d, T) => { // "But the message was loud and clear:" — megaphones and signs
    cam(540, 1100, lerp(1.0, 1.05, ss(t / d)), 0, T); city(T, 1250, "golden");
    for (let i = 0; i < 5; i++) ch(120 + i * 210, 1850 + (i % 2) * 40, 0.65, i % 2 ? STU_B : FOLK(i), { expr: talk(T, "shout", "yell", i), pose: "hold", held: HOLD.sign(["VOTE", "RHINO", "FIX IT", "LISTEN", "1959"][i], [CORAL, TEAL, SUN, NAVY, CORAL][i]) }, i % 2 ? -1 : 1, T, 100 + i);
    // a student shouts through a megaphone held in her hand (sound rings come out of its bell)
    ch(470, 1720, 1.05, STU_A, { expr: talk(T, "shout", "yell"), pose: "give", pointUp: 0.35, held: HOLD.megaphone }, 1, T, 60);
    for (let i = 0; i < 3; i++) { const k = (T * 1.5 + i / 3) % 1; g.beginPath(); g.arc(840, 930, 80 + k * 330, -0.9, 0.7); g.lineWidth = 16 * (1 - k); g.strokeStyle = CREAM; g.stroke(); }
    screen(); tag("LOUD & CLEAR", 540, 330, SUN, back((T - 44.63) / 0.25) * 1.4);
  }],
  [T_("listen"), (t, d, T) => { // "listen to us."
    shakeAmt = 5; cam(540, 1000, lerp(1.15, 1.25, ss(t / d)), 0, T); city(T, 1250, "golden");
    face(540, 980, 1.5, STU_B, { expr: talk(T, "shout2", "yell"), look: 0 }, 1, T, 101);
    speedLines(T, 8, "rgba(255,255,255,0.5)");
    placard("LISTEN TO US!", 330, back((t - 0.05) / 0.3), CORAL);
  }],
  [SEG(13), (t, d, T) => { // "A joke vote can travel very far." — a paper-plane ballot flies to Canada
    screen(); g.fillStyle = "#14204a"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.4 + 0.6 * rnd(i, 2)})`; g.fillRect(rnd(i, 1) * W, rnd(i, 3) * H, 4, 4); }
    cam(540, 1000, lerp(1.0, 1.08, ss(t / d)), 0, T); globe(T);
    const k = ss((t - 0.2) / 1.6), a = [640, 1180], b = [520, 640], cx = 900, cy = 900;
    const bx = (u) => (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * cx + u * u * b[0], by = (u) => (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * cy + u * u * b[1];
    g.setLineDash([22, 16]); g.beginPath(); for (let u = 0; u <= k; u += 0.02) g.lineTo(bx(u), by(u)); g.lineWidth = 9; g.strokeStyle = SUN; g.stroke(); g.setLineDash([]);
    const px = bx(k), py = by(k), ang = Math.atan2(by(Math.min(1, k + 0.02)) - py, bx(Math.min(1, k + 0.02)) - px);
    g.save(); g.translate(px, py); g.rotate(ang); g.beginPath(); g.moveTo(70, 0); g.lineTo(-50, -40); g.lineTo(-30, 0); g.lineTo(-50, 40); g.closePath(); g.fillStyle = "#fffdf4"; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke(); g.restore();
    pin(a[0], a[1], 1, CORAL); if (k > 0.95) { pin(b[0], b[1], back((t - 1.8) / 0.25), "#d62f3a"); P.maple(g, b[0] + 120, b[1] - 60, 90 * back((t - 1.8) / 0.25), 0.2); }
    screen(); placard("A JOKE VOTE", 330, back((t - 0.1) / 0.3), SUN, -0.035, NAVY);
  }],
  [SEG(14), (t, d, T) => { // "Four years later," — calendar 1959 -> 1963
    screen(); g.fillStyle = "#cfe0f0"; g.fillRect(0, 0, W, H);
    cam(540, 1000, lerp(1.0, 1.06, ss(t / d)), 0, T);
    const yr = 1959 + Math.min(4, Math.floor(t * 4.2)), fl = (t * 4.2) % 1;
    calendar(540, 1000, 1.6, yr, yr < 1963 ? fl : 0);
    for (let i = 0; i < 6; i++) { const k = (T * 0.8 + rnd(i, 1)) % 1; P.maple(g, rnd(i, 2) * W, -100 + k * 2100, 70, T * 2 + i, i % 2 ? "#e8742a" : "#d62f3a"); }
    bigNum(4, CORAL, "YEARS LATER", back((t - 0.05) / 0.3), 330);
  }],
  [T_("quebec") - 0.19, (t, d, T) => { // "in Quebec,"
    cam(540, 1050, lerp(1.0, 1.06, ss(t / d)), 0, T); snowy(T);
    qcFlag(640, 700, 300, T);
    for (let i = 0; i < 3; i++) ch(150 + i * 330, 1750 + (i % 2) * 40, 0.65, QFOLK(i), { mode: "stroll", phase: T * 1.6 + i, expr: "smile" }, i % 2 ? -1 : 1, T, 110 + i);
    snow(T + 3);
    screen(); placard("QUEBEC", 330, back((T - 50.36) / 0.3), "#1d5fb3");
  }],
  [T_("she", 1), (t, d, T) => { // "she inspired the Rhinoceros Party."
    cam(540, 1050, lerp(1.04, 1.0, ss(t / d)), 0, T); stage(T);
    ch(540, 1500, 0.9, FERRON, { expr: talk(T, "talk", "grin"), pose: "cheer" }, 1, T, 120);
    podium(540, 1560, 360, "", "#1d5fb3"); P.rhino(g, 540, 1340, 0.25, { expr: "happy", col: "#c9ccd8" });
    for (let i = 0; i < 6; i++) ch(-20 + i * 225, 1950 + (i % 2) * 30, 0.6, QFOLK(i + 1), { expr: "laugh", pose: i % 2 ? "cheer" : undefined, wave: i % 2 ? undefined : Math.sin(T * 8 + i) }, i % 2 ? -1 : 1, T, 130 + i);
    if (T > 51.92) confetti(T, 40, 51.9);
    screen(); if (T > 51.92) placard("RHINOCEROS PARTY", 1740, back((T - 51.92) / 0.3), "#1d5fb3", 0.03);
    tag("INSPIRED BY HER", 540, 640, SUN, back((T - 51.14) / 0.25) * 1.1);
  }],
  [SEG(15), (t, d, T) => { // "Its first promise?"
    cam(540, 1000, lerp(1.0, 1.08, ss(t / d)), 0, T); stage(T);
    face(500, 960, 1.35, FERRON, { expr: talk(T, "talk", "smile"), pose: "point", pointUp: 0.9 }, 1, T, 120);
    qmark(880, 650, 0.8, T);
    placard("PROMISE #1", 1720, back((T - 53.94) / 0.3), "#1d5fb3", 0.03);
  }],
  [T_("to", 2), (t, d, T) => { // "To keep none of its promises." — every promise crossed out
    screen(); g.fillStyle = "#2a1f3a"; g.fillRect(0, 0, W, H);
    cam(540, 1000, lerp(1.0, 1.05, ss(t / d)), 0, T);
    g.beginPath(); g.roundRect(150, 420, 780, 1060, 20); g.fillStyle = "#fffdf4"; g.fill(); g.lineWidth = 10; g.strokeStyle = P.INK; g.stroke();
    g.fillStyle = "#1d5fb3"; g.font = "900 64px Montserrat"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("WE PROMISE:", 540, 520);
    ["PROMISE 1", "PROMISE 2", "PROMISE 3", "PROMISE 4", "PROMISE 5"].forEach((p, i) => { const y = 660 + i * 160; g.fillStyle = P.INK; g.font = "900 56px Montserrat"; g.textAlign = "left"; g.fillText("☐ " + p, 220, y);
      const k = clamp((t - 0.2 - i * 0.22) / 0.2, 0, 1); if (k > 0) { g.beginPath(); g.moveTo(200, y); g.lineTo(200 + 640 * k, y - 10); g.lineWidth = 16; g.strokeStyle = "#e0303a"; g.lineCap = "round"; g.stroke(); } });
    if (t > 1.4) { g.save(); g.translate(540, 1250); g.rotate(-0.12); const k = back((t - 1.4) / 0.2); g.scale(k, k); g.lineWidth = 12; g.strokeStyle = "#e0303a"; g.strokeRect(-300, -80, 600, 160); g.fillStyle = "#e0303a"; g.font = "900 110px Montserrat"; g.textAlign = "center"; g.fillText("NONE!", 0, 8); g.restore(); }
    face(880, 1530, 0.75, FERRON, { expr: t > 1.4 ? "laugh" : "grin" }, -1, T, 120);
    screen(); tag("KEPT: 0", 540, 330, SUN, back((T - 54.82) / 0.25) * 1.4);
  }],
  [SEG(16), (t, d, T) => { // "If you could elect any animal," — an animal ballot
    screen(); g.fillStyle = "#9fd3c7"; g.fillRect(0, 0, W, H);
    cam(540, 1000, lerp(1.0, 1.06, ss(t / d)), 0, T);
    g.beginPath(); g.roundRect(110, 380, 860, 1240, 24); g.fillStyle = "#fffdf4"; g.fill(); g.lineWidth = 10; g.strokeStyle = P.INK; g.stroke();
    g.fillStyle = NAVY; g.fillRect(140, 410, 800, 110); g.fillStyle = SUN; g.font = "900 70px Montserrat"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("YOUR BALLOT", 540, 468);
    const rows = [["RHINO", (y) => P.rhino(g, 700, y + 70, 0.3, { expr: "happy" })], ["HORSE", (y) => P.horse(g, 700, y + 90, 0.42, T * 2)], ["TURTLE", (y) => P.turtle(g, 700, y + 40, 0.8, T * 3)], ["OX", (y) => P.ox(g, 700, y + 85, 0.42, T * 2)]];
    rows.forEach(([nm, draw], i) => { const y = 620 + i * 240, k = back((t - i * 0.15) / 0.25); if (k <= 0) return;
      g.beginPath(); g.rect(170, y - 50, 100, 100); g.fillStyle = "#fff"; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
      if (Math.floor(T * 2.5) % 4 === i) { g.beginPath(); g.moveTo(185, y - 35); g.lineTo(255, y + 35); g.moveTo(255, y - 35); g.lineTo(185, y + 35); g.lineWidth = 14; g.strokeStyle = "#d62f3a"; g.stroke(); }
      g.fillStyle = P.INK; g.font = "900 58px Montserrat"; g.textAlign = "left"; g.fillText(nm, 300, y + 4); draw(y); });
    qmark(860, 300, 0.6, T);
  }],
  [T_("which"), (t, d, T) => { // "which one would you pick?" — Cacareco takes the mic and winks
    cam(540, 1050, lerp(1.0, 1.08, ss(t / d)), 0, T); city(T, 1250, "golden");
    podium(540, 1750, 400, "", TEAL);
    rhino(560, 1350, 0.95, T, { expr: t > 0.5 && t < 0.9 ? "wink" : "happy", sash: CORAL, mouthOpen: 0.5 + 0.5 * Math.sin(T * 14), headUp: 0.06 });
    g.beginPath(); g.moveTo(760, 1400); g.lineTo(780, 1050); g.lineWidth = 8; g.strokeStyle = P.INK; g.stroke(); HOLD.mic(g, 785, 1040, 3);
    confetti(T, 30, 58);
    screen(); placard("COMMENT ↓", 330, back((t - 0.2) / 0.3), TEAL);
  }],
];
const SH = SHOTS.map((s) => s[0]);

// ---------------- captions (coral accent on key words, new for this story) ----------------
const allWords = segs.flatMap((s) => s.words);
const KEY = /^(nineteen|fifty|sao|paulo|rhino|rhinoceros|cacareco|hundred|thousand|rewind|holes|sewers|five|forty|candidates|seats|fed|journalist|idea|zoo|female|rio|students|ballots|ass|election|beat|human|rejected|seat|loud|listen|joke|four|quebec|party|promise|promises|none|animal)/i;
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
  g.save(); g.translate(W / 2, H * 0.6); g.scale(0.85 + 0.15 * pop, 0.85 + 0.15 * pop);
  g.font = "900 104px Montserrat"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
  g.lineWidth = 22; g.strokeStyle = "#111"; g.strokeText(txt.toUpperCase(), 0, 0);
  g.fillStyle = KEY.test(txt.normalize("NFD").replace(/[^A-Za-z0-9]/g, "")) ? "#ff8c69" : "#ffffff"; g.fillText(txt.toUpperCase(), 0, 0);
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
  const fl = [T_("was", 0) + 0.42, SEG(3), SEG(14)].map((s) => clamp(1 - Math.abs(T - s) / 0.12, 0, 1)).reduce((a, b) => Math.max(a, b), 0);
  if (fl > 0) { g.fillStyle = `rgba(255,255,255,${fl})`; g.fillRect(0, 0, W, H); }
  const v = g.createRadialGradient(W / 2, H / 2, 600, W / 2, H / 2, 1250); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.26)");
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  captions(T);
  return true;
};
window.ready = true;
