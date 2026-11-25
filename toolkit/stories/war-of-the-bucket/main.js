import { Pen, bodyFront, INK as TINK } from "./toon.js";
import * as P from "./paint.js";
const { clamp, lerp, ss, easeOut, back, rnd } = P;

export const W = 1080, H = 1920, FPS = 30;
const cv = document.getElementById("c"); cv.width = W; cv.height = H;
const g = cv.getContext("2d");

// ---------------- cast ----------------
const BOL = { jacket: "#c8323a", pants: "#f1ece0", boots: "#3a2a22", hat: "kettle", cap: "#aab3be" };
const MOD = { jacket: "#2f5fb3", pants: "#e8c547", boots: "#3a2a22", hat: "kettle", cap: "#aab3be" };
const SK = ["#ffe2c2", "#f5c9a0", "#ecd0b6", "#c99067"];
const bol = (v, x = {}) => ({ ...BOL, skin: SK[v % 4], moustache: v % 3 === 1 ? "#4a3426" : undefined, ...x });
const mod = (v, x = {}) => ({ ...MOD, skin: SK[(v + 1) % 4], moustache: v % 3 === 2 ? "#2a201a" : undefined, ...x });
const KNIGHT = (v) => bol(v, { plume: "#f1ece0", cap: "#c9d0d8" });
const BOSS = { ...BOL, plume: "#f4d35e", moustache: "#4a3020", build: "stout", cap: "#d9c06a", skin: SK[0] };
const HERO = mod(1); // the Modena soldier who takes the bucket
const TOURIST = { jacket: "#f08a2c", pants: "#3b5b9a", boots: "#f4f1ea", hat: "cap", cap: "#2aa198", skin: SK[1] };

const blink = (T, seed) => ((T + seed * 0.77) % 3.4) < 0.11;
/** talking mouth: alternate two expressions ~7 times per second */
const talk = (T, a, b, seed = 0) => (Math.floor(T * 7 + seed) % 2 ? a : b);
/** draw a character: soles at x,y, s = scale (1 = ~780px tall) */
function ch(x, y, s, o, opts = {}, flip = 1, T = 0, seed = 1) {
  g.save(); g.translate(x, y);
  P.shadow(g, 0, 0, 120 * s, 0.22);
  g.scale(s * flip, s); g.translate(-300, -975);
  const idle = opts.mode === "march" || opts.mode === "stroll" ? 0 : 0.025 * Math.sin(T * 2.1 + seed * 1.7);
  bodyFront(new Pen(g), o, { mode: "stand", seed, blink: blink(T, seed), tilt: idle, headTilt: idle * 1.5, ...opts });
  g.restore();
}
/** close-up: head centre at (x, hy), scale s */
const face = (x, hy, s, o, opts, flip, T, seed) => ch(x, hy + 670 * s, s, o, opts, flip, T, seed);
const handUp = (x, y, s, flip = 1) => [x + flip * 175 * s, y - 900 * s];

// ---------------- timing ----------------
const segs = window.SEGS;
export const DUR = window.DUR;
for (const s of segs) {
  const ws = s.text.split(/\s+/), weights = ws.map((w) => w.replace(/[^A-Za-z0-9]/g, "").length + 1.5 + (/[.,]$/.test(w) ? 2 : 0));
  const tot = weights.reduce((a, b) => a + b, 0); let t = s.start;
  s.words = ws.map((w, i) => { const d = ((s.end - s.start) * weights[i]) / tot; const o = { w, t0: t, t1: t + d }; t += d; return o; });
}
const T_ = (frag, nth = 0) => { let k = 0; for (const s of segs) for (const ww of s.words) if (ww.w.toLowerCase().replace(/[^a-z]/g, "").startsWith(frag)) { if (k++ === nth) return ww.t0; } return 0; };

// ---------------- camera ----------------
let shakeAmt = 0;
function cam(cx, cy, z, roll = 0, T = 0) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.translate(W / 2, H / 2); g.rotate(roll); g.scale(z, z);
  const sx = shakeAmt ? shakeAmt * (rnd(Math.floor(T * 30), 1) - 0.5) : 0, sy = shakeAmt ? shakeAmt * (rnd(Math.floor(T * 30), 2) - 0.5) : 0;
  g.translate(-cx + sx, -cy + sy);
}
const screen = () => g.setTransform(1, 0, 0, 1, 0, 0);
const tone = (key, a) => {
  screen();
  const c = { golden: "rgba(255,140,40,", dusk: "rgba(120,60,160,", night: "rgba(30,50,140,", sepia: "rgba(150,100,40," }[key];
  if (!c) return;
  g.globalCompositeOperation = key === "sepia" ? "color" : "multiply"; g.fillStyle = c + a + ")"; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "source-over";
};

// ---------------- decor helpers ----------------
function sun(x, y, r, col = "#ffe27a") {
  g.beginPath(); g.arc(x, y, r * 1.35, 0, Math.PI * 2); g.fillStyle = "rgba(255,240,170,0.35)"; g.fill();
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = col; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke();
}
function birds(T, x0, y0, n = 3) {
  for (let i = 0; i < n; i++) {
    const x = x0 + ((T * 60 + i * 140) % 1400) - 200, y = y0 + i * 40 + 10 * Math.sin(T * 3 + i), f = 14 * Math.sin(T * 12 + i * 2);
    g.beginPath(); g.moveTo(x - 22, y - f); g.quadraticCurveTo(x - 10, y - 8, x, y); g.quadraticCurveTo(x + 10, y - 8, x + 22, y - f);
    g.lineWidth = 5; g.strokeStyle = P.INK; g.lineCap = "round"; g.stroke();
  }
}
function tufts(x0, x1, y0, y1, seed, n = 60) {
  g.strokeStyle = "#5e9a42"; g.lineWidth = 5; g.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, rnd(seed, i)), y = lerp(y0, y1, rnd(seed, i + 99)), h = 14 + 16 * rnd(seed, i + 7);
    g.beginPath(); g.moveTo(x - 8, y - h); g.lineTo(x, y); g.lineTo(x + 2, y - h * 1.2); g.moveTo(x, y); g.lineTo(x + 10, y - h * 0.8); g.stroke();
    if (i % 7 === 0) { g.beginPath(); g.arc(x + 4, y - h - 4, 7, 0, Math.PI * 2); g.fillStyle = ["#ffffff", "#ffd54a", "#ff7aa2"][i % 3]; g.fill(); }
  }
}
function speedLines(T, n = 14, col = "rgba(255,255,255,0.75)") {
  screen(); g.strokeStyle = col; g.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const y = rnd(i, 3) * H, len = 200 + rnd(i, 4) * 300, x = ((T * 2600 + rnd(i, 5) * 2000) % (W + len * 2)) - len;
    g.lineWidth = 6 + rnd(i, 6) * 8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y); g.stroke();
  }
}
function sweat(x, y, s, T) {
  const dy = ((T * 1.5) % 1) * 60 * s;
  g.beginPath(); g.moveTo(x, y + dy - 30 * s); g.quadraticCurveTo(x + 18 * s, y + dy, x, y + dy + 14 * s); g.quadraticCurveTo(x - 18 * s, y + dy, x, y + dy - 30 * s);
  g.fillStyle = "#9fdcff"; g.fill(); g.lineWidth = 4 * s; g.strokeStyle = P.INK; g.stroke();
}
function angry(x, y, s, T) {
  g.save(); g.translate(x, y); g.scale(s * (1 + 0.1 * Math.sin(T * 14)), s * (1 + 0.1 * Math.sin(T * 14)));
  g.strokeStyle = "#e0352b"; g.lineWidth = 9; g.lineCap = "round";
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => { g.beginPath(); g.moveTo(a * 8, b * 26); g.quadraticCurveTo(a * 8, b * 8, a * 26, b * 8); g.stroke(); });
  g.restore();
}
function sparkle(x, y, r, T) {
  for (let i = 0; i < 3; i++) {
    const a = T * 4 + i * 2.1, k = 0.6 + 0.4 * Math.sin(T * 6 + i), px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 0.6;
    g.save(); g.translate(px, py); g.scale(k, k); g.beginPath();
    for (let j = 0; j < 8; j++) { const rr = j % 2 ? 6 : 22, aa = (j * Math.PI) / 4; g.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); }
    g.closePath(); g.fillStyle = "#fff6c2"; g.fill(); g.lineWidth = 3; g.strokeStyle = P.INK; g.stroke(); g.restore();
  }
}

// ---------------- crowds ----------------
function army(T, horizonY, nearY, rows, outfitFn, opt = {}) {
  const { spacing = 240, x0 = -2600, x1 = 3600, march = true, bannerEvery = 5, mode = "march" } = opt;
  for (let r = rows - 1; r >= 0; r--) {
    const s = 0.62 / (1 + 0.42 * r), y = horizonY + (nearY - horizonY) * (s / 0.62);
    const sp = spacing * s / 0.62, n = Math.ceil((x1 - x0) / sp);
    for (let i = 0; i < n; i++) {
      const id = r * 97 + i, x = x0 + i * sp + (r % 2) * sp * 0.5 + (rnd(id, 3) - 0.5) * sp * 0.25;
      if (bannerEvery && i % bannerEvery === (bannerEvery > 2 ? 2 : 1) && (bannerEvery <= 2 || r % 2 === 0)) P.banner(g, x - 40 * s, y - 520 * s, 980 * s, "#c8323a", "#f1ece0", T + id, s * 1.3);
      ch(x, y, s * 0.62, outfitFn(id), { mode: march ? mode : "stand", phase: T * 1.7 + rnd(id, 1), look: 0 }, 1, T, id % 50 + 2);
    }
  }
}

// ---------------- backdrops ----------------
function landscape(T, key, opts = {}) {
  const { hy = 900, x0 = -3000, x1 = 4000, sunAt = null } = opts;
  if (sunAt) sun(sunAt[0], sunAt[1], sunAt[2] || 90, key === "dusk" ? "#ff9a4a" : "#ffe27a");
  P.cloud(g, x0 + ((T * 12) % 600) + 600, hy - 520, 1.4); P.cloud(g, 300 + T * 8, hy - 650, 1.1); P.cloud(g, 1500 - T * 6, hy - 450, 1.6);
  if (key === "day" || key === "golden") birds(T, 100, hy - 700, 3);
  P.hills(g, x0, x1, hy - 60, 120, key === "night" ? "#4f6aa8" : "#9fbfd6", 1.3, 4000, 0);
  P.hills(g, x0, x1, hy, 90, "#8cc06a", 3.1);
  for (let i = 0; i < 14; i++) P.cypress(g, x0 + 300 + i * 480 + rnd(i, 2) * 200, hy + 30 + rnd(i, 5) * 40, 160 + rnd(i, 4) * 90);
  P.hills(g, x0, x1, hy + 140, 60, "#7bb257", 7.7);
}
function field(y, col = "#86b85c", seed = 1) { P.ground(g, -3000, 4000, y, col); tufts(-600, 1700, y + 40, y + 1100, seed, 70); }

// ---------------- overlays & props ----------------
function bigNum(n, col, label, pop = 1) {
  screen(); g.save(); g.translate(W / 2, 330); const k = clamp(pop, 0, 1.3); g.scale(k, k);
  g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
  g.font = "900 170px Montserrat"; g.lineWidth = 26; g.strokeStyle = "#111"; const s = n.toLocaleString("en-US");
  g.strokeText(s, 0, 0); g.fillStyle = col; g.fillText(s, 0, 0);
  g.font = "900 64px Montserrat"; g.lineWidth = 16; g.strokeText(label, 0, 120); g.fillStyle = "#fff"; g.fillText(label, 0, 120);
  g.restore();
}
function tag(txt, x, y, col, k = 1) {
  g.save(); g.translate(x, y); g.scale(k, k); g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
  g.font = "900 60px Montserrat"; g.lineWidth = 16; g.strokeStyle = "#111"; g.strokeText(txt, 0, 0); g.fillStyle = col === "#241726" ? "#fff" : col; g.fillText(txt, 0, 0); g.restore();
}
function stamp(txt, y, col, pop, rot = -0.05) {
  if (pop <= 0) return; g.save(); g.translate(W / 2, y); g.rotate(rot); g.scale(clamp(pop, 0, 1.3), clamp(pop, 0, 1.3));
  g.font = "900 96px Montserrat"; g.textAlign = "center"; g.textBaseline = "middle";
  const w = g.measureText(txt).width + 60; g.fillStyle = "#f4e7c6"; g.fillRect(-w / 2, -70, w, 140); g.lineWidth = 8; g.strokeStyle = col; g.strokeRect(-w / 2, -70, w, 140);
  g.fillStyle = col; g.fillText(txt, 0, 6); g.restore();
}
function bow(x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.beginPath(); g.moveTo(0, -330); g.quadraticCurveTo(-120, 0, 0, 330); g.lineWidth = 30; g.strokeStyle = P.INK; g.stroke(); g.lineWidth = 18; g.strokeStyle = "#8a5a33"; g.stroke();
  g.beginPath(); g.moveTo(0, -330); g.lineTo(0, 330); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke();
  g.restore();
}
function spear(x0, y0, x1, y1, w = 14) {
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineWidth = w + 10; g.strokeStyle = P.INK; g.lineCap = "round"; g.stroke(); g.lineWidth = w; g.strokeStyle = "#a8743f"; g.stroke();
  const a = Math.atan2(y1 - y0, x1 - x0); g.save(); g.translate(x1, y1); g.rotate(a);
  g.beginPath(); g.moveTo(0, -w * 1.2); g.lineTo(w * 4, 0); g.lineTo(0, w * 1.2); g.closePath(); g.fillStyle = "#c9d0d8"; g.fill(); g.lineWidth = 5; g.stroke(); g.restore();
}
function trumpet(x, y, s, T) {
  g.save(); g.translate(x, y); g.scale(s, Math.abs(s)); g.rotate(-0.5);
  g.beginPath(); g.moveTo(0, -8); g.lineTo(160, -14); g.lineTo(210, -45); g.lineTo(210, 45); g.lineTo(160, 14); g.lineTo(0, 8); g.closePath();
  g.fillStyle = "#e8c547"; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke();
  for (let i = 0; i < 3; i++) { const k = ((T * 2 + i / 3) % 1); g.globalAlpha = 1 - k; g.beginPath(); g.arc(240 + k * 160, 0, 20 + k * 40, -0.8, 0.8); g.lineWidth = 8; g.strokeStyle = P.INK; g.stroke(); g.globalAlpha = 1; }
  g.restore();
}
function italy() {
  const pts = [[230,520],[330,470],[450,480],[560,450],[680,470],[760,520],[720,560],[650,600],[640,650],[660,720],[700,800],[760,900],[830,1000],[900,1040],[950,1050],[940,1100],[1000,1160],[1040,1230],[1010,1250],[950,1190],[900,1170],[870,1230],[880,1320],[860,1420],[820,1470],[780,1460],[800,1380],[760,1300],[700,1240],[640,1180],[580,1110],[520,1030],[470,960],[430,880],[400,800],[330,740],[250,740],[200,700],[220,620],[200,560]];
  g.strokeStyle = "rgba(255,255,255,0.6)"; g.lineWidth = 5;
  for (let i = 0; i < 12; i++) { const x = 80 + (i % 4) * 280, y = 950 + Math.floor(i / 4) * 330; g.beginPath(); g.arc(x, y, 20, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.beginPath(); g.arc(x + 40, y, 20, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
  g.beginPath(); g.rect(-600, 200, 2400, 330); g.fillStyle = "#c9b48a"; g.fill();
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fillStyle = "#a8d488"; g.fill(); g.lineWidth = 8; g.strokeStyle = P.INK; g.lineJoin = "round"; g.stroke();
  g.beginPath(); g.ellipse(700, 1570, 130, 70, -0.15, 0, Math.PI * 2); g.fillStyle = "#a8d488"; g.fill(); g.lineWidth = 8; g.stroke();
  g.beginPath(); g.ellipse(300, 1150, 60, 110, 0, 0, Math.PI * 2); g.fillStyle = "#a8d488"; g.fill(); g.stroke();
  for (let i = 0; i < 9; i++) { const x = 230 + i * 62, y = 520 - (i % 2) * 10; g.beginPath(); g.moveTo(x - 45, y + 20); g.lineTo(x, y - 55); g.lineTo(x + 45, y + 20); g.closePath(); g.fillStyle = "#9a8f84"; g.fill(); g.lineWidth = 5; g.stroke(); g.beginPath(); g.moveTo(x - 15, y - 22); g.lineTo(x, y - 55); g.lineTo(x + 15, y - 22); g.closePath(); g.fillStyle = "#fff"; g.fill(); }
}
function castleOnHill(T, swap) {
  g.beginPath(); g.ellipse(560, 1150, 560, 280, 0, Math.PI, 0); g.fillStyle = "#7bb257"; g.fill(); g.lineWidth = 6; g.strokeStyle = TINK; g.stroke();
  P.tower(g, 380, 920, 140, 320, "#c9a77e"); P.tower(g, 760, 920, 140, 320, "#c9a77e");
  g.beginPath(); g.rect(380, 690, 380, 230); g.fillStyle = "#d6b68c"; g.fill(); g.lineWidth = 6; g.strokeStyle = TINK; g.stroke();
  P.crenels(g, 380, 760, 690, 32, "#d6b68c", 5);
  g.beginPath(); g.moveTo(520, 920); g.lineTo(520, 840); g.arc(570, 840, 50, Math.PI, 0); g.lineTo(620, 920); g.closePath(); g.fillStyle = "#2a1c1e"; g.fill(); g.lineWidth = 6; g.stroke();
  P.banner(g, 560, 690, lerp(330, 0, swap), "#c8323a", "#f1ece0", T, 1.6);
  if (swap > 0.3) P.banner(g, 560, 690, lerp(0, 330, swap), "#2f5fb3", "#e8c547", T + 2, 1.6);
}
function museum(t, d, T, z, cx, cy) {
  screen(); g.fillStyle = "#3d302b"; g.fillRect(0, 0, W, H);
  cam(cx, cy, z, 0, T);
  g.fillStyle = "#6b5a4e"; g.fillRect(-1000, -1000, 3200, 2350);
  g.strokeStyle = "#54463d"; g.lineWidth = 6;
  for (let r = 0; r < 20; r++) for (let c = 0; c < 14; c++) { g.beginPath(); g.rect(-1000 + c * 240 + (r % 2) * 120, -1000 + r * 120, 240, 120); g.stroke(); }
  g.beginPath(); g.moveTo(130, 820); g.lineTo(130, 420); g.arc(250, 420, 120, Math.PI, 0); g.lineTo(370, 820); g.closePath(); g.fillStyle = "#9fdcff"; g.fill(); g.lineWidth = 8; g.strokeStyle = P.INK; g.stroke();
  g.beginPath(); g.moveTo(250, 300); g.lineTo(250, 820); g.moveTo(130, 560); g.lineTo(370, 560); g.lineWidth = 8; g.stroke();
  g.fillStyle = "#8c7a6c"; g.fillRect(-1000, 1350, 3200, 1500);
  const gr = g.createRadialGradient(600, 900, 20, 600, 1000, 520); gr.addColorStop(0, "rgba(255,240,190,0.55)"); gr.addColorStop(1, "rgba(255,240,190,0)");
  g.fillStyle = gr; g.fillRect(0, 300, 1200, 1300);
  g.beginPath(); g.rect(480, 1030, 240, 360); g.fillStyle = "#e9e2d4"; g.fill(); g.lineWidth = 7; g.strokeStyle = P.INK; g.stroke();
  P.bucket(g, 600, 1025, 150);
  g.beginPath(); g.rect(455, 740, 290, 290); g.fillStyle = "rgba(200,240,255,0.18)"; g.fill(); g.lineWidth = 6; g.stroke();
  g.beginPath(); g.moveTo(480, 760); g.lineTo(540, 760); g.lineTo(470, 860); g.closePath(); g.fillStyle = "rgba(255,255,255,0.5)"; g.fill();
  g.beginPath(); g.rect(530, 1120, 140, 70); g.fillStyle = "#c9a24a"; g.fill(); g.lineWidth = 5; g.stroke();
  g.fillStyle = P.INK; g.font = "900 36px Montserrat"; g.textAlign = "center"; g.textBaseline = "alphabetic"; g.fillText("1325", 600, 1168);
  // velvet rope in front
  g.beginPath(); g.moveTo(330, 1300); g.quadraticCurveTo(600, 1420, 870, 1300); g.lineWidth = 16; g.strokeStyle = P.INK; g.stroke(); g.lineWidth = 10; g.strokeStyle = "#b5223a"; g.stroke();
  [330, 870].forEach((x) => { g.beginPath(); g.rect(x - 10, 1290, 20, 170); g.fillStyle = "#d9b44a"; g.fill(); g.lineWidth = 5; g.strokeStyle = P.INK; g.stroke(); });
}
const legendSnap = document.createElement("canvas"); legendSnap.width = W; legendSnap.height = H;
function parchment() {
  screen();
  g.lineWidth = 60; g.strokeStyle = "#e9d5a8"; g.strokeRect(30, 30, W - 60, H - 60);
  g.lineWidth = 6; g.strokeStyle = "#6e4a2a"; g.strokeRect(62, 62, W - 124, H - 124);
  const v = g.createRadialGradient(W / 2, H / 2, 400, W / 2, H / 2, 1200); v.addColorStop(0, "rgba(90,50,20,0)"); v.addColorStop(1, "rgba(90,50,20,0.45)");
  g.fillStyle = v; g.fillRect(0, 0, W, H);
}
function legendWide(t, d, T) {
  const pull = 30 * Math.sin(T * 5);
  P.sky(g, W, H, "day"); cam(540, 1000, lerp(0.9, 1.0, t / d), 0.015 * Math.sin(t), T);
  landscape(T, "day", { hy: 900 }); P.ground(g, -3000, 4000, 1000, "#86b85c");
  for (let i = 0; i < 3; i++) { ch(120 + i * 120, 1380, 0.38, bol(i), { expr: "shout", mode: "fall" }, 1, T, 113 + i); ch(960 - i * 120, 1380, 0.38, mod(i), { expr: "shout", mode: "fall" }, -1, T, 120 + i); }
  P.banner(g, 90, 1380, 420, "#c8323a", "#f1ece0", T, 1.1); P.banner(g, 990, 1380, 420, "#2f5fb3", "#e8c547", T, 1.1, -1);
  ch(230 + pull, 1700, 0.8, bol(1), { expr: "pained", tilt: -0.14 }, 1, T, 111);
  ch(850 + pull, 1700, 0.8, mod(1), { expr: "pained", tilt: -0.14 }, -1, T, 112);
  g.beginPath(); g.moveTo(330 + pull, 1390); g.lineTo(750 + pull, 1390); g.lineWidth = 22; g.strokeStyle = P.INK; g.stroke(); g.lineWidth = 12; g.strokeStyle = "#a8743f"; g.stroke();
  P.bucket(g, 540 + pull, 1500, 130);
  tone("sepia", 0.75); parchment();
}

// ---------------- shots: [start (s), fn(t in shot, shot length, global T)] ----------------
const SHOTS = [
  [0, (t, d, T) => { // "Thirty-two thousand soldiers"
    P.sky(g, W, H, "day"); cam(540, 1050, lerp(1.35, 0.95, easeOut(T / 1.6)), 0, T);
    landscape(T, "day", { hy: 820, sunAt: [880, 260, 80] }); field(900);
    army(T, 880, 1750, 9, (id) => (id % 7 === 0 ? KNIGHT(id) : bol(id)), { x0: -1800, x1: 3000 });
    bigNum(Math.round(lerp(1000, 32000, easeOut(T / 1.5))), "#c8323a", "SOLDIERS");
  }],
  [1.72, (t, d, T) => { // "marched out to crush"
    P.sky(g, W, H, "day"); shakeAmt = 8; cam(540, 1000, 1.0, 0.02 * Math.sin(T * 9), T);
    landscape(T, "day", { hy: 1000 }); field(1050, "#86b85c", 2);
    for (let i = 0; i < 6; i++) ch(80 + i * 190, 1250, 0.32, bol(i + 3), { mode: "march", phase: T * 2 + i * 0.3 }, 1, T, 600 + i);
    P.banner(g, 160, 1250, 520, "#c8323a", "#f1ece0", T, 1.0); P.banner(g, 900, 1250, 520, "#c8323a", "#f1ece0", T + 1, 1.0);
    const bob = 18 * Math.abs(Math.sin(T * Math.PI * 2.2));
    face(540, 1020 + bob, 1.55, KNIGHT(3), { expr: talk(T, "shout", "stern"), mode: "march", phase: T * 2.2 }, 1, T, 601);
    spear(820, 1900, 980, 560, 20);
    for (let i = 0; i < 4; i++) P.puff(g, 200 + i * 220, 1880, 90, 0.7);
  }],
  [2.95, (t, d, T) => { // "a city of just seven thousand"
    P.sky(g, W, H, "day"); cam(540, 1100, lerp(0.9, 1.0, t / d), 0, T);
    landscape(T, "day", { hy: 900, sunAt: [200, 300, 70] }); field(1000);
    P.city(g, 540, 1080, 1.0, { towers: [[0, 430, 46]], roofc: "#b8603e", seed: 7 });
    P.banner(g, 540, 600, 200, "#2f5fb3", "#e8c547", T, 1.2);
    for (let i = 0; i < 5; i++) ch(260 + i * 140, 1500 + (i % 2) * 60, 0.5, mod(i), { expr: i === 2 ? "gulp" : "nervous", look: 0 }, i < 2 ? 1 : -1, T, 3 + i);
    sweat(600, 1150, 1, T);
    bigNum(7000, "#2f5fb3", "SOLDIERS", back(t / 0.3));
  }],
  [5.25, (t, d, T) => { // "It was November, thirteen twenty-five, in northern Italy."
    screen(); g.fillStyle = "#7fc4e8"; g.fillRect(0, 0, W, H);
    cam(lerp(540, 520, ss(t / d)), lerp(1050, 820, ss(t / d)), lerp(0.95, 1.5, ss((t - 1.6) / 1.6)), 0, T);
    italy();
    const pin = back((T - T_("northern") + 0.1) / 0.35);
    if (pin > 0) {
      ch(560, 705, 0.13 * pin, bol(1), { expr: "stern" }, 1, T, 201); ch(500, 700, 0.13 * pin, mod(1), { expr: "stern" }, -1, T, 202);
      g.beginPath(); g.ellipse(530, 700, 110 * pin, 50 * pin, 0, 0, Math.PI * 2); g.lineWidth = 8; g.strokeStyle = "#e0352b"; g.stroke();
    }
    screen(); stamp("NOVEMBER 1325", 330, "#241726", back((t - 0.15) / 0.3));
  }],
  [8.85, (t, d, T) => { // "Bologna and Modena had hated each other"
    P.sky(g, W, H, "day"); cam(540, 1150, lerp(0.95, 1.05, ss(t / d)), 0, T);
    landscape(T, "day", { hy: 900 }); field(1000, "#86b85c", 3);
    g.fillStyle = "#8a5a33";
    for (let i = 0; i < 2; i++) { g.beginPath(); g.rect(520 + i * 30, 1250, 22, 330); g.fill(); g.lineWidth = 5; g.strokeStyle = TINK; g.stroke(); }
    const lean = 14 * ss(t / 1.2);
    ch(300 + lean, 1780, 1.0, bol(1), { expr: t > 1.2 ? talk(T, "shout2", "stern", 1) : "stern", facing: 1, look: 1, tilt: 0.05 }, 1, T, 11);
    ch(780 - lean, 1780, 1.0, mod(0), { expr: t > 1.2 ? talk(T, "shout2", "stern") : "stern", facing: 1, look: 1, tilt: 0.05 }, -1, T, 12);
    if (t > 1.2) { angry(400, 900, 1.2, T); angry(680, 900, 1.2, T + 0.3); }
    if (t > 0.6) P.burst(g, 540, 880, 30, 90, ((t - 0.6) * 0.8) % 1, "#ff5a4a", 8);
    tag("BOLOGNA", 300, 1840, "#c8323a"); tag("MODENA", 780, 1840, "#2f5fb3");
  }],
  [11.4, (t, d, T) => { // "for generations."
    P.sky(g, W, H, "golden"); cam(540, 1250, lerp(0.95, 0.85, ss(t / d)), 0, T);
    landscape(T, "golden", { hy: 900 }); field(1000, "#86b85c", 3);
    g.fillStyle = "#8a5a33"; for (let i = 0; i < 2; i++) { g.beginPath(); g.rect(520 + i * 30, 1250, 22, 330); g.fill(); g.lineWidth = 5; g.strokeStyle = TINK; g.stroke(); }
    ch(170, 1550, 0.6, bol(1, { moustache: "#e8e8e8", skin: SK[2] }), { expr: "stern", facing: 1, look: 1, tilt: 0.1 }, 1, T, 13);
    ch(920, 1550, 0.6, mod(1, { moustache: "#e8e8e8", skin: SK[0] }), { expr: "stern", facing: 1, look: 1, tilt: 0.1 }, -1, T, 14);
    ch(330, 1800, 0.85, bol(1), { expr: "stern", facing: 1, look: 1 }, 1, T, 11);
    ch(760, 1800, 0.85, mod(0), { expr: "stern", facing: 1, look: 1 }, -1, T, 12);
    ch(90, 1950, 0.45, bol(2, { build: "kid", hat: "hair", hair: "#5a3b2a" }), { expr: "stern", facing: 1, look: 1 }, 1, T, 15);
    ch(990, 1950, 0.45, mod(2, { build: "kid", hat: "hair", hair: "#2a201a" }), { expr: "stern", facing: 1, look: 1 }, -1, T, 16);
    tone("golden", 0.12);
  }],
  [12.55, (t, d, T) => { // "And Modena had just stolen"
    P.sky(g, W, H, "day"); cam(540, 1000, 1.0 + 0.05 * t, 0, T);
    landscape(T, "day", { hy: 1000 }); g.save(); g.translate(-90, 530); g.scale(0.55, 0.55); castleOnHill(T, 0); g.restore();
    field(1150, "#86b85c", 5);
    face(560, 1050, 1.45, mod(3), { expr: t < 0.5 ? "smile" : "grin", look: 1, facing: 1, headTilt: -0.08 }, 1, T, 21);
    tag("MODENA", 560, 1820, "#2f5fb3", 1.1);
  }],
  [13.62, (t, d, T) => { // "one of Bologna's castles."
    P.sky(g, W, H, "day"); cam(560, lerp(980, 1020, ss(t / d)), lerp(1.0, 1.06, ss(t / d)), 0, T);
    landscape(T, "day", { hy: 1000, sunAt: [900, 300, 70] });
    const sw = ss((t - 0.05) / 0.6);
    castleOnHill(T, sw);
    if (sw > 0.2) for (let i = 0; i < 3; i++) ch(430 + i * 130, 690 + 120 * (1 - ss((sw - 0.2) / 0.5)), 0.3, mod(3 + i), { expr: "yell", mode: sw > 0.6 ? "fall" : "stand" }, 1, T, 21 + i);
    ch(190, 1800, 0.9, bol(2), { expr: sw > 0.4 ? "shock" : "neutral", look: 1, facing: 1 }, 1, T, 24);
    screen(); tag("BOLOGNA'S CASTLE", 540, 330, "#c8323a", 1.0);
  }],
  [15.75, (t, d, T) => { // "So Bologna sent"
    P.sky(g, W, H, "day"); shakeAmt = 4; cam(540, 1000, 1.0 + 0.1 * t, 0, T);
    P.city(g, 540, 1500, 2.4, { towers: [[-280, 330], [-100, 460, 40], [180, 380]], seed: 2 });
    P.ground(g, -3000, 4000, 1500, "#c8b07a");
    face(540, 900, 1.6, BOSS, { expr: talk(T, "shout", "shout2"), wave: 1 + 0.4 * Math.sin(T * 14) }, 1, T, 31);
    trumpet(60, 1600, 1.2, T); trumpet(1020, 1600, -1.2, T);
    angry(760, 640, 1.4, T);
  }],
  [16.5, (t, d, T) => { // "a gigantic army."
    P.sky(g, W, H, "day"); cam(540, 1050, lerp(0.8, 0.88, t / d), 0, T);
    P.wallGate(g, -800, 1900, 900, 520, 540, 0);
    P.ground(g, -3000, 4000, 900, "#c8b07a");
    const list = [];
    for (let i = 0; i < 52; i++) list.push([((t * 0.35 + i / 52) % 1), i]);
    list.sort((a, b) => a[0] - b[0]).forEach(([p, i]) => {
      const lane = (i % 7) - 3, y = lerp(910, 1900, p * p), s = lerp(0.12, 0.75, p * p), x = 540 + lane * lerp(40, 320, p * p);
      ch(x, y, s, i % 6 === 0 ? KNIGHT(i) : bol(i), { mode: "march", phase: T * 1.8 + i * 0.37 }, 1, T, 300 + i);
      if (i % 9 === 0) P.banner(g, x + 40 * s, y - 400 * s, 900 * s, "#c8323a", "#f1ece0", T + i, s * 1.4);
    });
    ch(150, 600, 0.45, BOSS, { expr: "shout", wave: 1 + 0.3 * Math.sin(T * 12) }, 1, T, 31);
  }],
  [18.15, (t, d, T) => { // "Knights."
    P.sky(g, W, H, "day"); cam(540, 1250, lerp(1.0, 1.06, t), 0, T);
    landscape(T, "day", { hy: 1000 }); field(1050);
    const sy = P.horse(g, 470, 1850, 1.9, T * 1.2, "#f2efe8");
    ch(450, 1850 + sy + 240, 0.8, KNIGHT(3), { expr: "stern", mode: "sit" }, 1, T, 401);
    spear(330, 1330, 1000, 850, 16);
    P.banner(g, 990, 865, 130, "#c8323a", "#f1ece0", T, 0.8);
  }],
  [18.7, (t, d, T) => { // "Archers."
    P.sky(g, W, H, "day"); cam(540, 1150, 1.0 + 0.05 * t, 0, T);
    landscape(T, "day", { hy: 1000 }); field(1050, "#86b85c", 8);
    [[220, 1500, 0.55], [860, 1500, 0.55], [540, 1800, 0.85]].forEach(([x, y, s], i) => { ch(x, y, s, bol(i + 4, { hat: "cap", cap: "#5d7a3a" }), { expr: "stern" }, 1, T, 410 + i); bow(x - 190 * s, y - 480 * s, s); });
  }],
  [19.23, (t, d, T) => { // "Banners as far as the eye could see."
    P.sky(g, W, H, "day"); cam(lerp(500, 700, t), 1000, lerp(0.95, 0.72, ss(t / 1.5)), 0, T);
    landscape(T, "day", { hy: 820, x0: -2500, x1: 4500 }); P.ground(g, -3000, 5000, 900, "#86b85c");
    army(T, 880, 1700, 11, (id) => (id % 13 < 6 ? KNIGHT(id) : bol(id)), { x0: -2000, x1: 4200, bannerEvery: 2 });
  }],
  [21.8, (t, d, T) => { // "Modena looked at those numbers..."
    P.sky(g, W, H, "day"); cam(540, 1000, 1.0 + 0.08 * t, 0, T);
    landscape(T, "day", { hy: 1050 });
    for (let r = 0; r < 4; r++) for (let i = 0; i < 30; i++) ch(-20 + i * 22 + r * 9, 1060 + r * 16, 0.08, bol(i + r), { mode: "march", phase: T * 2 + i }, 1, T, 500 + i);
    field(1120, "#86b85c", 9);
    face(620, 1150, 1.5, mod(0, { moustache: "#2a201a" }), { expr: t < 0.9 ? "nervous" : "gulp", look: -1, facing: -1 }, -1, T, 40);
    sweat(400, 900, 1.6, T); sweat(860, 960, 1.2, T + 0.5);
    screen(); tag("32,000", 270, 330, "#c8323a", 1.9); tag("vs", 545, 330, "#241726", 1.2); tag("7,000", 820, 330, "#2f5fb3", 1.9);
  }],
  [23.55, (t, d, T) => { // "...and attacked anyway."
    P.sky(g, W, H, "day"); shakeAmt = 7;
    cam(540, 1150, lerp(1.0, 1.25, easeOut(t / 0.8)), 0, T);
    landscape(T, "day", { hy: 950 }); field(1050, "#86b85c", 10);
    const pos = [[680, 1300], [900, 1300], [620, 1460], [1000, 1460], [760, 1600], [960, 1640], [820, 1820]];
    pos.forEach(([x, y], i) => {
      const adv = easeOut(t / 1.0) * 320;
      ch(x - adv, y + adv * 0.3, (0.42 + (y - 1200) * 0.0011) * (1 + adv / 1500), mod(i), { expr: talk(T, "yell", "shout", i), mode: "fall", look: -1, facing: -1 }, -1, T, 40 + i);
    });
    P.banner(g, 1000 - easeOut(t) * 300, 1300, 560, "#2f5fb3", "#e8c547", T, 1.1, -1);
    speedLines(T, 10);
  }],
  [25.15, (t, d, T) => { // "By nightfall,"
    const k = ss(t / d);
    P.sky(g, W, H, k > 0.5 ? "dusk" : "golden"); cam(540, 1050, 1.0, 0, T);
    sun(540, lerp(700, 1080, k), 120, "#ff9a4a");
    landscape(T, "night", { hy: 1000 }); field(1080, "#6f9a52", 11);
    [[260, 1500, 0.6], [700, 1650, -0.4], [900, 1450, 1.2]].forEach(([x, y, r]) => { g.save(); g.translate(x, y); g.rotate(r); spear(-120, 0, 120, 0, 12); g.restore(); });
    g.beginPath(); g.ellipse(480, 1720, 70, 34, 0, Math.PI, 0); g.fillStyle = "#aab3be"; g.fill(); g.lineWidth = 6; g.strokeStyle = P.INK; g.stroke();
    tone("dusk", 0.15 + 0.2 * k);
  }],
  [26.05, (t, d, T) => { // "Bologna's giant army was running"
    P.sky(g, W, H, "dusk"); cam(540, 1050, lerp(0.95, 1.05, t / d), 0.02, T);
    landscape(T, "night", { hy: 950 });
    P.city(g, -60, 1000, 0.8, { towers: [[-160, 330], [-40, 420, 40], [90, 360]], seed: 1 });
    field(1050, "#6f9a52", 12);
    for (let i = 0; i < 10; i++) {
      const sp = 420 + rnd(i, 1) * 200, x = 1500 - ((t * sp + i * 330) % 2200), y = 1250 + (i % 3) * 210;
      P.puff(g, x + 160, y - 20, 60, 0.6);
      ch(x, y, 0.55 + (i % 3) * 0.12, bol(i), { expr: i % 2 ? "shock" : "dazed", mode: "fall", phase: T * 3 + i }, -1, T, 50 + i);
    }
    g.save(); g.translate(700, 1700); g.rotate(1.3); P.banner(g, 0, 0, 260, "#c8323a", "#f1ece0", 0, 1); g.restore();
    tone("dusk", 0.25);
  }],
  [27.45, (t, d, T) => { // "home."
    P.sky(g, W, H, "dusk"); shakeAmt = 6; cam(540, 1000, 1.0, 0.04, T);
    landscape(T, "night", { hy: 1100 }); field(1150, "#6f9a52", 13);
    speedLines(T, 16);
    cam(540, 1000, 1.0, 0.04, T);
    face(560, 950 + 15 * Math.sin(T * 20), 1.5, bol(2), { expr: "shock", mode: "fall", facing: -1 }, -1, T, 52);
    sweat(320, 760, 1.4, T); sweat(800, 720, 1.2, T + 0.4);
    tone("dusk", 0.25);
  }],
  [28.6, (t, d, T) => { // "Modena chased them all the way to the city"
    P.sky(g, W, H, "dusk"); cam(lerp(620, 480, ss(t / d)), 1180, 0.95, 0, T);
    P.wallGate(g, -800, 1400, 1150, 520, 250, ss((t - 1.6) / 0.4));
    P.ground(g, -3000, 4000, 1150, "#7aa25a"); tufts(-400, 1500, 1200, 1900, 14, 40);
    for (let i = 0; i < 3; i++) { const x = 520 - t * 230 + i * 120; if (x > 180) ch(x, 1300 + i * 30, 0.45, bol(i), { expr: "shock", mode: "fall" }, -1, T, 60 + i); }
    for (let i = 0; i < 5; i++) { const x = 1250 - t * 260 + i * 150; ch(x, 1450 + (i % 2) * 140, 0.6, mod(i), { expr: talk(T, "yell", "grin", i), mode: "fall", phase: T * 2.5 + i }, -1, T, 70 + i); }
    tone("dusk", 0.2);
  }],
  [30.6, (t, d, T) => { // "walls." — gate slams
    P.sky(g, W, H, "dusk"); shakeAmt = t < 0.25 ? 14 : 0; cam(300, 1100, 1.35, 0, T);
    P.wallGate(g, -800, 1400, 1150, 520, 250, 1);
    P.ground(g, -3000, 4000, 1150, "#7aa25a");
    for (let i = 0; i < 3; i++) ch(80 + i * 220, 1500, 0.62, mod(i + 2), { expr: "laugh", mode: i === 1 ? "fall" : "stand", headTilt: 0.08 * Math.sin(T * 10 + i) }, i === 2 ? -1 : 1, T, 75 + i);
    if (t < 0.4) P.burst(g, 250, 900, 60, 200, t * 2.5, "#fff3b0");
    tone("dusk", 0.2);
  }],
  [31.45, (t, d, T) => { // "Then, right outside the gates, they held a horse"
    P.sky(g, W, H, "golden");
    cam(540 + t * 120, 1180, 0.74, 0, T);
    P.wallGate(g, -1200, 2600, 1000, 520, 700, 1);
    for (let i = 0; i < 6; i++) ch(-400 + i * 400, 480, 0.36, bol(i), { expr: i % 2 ? "stern" : "pained" }, 1, T, 80 + i);
    P.ground(g, -3000, 4000, 1000, "#c8b07a");
    P.banner(g, 1500, 1720, 300, "#2f5fb3", "#e8c547", T, 0.9); P.banner(g, 1500, 1350, 300, "#2f5fb3", "#e8c547", T + 1, 0.9);
    for (let i = 0; i < 3; i++) {
      const x = -600 + t * (520 + i * 40) + i * 260, y = 1450 + i * 120, ph = T * 2.6 + i * 0.3;
      P.puff(g, x - 230, y - 20, 70, 0.55);
      const sy = P.horse(g, x, y, 0.85, ph, ["#a0673a", "#f2efe8", "#5a3a26"][i]);
      ch(x - 10, y + sy + 110, 0.32, mod(i + 2), { expr: "yell", mode: "sit", wave: Math.sin(T * 8 + i) }, 1, T, 90 + i);
    }
  }],
  [33.95, (t, d, T) => { // "horse race." — close on the galloping riders
    P.sky(g, W, H, "golden"); shakeAmt = 5; cam(540, 1150, 1.0, 0, T);
    P.wallGate(g, -800, 2000, 1000, 520, 1500, 1);
    P.ground(g, -3000, 4000, 1000, "#c8b07a");
    for (let i = 0; i < 2; i++) {
      const x = -300 + t * 900 + i * 520, y = 1500 + i * 260;
      P.puff(g, x - 300, y - 20, 90, 0.6);
      const sy = P.horse(g, x, y, 1.0 + i * 0.25, T * 3 + i * 0.4, ["#5a3a26", "#a0673a"][i]);
      ch(x - 10, y + sy + 130 * (1 + i * 0.25), 0.4 * (1 + i * 0.25), mod(i + 4), { expr: talk(T, "yell", "laugh", i), mode: "sit", wave: 1 + 0.3 * Math.sin(T * 10 + i) }, 1, T, 98 + i);
    }
    speedLines(T, 8);
  }],
  [34.6, (t, d, T) => { // "Just to rub it in."
    P.sky(g, W, H, "golden"); cam(560, 1250, lerp(0.85, 0.92, t / 2), 0, T);
    P.wallGate(g, -800, 2000, 900, 600, 1400, 1);
    ch(250, 560, 0.55, bol(1), { expr: "pained", tilt: -0.05 }, 1, T, 95); ch(800, 560, 0.55, bol(4), { expr: "stern" }, -1, T, 96);
    P.ground(g, -3000, 4000, 900, "#c8b07a");
    const sy = P.horse(g, 560, 1700, 1.15, T * 2.6, "#f2efe8");
    ch(530, 1700 + sy + 150, 0.48, mod(5), { expr: talk(T, "laugh", "yell"), mode: "sit", wave: 1 + 0.4 * Math.sin(T * 12) }, 1, T, 97);
  }],
  [36.2, (t, d, T) => { // "On the way back, a soldier"
    P.sky(g, W, H, "golden"); cam(540, 1150, 0.95, 0, T);
    landscape(T, "golden", { hy: 950, sunAt: [850, 400, 90] }); field(1050, "#86b85c", 15);
    g.beginPath(); g.moveTo(-500, 1650); g.lineTo(1600, 1550); g.lineWidth = 180; g.strokeStyle = "#d9bb84"; g.stroke();
    const rim = P.well(g, 900, 1450, 300); P.bucket(g, 970, rim + 6, 80);
    const x = lerp(-150, 420, clamp(t / d, 0, 1));
    for (let i = 0; i < 2; i++) ch(x - 260 - i * 200, 1620, 0.55, mod(i + 3), { expr: "grin", mode: "stroll", phase: T * 1.8 + i }, 1, T, 102 + i);
    ch(x, 1640, 0.62, HERO, { expr: "smile", mode: "stroll", phase: T * 1.8, facing: 1 }, 1, T, 101);
  }],
  [37.6, (t, d, T) => { // "spotted a well,"
    P.sky(g, W, H, "golden"); cam(540, 1000, 1.0 + 0.06 * t, 0, T);
    landscape(T, "golden", { hy: 1050 }); field(1100, "#86b85c", 16);
    P.well(g, 900, 1150, 220);
    face(420, 980, 1.5, HERO, { expr: t > 0.25 ? "talk" : "smile", look: 1, facing: 1 }, 1, T, 101);
    if (t > 0.25) { const k = back((t - 0.25) / 0.2); g.save(); g.translate(700, 560); g.scale(k, k); g.font = "900 160px Montserrat"; g.textAlign = "center"; g.lineWidth = 18; g.strokeStyle = "#111"; g.strokeText("!", 0, 0); g.fillStyle = "#ffd54a"; g.fillText("!", 0, 0); g.restore(); }
  }],
  [38.7, (t, d, T) => { // "with a wooden bucket."
    P.sky(g, W, H, "golden");
    const k = ss(t / 0.5); cam(lerp(800, 690, k), lerp(1300, 1240, k), lerp(1.4, 2.2, k), 0, T);
    landscape(T, "day", { hy: 950 }); field(1050);
    g.beginPath(); g.moveTo(-500, 1650); g.lineTo(1600, 1550); g.lineWidth = 180; g.strokeStyle = "#d9bb84"; g.stroke();
    const rim = P.well(g, 690, 1450, 300);
    P.bucket(g, 760, rim + 6, 80);
    P.burst(g, 760, rim - 30, 50, 140, t * 1.6); sparkle(760, rim - 40, 70, T);
  }],
  [39.9, (t, d, T) => { // "So he took it."
    P.sky(g, W, H, "golden"); cam(560, 1120, 1.45 + 0.05 * t, 0, T);
    landscape(T, "day", { hy: 950 }); field(1050);
    const rim = P.well(g, 820, 1520, 320);
    const lift = back((t - 0.15) / 0.5);
    ch(480, 1700, 0.8, HERO, { expr: lift > 0.5 ? "yell" : "smile", wave: lift > 0.05 ? lift : undefined, facing: 1 }, 1, T, 101);
    const [hx, hy] = handUp(480, 1700, 0.8);
    P.bucket(g, lerp(900, hx + 10, clamp(lift, 0, 1.1)), lerp(rim + 6, hy + 60, clamp(lift, 0, 1.1)), lerp(85, 120, clamp(lift, 0, 1)), 0.1 * Math.sin(T * 6));
    if (lift > 0.9) sparkle(hx + 10, hy, 80, T);
  }],
  [41.35, (t, d, T) => { // "Today, everyone says this war was fought"
    legendWide(t, d, T);
    screen(); stamp("THE LEGEND", 300, "#6e4a2a", back((t - 0.2) / 0.3), 0.04);
  }],
  [43.3, (t, d, T) => { // "over a stolen bucket."
    const pull = 40 * Math.sin(T * 6);
    P.sky(g, W, H, "day"); cam(540, 1000, 1.0, 0, T);
    landscape(T, "day", { hy: 1000 }); field(1050);
    face(170 + pull, 950, 1.25, bol(1), { expr: "shout2", tilt: -0.1 }, 1, T, 111);
    face(910 + pull, 950, 1.25, mod(1), { expr: "shout2", tilt: -0.1 }, -1, T, 112);
    g.beginPath(); g.moveTo(330 + pull, 1450); g.lineTo(750 + pull, 1450); g.lineWidth = 30; g.strokeStyle = P.INK; g.stroke(); g.lineWidth = 18; g.strokeStyle = "#a8743f"; g.stroke();
    P.bucket(g, 540 + pull, 1660, 200, 0.1 * Math.sin(T * 8));
    angry(540, 700, 1.4, T);
    tone("sepia", 0.75); parchment();
    screen(); stamp("THE LEGEND", 300, "#6e4a2a", 1, 0.04);
  }],
  [45.35, (t, d, T) => { // "It wasn't." — tear
    const off = easeOut(t / 0.9) * 330, rot = easeOut(t / 0.9) * 0.09;
    screen(); g.fillStyle = "#120d14"; g.fillRect(0, 0, W, H);
    const half = (side) => {
      g.save(); g.translate(W / 2 + side * off, H / 2); g.rotate(side * rot); g.translate(-W / 2, -H / 2);
      g.beginPath();
      if (side < 0) { g.moveTo(0, 0); g.lineTo(560, 0); for (let y = 0; y <= H; y += 80) g.lineTo(540 + (y / 80 % 2 ? 30 : -25), y); g.lineTo(0, H); }
      else { g.moveTo(W, 0); g.lineTo(560, 0); for (let y = 0; y <= H; y += 80) g.lineTo(540 + (y / 80 % 2 ? 30 : -25), y); g.lineTo(W, H); }
      g.closePath(); g.clip(); g.drawImage(legendSnap, 0, 0); g.restore();
    };
    half(-1); half(1);
  }],
  [46.45, (t, d, T) => { // "The bucket was the souvenir."
    P.sky(g, W, H, "golden"); cam(540, 1150, lerp(1.0, 1.12, t / d), 0, T);
    P.city(g, 540, 1100, 1.6, { towers: [[0, 430, 46]], roofc: "#b8603e", seed: 7 });
    P.ground(g, -3000, 4000, 1080, "#c8b07a");
    for (let i = 0; i < 6; i++) { if (i === 2 || i === 3) continue; ch(60 + i * 190, 1550 + (i % 2) * 40, 0.55, mod(i), { expr: talk(T, "yell", "laugh", i), mode: "fall", headTilt: 0.06 * Math.sin(T * 9 + i) }, i < 3 ? 1 : -1, T, 130 + i); }
    const hop = Math.abs(Math.sin(T * 6)) * 25;
    ch(540, 1720 - hop, 0.85, HERO, { expr: "laugh", mode: "fall" }, 1, T, 101);
    P.bucket(g, 540, 1720 - hop - 860, 150, 0.08 * Math.sin(T * 6));
    sparkle(540, 1720 - hop - 930, 110, T);
    for (let i = 0; i < 40; i++) {
      const x = (rnd(i, 1) * 1400 + T * 40 * (rnd(i, 2) - 0.5)) % 1200 - 60, y = ((rnd(i, 3) * 1600 + T * 260 * (0.6 + rnd(i, 4))) % 1700) + 300;
      g.save(); g.translate(x, y); g.rotate(T * 4 + i); g.fillStyle = ["#2f5fb3", "#e8c547", "#ffffff"][i % 3]; g.fillRect(-9, -5, 18, 10); g.restore();
    }
    screen(); stamp("SOUVENIR", 300, "#2f5fb3", back((T - T_("souvenir") + 0.05) / 0.3), -0.06);
  }],
  [48.6, (t, d, T) => { // "And seven hundred years later,"
    museum(t, d, T, lerp(0.9, 1.0, ss(t / d)), 540, 1050);
    ch(200, 1650, 0.95, TOURIST, { expr: "smile", look: 1, facing: 1 }, 1, T, 140);
    screen(); stamp("700 YEARS LATER", 300, "#241726", back((t - 0.1) / 0.3));
  }],
  [50.25, (t, d, T) => { // "Modena still keeps it"
    museum(t, d, T, lerp(1.9, 2.05, t / d), 600, 930); sparkle(600, 870, 120, T);
  }],
  [51.45, (t, d, T) => { // "on display." — deadpan look
    museum(t, d, T, lerp(1.0, 1.15, ss(t / d)), lerp(600, 520, ss(t / d)), 1000);
    face(300, 1000 + 6 * Math.sin(T * 3), 1.45, TOURIST, { expr: "deadpan", look: 0, facing: 0, blink: t > 0.7 && t < 0.82 }, 1, T, 140);
  }],
];
const SH = SHOTS.map((s) => s[0]);

// ---------------- captions ----------------
const allWords = segs.flatMap((s) => s.words);
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
  g.fillStyle = "#ffffff"; g.fillText(txt, 0, 0);
  g.restore();
}

// ---------------- frame ----------------
const LEGEND_I = SH.indexOf(43.3), TEAR_I = SH.indexOf(45.35);
window.SHOT_STARTS = SH;
window.renderFrame = (f) => {
  const T = f / FPS;
  let i = SH.length - 1; while (i > 0 && T < SH[i]) i--;
  const t = T - SH[i], d = (i + 1 < SH.length ? SH[i + 1] : DUR) - SH[i];
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
  if (i === TEAR_I) {
    const dd = SH[TEAR_I] - SH[LEGEND_I]; shakeAmt = 0;
    SHOTS[LEGEND_I][1](dd - 0.01, dd, SH[TEAR_I] - 0.01);
    screen(); legendSnap.getContext("2d").drawImage(cv, 0, 0);
    g.clearRect(0, 0, W, H);
  }
  shakeAmt = 0;
  SHOTS[i][1](t, d, T);
  screen();
  const fl = [41.35, 48.6].map((s) => clamp(1 - Math.abs(T - s) / 0.12, 0, 1)).reduce((a, b) => Math.max(a, b), 0);
  if (fl > 0) { g.fillStyle = `rgba(255,255,255,${fl})`; g.fillRect(0, 0, W, H); }
  const v = g.createRadialGradient(W / 2, H / 2, 600, W / 2, H / 2, 1250); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.28)");
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  captions(T);
  return true;
};
window.ready = true;
