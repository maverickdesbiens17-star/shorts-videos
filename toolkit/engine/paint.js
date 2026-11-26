// Flat cartoon scenery painters (screen-space canvas, ink outlines). All original.
export const INK = "#241726";
export const rnd = (seed, k = 0) => { const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ss = (t) => { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
export const back = (t) => { t = clamp(t, 0, 1); const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

const ink = (g, w) => { g.lineWidth = w; g.strokeStyle = INK; g.lineJoin = "round"; g.lineCap = "round"; g.stroke(); };
export const shadeHex = (c, k) => {
  const n = parseInt(c.slice(1), 16), f = (v) => Math.min(255, Math.round(v * k)).toString(16).padStart(2, "0");
  return `#${f((n >> 16) & 255)}${f((n >> 8) & 255)}${f(n & 255)}`;
};

export const SKIES = {
  day: ["#4fb3f0", "#9fdcff", "#d9f3ff"],
  golden: ["#f08a4b", "#ffc078", "#ffe7b0"],
  dusk: ["#2b2f6b", "#7a4f8f", "#f0906a"],
  night: ["#0e1540", "#22336e", "#4a5a96"],
  indoor: ["#3a2e2a", "#4d3d34", "#5c4a3e"],
};
export const sky = (g, W, H, key, horizon = 0.62) => {
  const c = SKIES[key], gr = g.createLinearGradient(0, 0, 0, H * horizon);
  gr.addColorStop(0, c[0]); gr.addColorStop(0.6, c[1]); gr.addColorStop(1, c[2]);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
};

export const cloud = (g, x, y, s, col = "#ffffff") => {
  g.beginPath();
  [[0, 0, 60], [55, -25, 55], [110, 0, 58], [55, 15, 60], [-45, 10, 45], [155, 15, 42]].forEach(([dx, dy, r]) => {
    g.moveTo(x + (dx + r) * s, y + dy * s); g.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
  });
  g.fillStyle = col; g.fill();
};

/** rolling hill band from x0..x1 at base y, height amp, filled to bottom yb */
export const hills = (g, x0, x1, y, amp, col, seed, yb = 4000, outline = 5) => {
  g.beginPath(); g.moveTo(x0, yb);
  for (let x = x0; x <= x1; x += 20) {
    const t = x * 0.002 + seed;
    g.lineTo(x, y - amp * (0.55 * Math.sin(t * 2.1) + 0.3 * Math.sin(t * 4.7 + 1) + 0.15 * Math.sin(t * 9.3 + 2)));
  }
  g.lineTo(x1, yb); g.closePath(); g.fillStyle = col; g.fill(); if (outline) ink(g, outline);
};

export const cypress = (g, x, y, h, col = "#2f6b3a") => {
  const w = h * 0.2;
  g.beginPath(); g.moveTo(x, y - h);
  g.bezierCurveTo(x + w, y - h * 0.7, x + w * 1.1, y - h * 0.2, x + w * 0.3, y);
  g.lineTo(x - w * 0.3, y);
  g.bezierCurveTo(x - w * 1.1, y - h * 0.2, x - w, y - h * 0.7, x, y - h);
  g.fillStyle = col; g.fill(); ink(g, Math.max(2, h * 0.025));
  g.beginPath(); g.moveTo(x + w * 0.15, y - h * 0.85); g.quadraticCurveTo(x + w * 0.55, y - h * 0.4, x + w * 0.2, y - h * 0.08);
  g.lineWidth = h * 0.05; g.strokeStyle = shadeHex(col, 0.75); g.stroke();
};

export const crenels = (g, x0, x1, y, mh, col, lw) => {
  const n = Math.max(2, Math.round((x1 - x0) / (mh * 1.6))), w = (x1 - x0) / (2 * n - 1);
  for (let i = 0; i < n; i++) { g.beginPath(); g.rect(x0 + i * 2 * w, y - mh, w, mh); g.fillStyle = col; g.fill(); ink(g, lw); }
};

/** square medieval tower; top at y-h */
export const tower = (g, x, y, w, h, col = "#d9a06a", roof = null, lw = 4) => {
  g.beginPath(); g.rect(x - w / 2, y - h, w, h); g.fillStyle = col; g.fill(); ink(g, lw);
  g.fillStyle = shadeHex(col, 0.8); g.fillRect(x + w * 0.18, y - h, w * 0.32, h);
  g.beginPath(); g.rect(x - w / 2, y - h, w, h); ink(g, lw);
  for (let i = 1; i < h / (w * 1.4); i++) { // slit windows
    g.beginPath(); g.rect(x - w * 0.08, y - h + i * w * 1.4, w * 0.16, w * 0.45); g.fillStyle = INK; g.fill();
  }
  if (roof) {
    g.beginPath(); g.moveTo(x - w * 0.62, y - h); g.lineTo(x, y - h - w * 1.1); g.lineTo(x + w * 0.62, y - h); g.closePath();
    g.fillStyle = roof; g.fill(); ink(g, lw);
  } else crenels(g, x - w / 2 - w * 0.06, x + w / 2 + w * 0.06, y - h, w * 0.22, col, lw * 0.8);
};

export const house = (g, x, y, w, h, wall, roofc, lw = 4) => {
  g.beginPath(); g.rect(x - w / 2, y - h, w, h); g.fillStyle = wall; g.fill(); ink(g, lw);
  g.beginPath(); g.moveTo(x - w * 0.6, y - h); g.lineTo(x, y - h - w * 0.45); g.lineTo(x + w * 0.6, y - h); g.closePath();
  g.fillStyle = roofc; g.fill(); ink(g, lw);
  g.beginPath(); g.rect(x - w * 0.15, y - h * 0.55, w * 0.3, h * 0.3); g.fillStyle = "#4a3426"; g.fill(); ink(g, lw * 0.7);
};

/** walled city skyline seen from afar */
export const city = (g, x, y, s, opt) => {
  const { wall = "#d9b48a", roofc = "#c9573e", towers = [], seed = 1 } = opt;
  for (let i = 0; i < 9; i++) house(g, x + (i - 4) * 70 * s + rnd(seed, i) * 20 * s, y - 40 * s, 70 * s, (50 + rnd(seed, i + 9) * 40) * s, i % 2 ? "#f2d9b0" : "#e8c597", roofc, 3 * s);
  towers.forEach(([dx, h, w = 34]) => tower(g, x + dx * s, y - 40 * s, w * s, h * s, "#cf8f5b", null, 3.5 * s));
  g.beginPath(); g.rect(x - 340 * s, y - 60 * s, 680 * s, 60 * s); g.fillStyle = wall; g.fill(); ink(g, 4 * s);
  crenels(g, x - 340 * s, x + 340 * s, y - 60 * s, 16 * s, wall, 3 * s);
};

/** big city wall with a gate, filling x0..x1, base y, height h; gate at gx; door 0 open..1 closed */
export const wallGate = (g, x0, x1, y, h, gx, door = 0, col = "#d6ae80") => {
  g.beginPath(); g.rect(x0, y - h, x1 - x0, h); g.fillStyle = col; g.fill(); ink(g, 6);
  g.strokeStyle = shadeHex(col, 0.82); g.lineWidth = 3;
  for (let r = 1; r < h / 60; r++) for (let c = 0; c < (x1 - x0) / 110; c++) {
    const xx = x0 + c * 110 + (r % 2) * 55; g.beginPath(); g.moveTo(xx, y - r * 60); g.lineTo(xx + 70, y - r * 60); g.stroke();
  }
  crenels(g, x0, x1, y - h, 40, col, 5);
  const gw = h * 0.55, gh = h * 0.72;
  g.beginPath(); g.moveTo(gx - gw / 2, y); g.lineTo(gx - gw / 2, y - gh + gw / 2); g.arc(gx, y - gh + gw / 2, gw / 2, Math.PI, 0); g.lineTo(gx + gw / 2, y); g.closePath();
  g.fillStyle = "#2a1c1e"; g.fill(); ink(g, 6);
  if (door > 0) {
    g.save(); g.clip();
    g.fillStyle = "#7a4f2e"; g.fillRect(gx - gw / 2, y - gh, gw, gh * door);
    g.strokeStyle = INK; g.lineWidth = 4;
    for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(gx - gw / 2 + i * gw / 6, y - gh); g.lineTo(gx - gw / 2 + i * gw / 6, y - gh + gh * door); g.stroke(); }
    g.restore();
  }
  tower(g, gx - gw * 0.95, y, gw * 0.6, h * 1.35, col, null, 6);
  tower(g, gx + gw * 0.95, y, gw * 0.6, h * 1.35, col, null, 6);
};

/** waving two-colour banner on a pole; base at x,y, pole height h */
export const banner = (g, x, y, h, c1, c2, t, s = 1, dir = 1) => {
  g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h); g.lineWidth = 7 * s; g.strokeStyle = INK; g.stroke();
  g.lineWidth = 4 * s; g.strokeStyle = "#8a5a33"; g.stroke();
  const fw = 120 * s * dir, fh = 80 * s, top = y - h + 8 * s;
  const wv = (u) => 9 * s * Math.sin(u * 5 - t * 7);
  const pts = [];
  for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([x + fw * u, top + wv(u) * u]); }
  for (let i = 10; i >= 0; i--) { const u = i / 10; pts.push([x + fw * u, top + fh + wv(u) * u]); }
  g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.closePath();
  const style = c1 === "#c8323a" ? "cross" : c1 === "#2f5fb3" ? "vsplit" : "hsplit";
  g.fillStyle = style === "cross" ? "#f4efe2" : style === "vsplit" ? "#e8c547" : c1; g.fill();
  g.save(); g.clip();
  g.beginPath();
  if (style === "cross") {
    g.fillStyle = "#c8323a";
    for (let i = 0; i <= 10; i++) { const u = i / 10; g.lineTo(x + fw * u, top + fh * 0.4 + wv(u) * u); }
    for (let i = 10; i >= 0; i--) { const u = i / 10; g.lineTo(x + fw * u, top + fh * 0.6 + wv(u) * u); }
    g.fill(); g.beginPath(); g.rect(x + fw * 0.4 - (dir < 0 ? fw * 0.2 : 0), top - 30 * s, Math.abs(fw) * 0.2, fh + 60 * s); g.fill();
  } else if (style === "vsplit") {
    g.rect(x + fw * 0.5, top - 30 * s, fw * 0.6, fh + 60 * s); g.fillStyle = "#2f5fb3"; g.fill();
  } else {
    for (let i = 0; i <= 10; i++) { const u = i / 10; g.lineTo(x + fw * u, top + fh * 0.5 + wv(u) * u); }
    for (let i = 10; i >= 0; i--) { const u = i / 10; g.lineTo(x + fw * u, top + fh + 10 * s + wv(u) * u); }
    g.fillStyle = c2; g.fill();
  }
  g.restore();
  g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.closePath(); ink(g, 4 * s);
};

/** oak bucket, bottom-centre at x,y, width w */
export const bucket = (g, x, y, w, rot = 0, handle = true) => {
  g.save(); g.translate(x, y); g.rotate(rot);
  const h = w * 0.85, bw = w * 0.78, lw = Math.max(2, w * 0.05);
  if (handle) { g.beginPath(); g.ellipse(0, -h, w * 0.52, w * 0.55, 0, Math.PI, 0); g.lineWidth = lw * 1.6; g.strokeStyle = INK; g.stroke(); g.lineWidth = lw * 0.7; g.strokeStyle = "#6d6f78"; g.stroke(); }
  g.beginPath(); g.moveTo(-bw / 2, 0); g.lineTo(-w / 2, -h); g.lineTo(w / 2, -h); g.lineTo(bw / 2, 0); g.closePath();
  g.fillStyle = "#a8743f"; g.fill();
  g.save(); g.clip();
  g.fillStyle = "#c28a4f"; g.fillRect(-w / 2, -h, w * 0.35, h);
  g.strokeStyle = "#6e4523"; g.lineWidth = lw * 0.6;
  for (let i = 1; i < 6; i++) { const u = i / 6 - 0.5; g.beginPath(); g.moveTo(u * bw, 0); g.lineTo(u * w, -h); g.stroke(); }
  g.fillStyle = "#4d4f58"; g.fillRect(-w, -h * 0.82, w * 2, h * 0.11); g.fillRect(-w, -h * 0.28, w * 2, h * 0.11);
  g.restore();
  g.beginPath(); g.moveTo(-bw / 2, 0); g.lineTo(-w / 2, -h); g.lineTo(w / 2, -h); g.lineTo(bw / 2, 0); g.closePath(); ink(g, lw);
  g.beginPath(); g.ellipse(0, -h, w / 2, w * 0.1, 0, 0, Math.PI * 2); g.fillStyle = "#3b2416"; g.fill(); ink(g, lw);
  g.restore();
};

/** stone well, base centre x,y, width w; returns rim y */
export const well = (g, x, y, w) => {
  const h = w * 0.55, lw = w * 0.025;
  // posts + roof
  g.fillStyle = "#7a4f2e";
  [[-0.42], [0.42]].forEach(([u]) => { g.beginPath(); g.rect(x + u * w - w * 0.04, y - h - w * 0.9, w * 0.08, w * 0.9); g.fill(); ink(g, lw); });
  g.beginPath(); g.moveTo(x - w * 0.62, y - h - w * 0.82); g.lineTo(x, y - h - w * 1.18); g.lineTo(x + w * 0.62, y - h - w * 0.82); g.closePath();
  g.fillStyle = "#b5523b"; g.fill(); ink(g, lw);
  g.beginPath(); g.moveTo(x - w * 0.42, y - h - w * 0.62); g.lineTo(x + w * 0.42, y - h - w * 0.62); g.lineWidth = w * 0.05; g.strokeStyle = INK; g.stroke(); g.lineWidth = w * 0.03; g.strokeStyle = "#8a5a33"; g.stroke();
  // stone body
  g.beginPath(); g.rect(x - w / 2, y - h, w, h); g.fillStyle = "#b9b2a6"; g.fill();
  g.save(); g.clip(); g.strokeStyle = "#8d867b"; g.lineWidth = lw * 0.8;
  for (let r = 0; r < 4; r++) for (let c = -3; c < 4; c++) { g.beginPath(); g.rect(x + c * w * 0.2 + (r % 2) * w * 0.1, y - h + r * h / 4, w * 0.2, h / 4); g.stroke(); }
  g.restore(); g.beginPath(); g.rect(x - w / 2, y - h, w, h); ink(g, lw);
  g.beginPath(); g.ellipse(x, y - h, w / 2, w * 0.09, 0, 0, Math.PI * 2); g.fillStyle = "#a39c90"; g.fill(); ink(g, lw);
  g.beginPath(); g.ellipse(x, y - h, w * 0.4, w * 0.06, 0, 0, Math.PI * 2); g.fillStyle = "#1d1a24"; g.fill();
  return y - h;
};

/** cartoon horse, side view facing +x (dir=-1 flips); feet at y; size s; gallop phase */
export const horse = (g, x, y, s, phase, col = "#a0673a", dir = 1) => {
  g.save(); g.translate(x, y); g.scale(s * dir, s);
  const bob = -8 * Math.abs(Math.sin(phase * Math.PI * 2)), lw = 6;
  const leg = (hx, a, c) => { g.beginPath(); g.moveTo(hx, -150 + bob); g.lineTo(hx + 30 * Math.sin(a), -75 + bob * 0.5); g.lineTo(hx + 40 * Math.sin(a + 0.8), -2); g.lineWidth = 22; g.strokeStyle = INK; g.stroke(); g.lineWidth = 12; g.strokeStyle = c; g.stroke(); };
  const p = phase * Math.PI * 2;
  leg(-70, Math.sin(p + 1.2), shadeHex(col, 0.75)); leg(70, Math.sin(p + 2.6), shadeHex(col, 0.75));
  // tail
  g.beginPath(); g.moveTo(-115, -200 + bob); g.quadraticCurveTo(-175, -190 + bob + 10 * Math.sin(p), -170, -110 + bob); g.lineWidth = 26; g.strokeStyle = INK; g.stroke(); g.lineWidth = 16; g.strokeStyle = "#3b2618"; g.stroke();
  // body
  g.beginPath(); g.ellipse(0, -190 + bob, 130, 62, 0, 0, Math.PI * 2); g.fillStyle = col; g.fill(); ink(g, lw);
  // neck + head
  g.beginPath(); g.moveTo(80, -225 + bob); g.lineTo(140, -330 + bob); g.lineTo(190, -300 + bob); g.lineTo(130, -190 + bob); g.closePath(); g.fillStyle = col; g.fill(); ink(g, lw);
  g.beginPath(); g.ellipse(185, -310 + bob, 60, 30, 0.45, 0, Math.PI * 2); g.fillStyle = col; g.fill(); ink(g, lw);
  g.beginPath(); g.arc(178, -322 + bob, 6, 0, Math.PI * 2); g.fillStyle = INK; g.fill();
  g.beginPath(); g.moveTo(140, -345 + bob); g.lineTo(150, -375 + bob); g.lineTo(162, -342 + bob); g.fillStyle = col; g.fill(); ink(g, 4);
  g.beginPath(); g.moveTo(85, -230 + bob); g.quadraticCurveTo(110, -330 + bob, 145, -345 + bob); g.lineWidth = 22; g.strokeStyle = INK; g.stroke(); g.lineWidth = 13; g.strokeStyle = "#3b2618"; g.stroke();
  leg(-50, Math.sin(p), col); leg(95, Math.sin(p + 3.4), col);
  // saddle blanket
  g.beginPath(); g.rect(-50, -250 + bob, 90, 60); g.fillStyle = "#2f5fb3"; g.fill(); ink(g, 5);
  g.fillStyle = "#e8c547"; g.fillRect(-50, -205 + bob, 90, 12);
  g.restore();
  return -250 * s + bob * s; // saddle top y offset
};

export const puff = (g, x, y, r, a, col = "#e9dcc4") => {
  g.globalAlpha = a; g.beginPath();
  for (let i = 0; i < 5; i++) { const ang = i * 1.3; g.moveTo(x + Math.cos(ang) * r * 0.6 + r * 0.6, y + Math.sin(ang) * r * 0.4); g.arc(x + Math.cos(ang) * r * 0.6, y + Math.sin(ang) * r * 0.4, r * 0.6, 0, Math.PI * 2); }
  g.fillStyle = col; g.fill(); g.globalAlpha = 1;
};

export const burst = (g, x, y, r0, r1, t, col = "#fff3b0", rays = 12) => {
  g.save(); g.translate(x, y); g.globalAlpha = clamp(1.4 - t, 0, 1);
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2, rr = lerp(r0, r1, easeOut(t));
    g.beginPath(); g.moveTo(Math.cos(a) * rr * 0.55, Math.sin(a) * rr * 0.55); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    g.lineWidth = 16; g.strokeStyle = INK; g.stroke(); g.lineWidth = 9; g.strokeStyle = col; g.stroke();
  }
  g.restore();
};

export const ground = (g, x0, x1, y, col, yb = 4000) => { g.fillStyle = col; g.fillRect(x0, y, x1 - x0, yb - y); };
export const shadow = (g, x, y, rx, a = 0.25) => { g.beginPath(); g.ellipse(x, y, rx, rx * 0.18, 0, 0, Math.PI * 2); g.fillStyle = `rgba(36,23,38,${a})`; g.fill(); };

// ---------------- added 2026-11-23 (dragon-bones): ancient China props ----------------
const BONE = "#efe2c4";
/** oracle-style glyphs (simplified, drawn as strokes in a 100x100 box centred on x,y) */
export const glyph = (g, kind, x, y, s, col = INK, k = 1) => {
  g.save(); g.translate(x, y); g.scale(s / 100, s / 100); g.strokeStyle = col; g.lineWidth = 9; g.lineCap = "round"; g.lineJoin = "round";
  const L = (pts) => { g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.stroke(); };
  g.setLineDash([400 * k, 400]);
  if (kind === "sun") { g.beginPath(); g.arc(0, 0, 38, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(0, 0, 5, 0, Math.PI * 2); g.fillStyle = col; g.fill(); }
  if (kind === "moon") { g.beginPath(); g.arc(-8, 0, 40, -1.2, 1.2); g.quadraticCurveTo(-10, 0, 7, -37); g.stroke(); L([[0, -8], [14, 4]]); }
  if (kind === "rain") { L([[-42, -40], [42, -40]]); L([[-34, -30], [-34, 40]]); L([[34, -30], [34, 40]]); L([[-34, -30], [34, -30]]); [[-14, -5], [14, -5], [-14, 22], [14, 22], [0, 8]].forEach(([a, b]) => L([[a, b], [a, b + 10]])); }
  if (kind === "person") { L([[10, -44], [-6, -8], [-18, 44]]); L([[-6, -8], [26, 18]]); }
  if (kind === "tree") { L([[0, -46], [0, 46]]); L([[-30, -34], [0, -10], [30, -34]]); L([[-30, 40], [0, 16], [30, 40]]); }
  if (kind === "mountain") { L([[-44, 30], [-28, -20], [-14, 30], [0, -44], [14, 30], [28, -20], [44, 30], [-44, 30]]); }
  if (kind === "king") { L([[-34, -36], [34, -36]]); L([[0, -36], [0, 36]]); L([[-40, 36], [40, 36]]); L([[-26, 2], [26, 2]]); }
  if (kind === "q") { g.font = "900 110px Montserrat"; g.fillStyle = col; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("?", 0, 6); }
  g.restore();
};
/** ox shoulder blade (scapula): flat paddle, top at x,y, width w; glyphs = [[kind, dx, dy, k]]; crack 0..1 */
export const bone = (g, x, y, w, rot = 0, glyphs = [], crack = 0, col = BONE, glow = 0) => {
  g.save(); g.translate(x, y); g.rotate(rot); const s = w / 300; g.scale(s, s);
  g.beginPath(); g.moveTo(-40, -230); g.bezierCurveTo(-60, -270, 60, -270, 40, -230); g.bezierCurveTo(30, -150, 150, -60, 150, 120);
  g.bezierCurveTo(150, 230, -150, 250, -150, 120); g.bezierCurveTo(-150, -40, -30, -150, -40, -230); g.closePath();
  if (glow) { g.shadowColor = `rgba(255,200,90,${glow})`; g.shadowBlur = 80; }
  g.fillStyle = col; g.fill(); g.shadowBlur = 0; ink(g, 10);
  g.beginPath(); g.moveTo(-10, -200); g.bezierCurveTo(10, -120, -40, 0, -70, 140); g.lineWidth = 8; g.strokeStyle = shadeHex(col, 0.82); g.stroke();
  glyphs.forEach(([kd, dx, dy, k = 1]) => glyph(g, kd, dx, dy, 70, "#5a3a22", k));
  if (crack > 0) crackMark(g, 60, 40, crack);
  g.restore();
};
/** the 卜-shaped crack that a heated pit makes (front side) */
export const crackMark = (g, x, y, k, sz = 1) => {
  g.save(); g.translate(x, y); g.scale(sz, sz); g.strokeStyle = "#2a1a12"; g.lineWidth = 7; g.lineCap = "round";
  const seg = (a, b, c, d, t) => { if (t <= 0) return; t = clamp(t, 0, 1); g.beginPath(); g.moveTo(a, b); g.lineTo(lerp(a, c, t), lerp(b, d, t)); g.stroke(); };
  seg(0, -90, 4, -20, k * 2); seg(4, -20, -3, 90, k * 2 - 0.6); seg(2, -30, 70, -60, k * 2.5 - 1.2); seg(70, -60, 95, -52, k * 3 - 2);
  g.restore();
};
/** turtle plastron (belly shell), centre x,y, width w */
export const shell = (g, x, y, w, rot = 0, glyphs = [], crack = 0, col = "#e6d3a4") => {
  g.save(); g.translate(x, y); g.rotate(rot); const s = w / 300; g.scale(s, s);
  g.beginPath(); g.moveTo(-90, -200); g.quadraticCurveTo(0, -240, 90, -200); g.quadraticCurveTo(150, -60, 140, 60); g.lineTo(120, 70); g.quadraticCurveTo(140, 140, 80, 210);
  g.quadraticCurveTo(0, 240, -80, 210); g.quadraticCurveTo(-140, 140, -120, 70); g.lineTo(-140, 60); g.quadraticCurveTo(-150, -60, -90, -200); g.closePath();
  g.fillStyle = col; g.fill(); ink(g, 10);
  g.strokeStyle = shadeHex(col, 0.75); g.lineWidth = 6;
  [[-130, -110, 130, -110], [-140, 0, 140, 0], [-125, 110, 125, 110], [0, -220, 0, 225]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); });
  glyphs.forEach(([kd, dx, dy, k = 1]) => glyph(g, kd, dx, dy, 70, "#5a3a22", k));
  if (crack > 0) { crackMark(g, -60, -50, crack, 0.8); crackMark(g, 60, 60, crack, 0.8); }
  g.restore();
};
/** Chinese hall/gate tower with an upturned tiled roof; base centre x,y, width w */
export const hall = (g, x, y, w, wall = "#b8362e", roof = "#3f7f6a", seed = 1) => {
  const h = w * 0.42;
  g.beginPath(); g.rect(x - w * 0.55, y - h * 0.18, w * 1.1, h * 0.18); g.fillStyle = "#c9b79a"; g.fill(); ink(g, 5);
  g.beginPath(); g.rect(x - w * 0.42, y - h * 0.18 - h * 0.62, w * 0.84, h * 0.62); g.fillStyle = wall; g.fill(); ink(g, 5);
  for (let i = 0; i < 5; i++) { const cx = x - w * 0.34 + i * w * 0.17; g.beginPath(); g.rect(cx - w * 0.05, y - h * 0.18 - h * 0.5, w * 0.1, h * 0.5); g.fillStyle = shadeHex(wall, 0.7); g.fill(); ink(g, 3); }
  const ry = y - h * 0.8, rw = w * 0.62, rh = h * 0.5;
  for (const tier of [0, 1]) {
    const yy = ry - tier * rh * 1.05, ww = rw * (1 - tier * 0.28);
    if (tier) { g.beginPath(); g.rect(x - ww * 0.62, yy, ww * 1.24, rh * 0.55); g.fillStyle = wall; g.fill(); ink(g, 4); }
    g.beginPath(); g.moveTo(x - ww - w * 0.08, yy - rh * 0.35); g.quadraticCurveTo(x - ww * 0.8, yy - rh * 0.05, x - ww * 0.55, yy - rh * 0.55 + (tier ? rh * 0.55 : 0) * 0);
    g.lineTo(x - ww * 0.45, yy - rh); g.lineTo(x + ww * 0.45, yy - rh); g.lineTo(x + ww * 0.55, yy - rh * 0.55);
    g.quadraticCurveTo(x + ww * 0.8, yy - rh * 0.05, x + ww + w * 0.08, yy - rh * 0.35); g.quadraticCurveTo(x + ww * 0.7, yy + rh * 0.05, x, yy + rh * 0.02); g.quadraticCurveTo(x - ww * 0.7, yy + rh * 0.05, x - ww - w * 0.08, yy - rh * 0.35);
    g.closePath(); g.fillStyle = roof; g.fill(); ink(g, 5);
    g.beginPath(); g.moveTo(x - ww * 0.45, yy - rh); g.lineTo(x + ww * 0.45, yy - rh); g.lineWidth = 12; g.strokeStyle = shadeHex(roof, 0.65); g.stroke();
  }
};
/** apothecary wall of little drawers */
export const drawers = (g, x0, y0, cols, rows, cw, chh, col = "#8a4a2a") => {
  g.beginPath(); g.rect(x0 - 20, y0 - 20, cols * cw + 40, rows * chh + 40); g.fillStyle = shadeHex(col, 0.7); g.fill(); ink(g, 6);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = x0 + c * cw, y = y0 + r * chh; g.beginPath(); g.rect(x + 4, y + 4, cw - 8, chh - 8); g.fillStyle = col; g.fill(); ink(g, 3);
    g.beginPath(); g.arc(x + cw / 2, y + chh * 0.6, 6, 0, Math.PI * 2); g.fillStyle = "#e0b64a"; g.fill(); ink(g, 2);
    g.beginPath(); g.rect(x + cw * 0.3, y + chh * 0.18, cw * 0.4, chh * 0.24); g.fillStyle = "#f1e6c8"; g.fill();
  }
};
/** mortar bowl + pestle, base centre x,y, width w; grind phase */
export const mortar = (g, x, y, w, phase = 0, fill = "#d8d2c4") => {
  const s = w / 300; g.save(); g.translate(x, y); g.scale(s, s);
  const a = Math.sin(phase) * 0.35;
  g.save(); g.translate(Math.sin(phase) * 50, -120); g.rotate(a); g.beginPath(); g.roundRect(-22, -260, 44, 280, 22); g.fillStyle = "#8a5a34"; g.fill(); ink(g, 8); g.restore();
  g.beginPath(); g.ellipse(0, -130, 140, 34, 0, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); ink(g, 8);
  g.beginPath(); g.moveTo(-150, -130); g.quadraticCurveTo(-140, 20, 0, 20); g.quadraticCurveTo(140, 20, 150, -130); g.quadraticCurveTo(0, -95, -150, -130); g.fillStyle = "#6f7a83"; g.fill(); ink(g, 8);
  g.beginPath(); g.rect(-70, 10, 140, 18); g.fillStyle = "#5a636b"; g.fill(); ink(g, 6);
  g.restore();
};
/** red paper lantern hanging from y0, centre x,y */
export const lantern = (g, x, y, r, sw = 0) => {
  g.save(); g.translate(x, y); g.rotate(sw);
  g.beginPath(); g.moveTo(0, -r * 1.8); g.lineTo(0, -r); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
  g.shadowColor = "rgba(255,170,60,0.8)"; g.shadowBlur = r; g.beginPath(); g.ellipse(0, 0, r, r * 0.85, 0, 0, Math.PI * 2); g.fillStyle = "#d8352a"; g.fill(); g.shadowBlur = 0; ink(g, 5);
  for (const k of [-0.5, 0, 0.5]) { g.beginPath(); g.ellipse(0, 0, r * Math.abs(k) + 2, r * 0.85, 0, 0, Math.PI * 2); g.lineWidth = 2.5; g.strokeStyle = "#8a1d17"; g.stroke(); }
  g.fillStyle = "#e8b53a"; g.fillRect(-r * 0.35, -r * 0.98, r * 0.7, r * 0.18); g.fillRect(-r * 0.35, r * 0.8, r * 0.7, r * 0.18);
  g.beginPath(); g.moveTo(0, r * 0.98); g.lineTo(0, r * 1.5); g.lineWidth = 6; g.strokeStyle = "#e8b53a"; g.stroke();
  g.restore();
};
/** cartoon turtle (side), centre x,y, size s, walk phase */
export const turtle = (g, x, y, s, phase = 0) => {
  g.save(); g.translate(x, y); g.scale(s, s);
  for (const [lx, k] of [[-70, 0], [60, 1]]) { g.beginPath(); g.ellipse(lx + 12 * Math.sin(phase + k * 3), 40, 26, 34, 0, 0, Math.PI * 2); g.fillStyle = "#7fb069"; g.fill(); ink(g, 6); }
  g.beginPath(); g.ellipse(125, -10 + 4 * Math.sin(phase * 2), 44, 34, 0, 0, Math.PI * 2); g.fillStyle = "#8cc276"; g.fill(); ink(g, 6);
  g.beginPath(); g.arc(138, -20, 6, 0, Math.PI * 2); g.fillStyle = INK; g.fill();
  g.beginPath(); g.arc(140, 2, 12, 0.2, 1.4); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
  g.beginPath(); g.ellipse(0, 0, 120, 85, 0, Math.PI, 0); g.lineTo(120, 20); g.lineTo(-120, 20); g.closePath(); g.fillStyle = "#5e8a4a"; g.fill(); ink(g, 7);
  g.strokeStyle = "#3f6532"; g.lineWidth = 5; [[-60, -50, -20, 0], [60, -50, 20, 0], [-20, -80, 20, -80]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); });
  g.beginPath(); g.rect(-125, 14, 250, 16); g.fillStyle = "#d9c38a"; g.fill(); ink(g, 5);
  g.restore();
};
/** cartoon ox (side), feet at x,y, size s */
export const ox = (g, x, y, s, phase = 0, col = "#8a5a3a") => {
  g.save(); g.translate(x, y); g.scale(s, s);
  [[-120, 0], [-70, 2], [90, 1], [140, 3]].forEach(([lx, k]) => { g.beginPath(); g.roundRect(lx - 16 + 6 * Math.sin(phase + k), -150, 32, 150, 10); g.fillStyle = shadeHex(col, 0.85); g.fill(); ink(g, 6); });
  g.beginPath(); g.ellipse(10, -200, 190, 95, 0, 0, Math.PI * 2); g.fillStyle = col; g.fill(); ink(g, 7);
  g.beginPath(); g.moveTo(-180, -220); g.quadraticCurveTo(-240, -190, -230, -120); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
  g.save(); g.translate(205, -235 + 5 * Math.sin(phase * 2));
  g.beginPath(); g.moveTo(-20, -60); g.quadraticCurveTo(-60, -120, -10, -130); g.moveTo(40, -60); g.quadraticCurveTo(80, -120, 30, -130); g.lineWidth = 14; g.strokeStyle = INK; g.stroke(); g.lineWidth = 8; g.strokeStyle = "#f1ead6"; g.stroke();
  g.beginPath(); g.ellipse(10, 0, 70, 80, 0, 0, Math.PI * 2); g.fillStyle = col; g.fill(); ink(g, 7);
  g.beginPath(); g.ellipse(14, 52, 52, 34, 0, 0, Math.PI * 2); g.fillStyle = "#e8b8a0"; g.fill(); ink(g, 5);
  [-8, 36].forEach((dx) => { g.beginPath(); g.arc(dx, 52, 6, 0, Math.PI * 2); g.fillStyle = INK; g.fill(); g.beginPath(); g.arc(dx - 4, -14, 8, 0, Math.PI * 2); g.fill(); });
  g.restore(); g.restore();
};
/** glowing hot bronze rod from (x0,y0) to (x1,y1) */
export const hotRod = (g, x0, y0, x1, y1, heat = 1) => {
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineCap = "round"; g.lineWidth = 30; g.strokeStyle = INK; g.stroke(); g.lineWidth = 18; g.strokeStyle = "#a8743f"; g.stroke();
  const mx = lerp(x0, x1, 0.7), my = lerp(y0, y1, 0.7); const gr = g.createLinearGradient(mx, my, x1, y1); gr.addColorStop(0, "#a8743f"); gr.addColorStop(1, heat > 0.5 ? "#ffde6a" : "#ff6a2a");
  g.beginPath(); g.moveTo(mx, my); g.lineTo(x1, y1); g.lineWidth = 18; g.strokeStyle = gr; g.stroke();
  g.beginPath(); g.arc(x1, y1, 30 + 12 * heat, 0, Math.PI * 2); g.fillStyle = `rgba(255,180,60,${0.35 * heat})`; g.fill();
};
/** flickering flame at x,y (base), height h */
export const flame = (g, x, y, h, T) => {
  for (const [k, c] of [[1, "#ff6a2a"], [0.7, "#ffb43a"], [0.42, "#fff0a0"]]) {
    const hh = h * k * (1 + 0.12 * Math.sin(T * 17 + k * 5)), w = hh * 0.42;
    g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x - w * 1.1, y - hh * 0.5, x + 0.15 * w * Math.sin(T * 11), y - hh); g.quadraticCurveTo(x + w * 1.1, y - hh * 0.5, x + w, y); g.closePath();
    g.fillStyle = c; g.fill(); if (k === 1) ink(g, 5);
  }
};

// ---------------- (2026-11-24) 1950s Brazil + Canada set: rhino, ballots, newspapers, mid-century city, tram, palms ----------------
/** cartoon rhinoceros facing right (dir -1 flips), feet at (x, y). opts: phase (walk), expr ("neutral"|"happy"|"shock"|"proud"|"wink"),
 *  blink (0..1), ear (wiggle), col, sash (rosette colour or null), mouthOpen (0..1) */
export const rhino = (g, x, y, s, o = {}) => {
  const { phase = 0, expr = "neutral", blink = 0, ear = 0, col = "#8f97a3", sash = null, mouthOpen = 0, dir = 1, headUp = 0 } = o;
  const dark = shadeHex(col, 0.78), light = shadeHex(col, 1.12), p = phase * Math.PI * 2, bob = -6 * Math.abs(Math.sin(p));
  g.save(); g.translate(x, y); g.scale(s * dir, s);
  g.beginPath(); g.ellipse(0, 0, 230, 28, 0, 0, Math.PI * 2); g.fillStyle = "rgba(36,23,38,0.22)"; g.fill();
  const leg = (lx, k, c) => { const sw = 16 * Math.sin(p + k); g.beginPath(); g.roundRect(lx - 34 + sw * 0.3, -150 + bob, 68, 150 - Math.max(0, Math.sin(p + k)) * 14, 26); g.fillStyle = c; g.fill(); ink(g, 7);
    for (const tx of [-16, 0, 16]) { g.beginPath(); g.arc(lx + tx + sw * 0.3, -8 - Math.max(0, Math.sin(p + k)) * 14, 8, Math.PI, 0); g.fillStyle = "#e9e2cf"; g.fill(); ink(g, 3); } };
  leg(-120, 1.6, dark); leg(110, 0.2, dark);
  // tail
  g.beginPath(); g.moveTo(-215, -230 + bob); g.quadraticCurveTo(-265, -210 + bob + 14 * Math.sin(p * 2), -255, -160 + bob); ink(g, 9);
  g.beginPath(); g.ellipse(-255, -152 + bob, 12, 18, 0.3, 0, Math.PI * 2); g.fillStyle = INK; g.fill();
  // body (barrel with a shoulder hump)
  g.beginPath(); g.moveTo(-220, -200 + bob); g.bezierCurveTo(-240, -330 + bob, -40, -360 + bob, 60, -330 + bob); g.bezierCurveTo(150, -360 + bob, 220, -300 + bob, 210, -210 + bob);
  g.bezierCurveTo(205, -120 + bob, -60, -100 + bob, -200, -130 + bob); g.closePath();
  const gr = g.createLinearGradient(0, -360, 0, -110); gr.addColorStop(0, light); gr.addColorStop(1, dark); g.fillStyle = gr; g.fill(); ink(g, 8);
  // armour folds
  g.lineWidth = 5; g.strokeStyle = shadeHex(col, 0.6);
  [[-90, -330, -110, -150], [60, -330, 80, -140]].forEach(([x0, y0, x1, y1]) => { g.beginPath(); g.moveTo(x0, y0 + bob); g.quadraticCurveTo(x0 - 25, (y0 + y1) / 2 + bob, x1, y1 + bob); g.stroke(); });
  if (sash) { // election rosette on the shoulder
    g.beginPath(); g.moveTo(40, -250 + bob); g.lineTo(20, -170 + bob); g.lineTo(45, -185 + bob); g.lineTo(60, -165 + bob); g.lineTo(70, -250 + bob); g.fillStyle = sash; g.fill(); ink(g, 4);
    g.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = i % 2 ? 40 : 50; g.lineTo(55 + Math.cos(a) * r, -265 + bob + Math.sin(a) * r); } g.closePath(); g.fillStyle = sash; g.fill(); ink(g, 5);
    g.beginPath(); g.arc(55, -265 + bob, 24, 0, Math.PI * 2); g.fillStyle = "#fff6d6"; g.fill(); ink(g, 4);
  }
  leg(-70, 3.0, col); leg(160, 4.4, col);
  // head (rotates up a little when proud/shouting)
  g.save(); g.translate(190, -250 + bob); g.rotate(-0.12 - headUp);
  g.beginPath(); g.ellipse(-30, -60, 26 + 4 * ear, 40, -0.5 + 0.25 * ear, 0, Math.PI * 2); g.fillStyle = col; g.fill(); ink(g, 6); // ear
  g.beginPath(); g.ellipse(-30, -60, 12, 24, -0.5 + 0.25 * ear, 0, Math.PI * 2); g.fillStyle = "#e7a9a0"; g.fill();
  g.beginPath(); g.moveTo(-40, -40); g.bezierCurveTo(-30, -110, 120, -110, 170, -40); g.bezierCurveTo(200, 0, 190, 60, 140, 70); g.bezierCurveTo(60, 80, -30, 70, -50, 20); g.closePath();
  g.fillStyle = col; g.fill(); ink(g, 8);
  // horns: big front horn, small rear horn
  g.beginPath(); g.moveTo(120, -50); g.quadraticCurveTo(160, -100, 150, -175); g.quadraticCurveTo(190, -100, 178, -30); g.closePath(); g.fillStyle = "#efe6cf"; g.fill(); ink(g, 6);
  g.beginPath(); g.moveTo(70, -70); g.quadraticCurveTo(90, -105, 85, -135); g.quadraticCurveTo(112, -100, 108, -66); g.closePath(); g.fillStyle = "#efe6cf"; g.fill(); ink(g, 5);
  // eye
  const ex = 40, ey = -40;
  if (expr === "happy" || expr === "proud" || blink >= 1) { g.beginPath(); g.arc(ex, ey + 4, 13, Math.PI * 1.1, Math.PI * 1.9); ink(g, 6); }
  else if (expr === "wink") { g.beginPath(); g.moveTo(ex - 13, ey); g.lineTo(ex + 13, ey); ink(g, 6); }
  else { const r = expr === "shock" ? 22 : 17; g.beginPath(); g.arc(ex, ey, r, 0, Math.PI * 2); g.fillStyle = "#ffffff"; g.fill(); ink(g, 5); g.beginPath(); g.arc(ex + 4, ey + 2, expr === "shock" ? 7 : 9, 0, Math.PI * 2); g.fillStyle = INK; g.fill();
    g.beginPath(); g.arc(ex + 7, ey - 2, 3, 0, Math.PI * 2); g.fillStyle = "#fff"; g.fill(); }
  g.beginPath(); g.moveTo(ex - 22, ey - 28 - (expr === "shock" ? 10 : 0)); g.lineTo(ex + 18, ey - 26 - (expr === "proud" ? -6 : expr === "shock" ? 12 : 0)); ink(g, 6); // brow
  // cheek + nostril + mouth
  g.beginPath(); g.ellipse(70, 10, 18, 10, 0, 0, Math.PI * 2); g.fillStyle = "rgba(240,120,130,0.45)"; g.fill();
  g.beginPath(); g.ellipse(165, 18, 7, 11, 0.4, 0, Math.PI * 2); g.fillStyle = INK; g.fill();
  if (mouthOpen > 0.05) { g.beginPath(); g.ellipse(120, 48, 26, 8 + 22 * mouthOpen, 0, 0, Math.PI * 2); g.fillStyle = "#5a1f2a"; g.fill(); ink(g, 5); }
  else { g.beginPath(); g.moveTo(85, 42); g.quadraticCurveTo(125, expr === "shock" ? 40 : 68, 160, 44); ink(g, 6); }
  g.restore(); g.restore();
};
/** wooden ballot box with a slot and a label */
export const ballotBox = (g, x, y, w, label = "VOTE", col = "#b5793f") => {
  const h = w * 0.8;
  g.beginPath(); g.rect(x - w / 2, y - h, w, h); g.fillStyle = col; g.fill(); ink(g, 7);
  g.beginPath(); g.moveTo(x - w / 2, y - h); g.lineTo(x - w / 2 + w * 0.12, y - h - w * 0.14); g.lineTo(x + w / 2 + w * 0.12, y - h - w * 0.14); g.lineTo(x + w / 2, y - h); g.closePath(); g.fillStyle = shadeHex(col, 1.15); g.fill(); ink(g, 6);
  g.beginPath(); g.rect(x - w * 0.22 + w * 0.06, y - h - w * 0.09, w * 0.44, w * 0.04); g.fillStyle = INK; g.fill();
  g.beginPath(); g.rect(x - w * 0.34, y - h * 0.62, w * 0.68, h * 0.3); g.fillStyle = "#f6efd8"; g.fill(); ink(g, 5);
  g.fillStyle = INK; g.font = `900 ${w * 0.15}px Montserrat`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(label, x, y - h * 0.47);
};
/** paper ballot (w wide) with a tick box; name printed, mark 0..1 draws the X */
export const ballot = (g, x, y, w, rot = 0, name = "CACARECO", mark = 1, col = "#fffdf4") => {
  g.save(); g.translate(x, y); g.rotate(rot); const h = w * 0.62;
  g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.fillStyle = col; g.fill(); ink(g, Math.max(2, w * 0.025));
  g.fillStyle = "#3b6fb5"; g.fillRect(-w / 2 + w * 0.04, -h / 2 + h * 0.08, w * 0.92, h * 0.14);
  g.beginPath(); g.rect(-w * 0.4, -h * 0.12, w * 0.24, w * 0.24); g.fillStyle = "#fff"; g.fill(); ink(g, Math.max(2, w * 0.02));
  if (mark > 0) { const k = clamp(mark * 2, 0, 1), k2 = clamp(mark * 2 - 1, 0, 1), b = w * 0.1, cx = -w * 0.28, cy = -h * 0.12 + w * 0.12;
    g.lineWidth = w * 0.035; g.strokeStyle = "#d62f3a"; g.lineCap = "round";
    g.beginPath(); g.moveTo(cx - b, cy - b); g.lineTo(cx - b + 2 * b * k, cy - b + 2 * b * k); g.stroke();
    if (k2 > 0) { g.beginPath(); g.moveTo(cx + b, cy - b); g.lineTo(cx + b - 2 * b * k2, cy - b + 2 * b * k2); g.stroke(); } }
  g.fillStyle = INK; g.font = `900 ${w * 0.11}px Montserrat`; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText(name, -w * 0.12, -h * 0.12 + w * 0.12);
  g.restore();
};
/** folded newspaper with masthead + headline */
export const newspaper = (g, x, y, w, rot = 0, head = "EXTRA!", line = "", mast = "DIÁRIO") => {
  g.save(); g.translate(x, y); g.rotate(rot); const h = w * 1.3;
  g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.fillStyle = "#f1ead8"; g.fill(); ink(g, Math.max(3, w * 0.012));
  g.fillStyle = INK; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = `900 ${w * 0.1}px Georgia, serif`; g.fillText(mast, 0, -h / 2 + w * 0.09);
  g.fillRect(-w * 0.44, -h / 2 + w * 0.16, w * 0.88, w * 0.012);
  g.font = `900 ${w * 0.13}px Montserrat`; g.fillText(head, 0, -h / 2 + w * 0.29);
  if (line) { g.font = `900 ${w * 0.065}px Montserrat`; g.fillText(line, 0, -h / 2 + w * 0.42); }
  g.beginPath(); g.rect(-w * 0.42, -h / 2 + w * 0.5, w * 0.4, w * 0.4); g.fillStyle = "#c9c2b0"; g.fill(); ink(g, 3);
  g.fillStyle = "#9a948a"; for (let i = 0; i < 9; i++) { g.fillRect(w * 0.04, -h / 2 + w * (0.52 + i * 0.045), w * 0.38, w * 0.015); g.fillRect(-w * 0.42, -h / 2 + w * (0.95 + (i % 6) * 0.045), w * 0.84, w * 0.015); }
  g.restore();
};
/** mid-century city skyline (pastel towers with window grids), base y */
export const skyline50s = (g, y, T = 0, seed = 1, pal = ["#f2b5a0", "#9fd3c7", "#f6d68b", "#e8e1cf", "#b7c7e8", "#f0a6b8"]) => {
  for (let i = 0; i < 9; i++) {
    const w = 120 + rnd(i, seed) * 90, h = 380 + rnd(i, seed + 1) * 520, x = -120 + i * 150 + rnd(i, seed + 2) * 40, c = pal[i % pal.length];
    g.beginPath(); g.rect(x, y - h, w, h); g.fillStyle = c; g.fill(); ink(g, 5);
    if (i % 3 === 1) { g.beginPath(); g.rect(x + w * 0.3, y - h - 70, w * 0.4, 70); g.fillStyle = shadeHex(c, 0.9); g.fill(); ink(g, 4); g.beginPath(); g.moveTo(x + w / 2, y - h - 70); g.lineTo(x + w / 2, y - h - 140); ink(g, 4); }
    g.fillStyle = "rgba(36,23,38,0.25)";
    for (let r = 0; r < Math.floor(h / 46) - 1; r++) for (let k = 0; k < 3; k++) if (rnd(i * 40 + r * 3 + k, seed + 5) > 0.15) g.fillRect(x + 14 + k * (w - 28) / 3, y - h + 22 + r * 46, (w - 28) / 3 - 12, 24);
  }
};
/** 1950s streetcar facing right, wheels at y */
export const bonde = (g, x, y, s, col = "#2f8f6a") => {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.beginPath(); g.moveTo(-80, -300); g.lineTo(60, -420); ink(g, 6);
  g.beginPath(); g.roundRect(-260, -300, 520, 250, 30); g.fillStyle = col; g.fill(); ink(g, 7);
  g.fillStyle = "#f6e7b8"; g.fillRect(-260, -120, 520, 26);
  for (let i = 0; i < 5; i++) { g.beginPath(); g.rect(-230 + i * 95, -270, 75, 110); g.fillStyle = "#cdeaf2"; g.fill(); ink(g, 4); }
  for (const wx of [-170, 170]) { g.beginPath(); g.arc(wx, -40, 38, 0, Math.PI * 2); g.fillStyle = "#3a3440"; g.fill(); ink(g, 5); }
  g.restore();
};
/** muddy pothole with a puddle */
export const pothole = (g, x, y, w, T = 0) => {
  g.beginPath(); for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, r = 1 + 0.18 * (rnd(i, 7) - 0.5); g.lineTo(x + Math.cos(a) * w * r, y + Math.sin(a) * w * 0.32 * r); } g.closePath();
  g.fillStyle = "#4a3a30"; g.fill(); ink(g, 6);
  g.beginPath(); g.ellipse(x + w * 0.1, y + w * 0.04, w * 0.6, w * 0.15, 0, 0, Math.PI * 2); g.fillStyle = "#7fb4c8"; g.fill();
  g.beginPath(); g.ellipse(x + w * 0.1, y + w * 0.04, w * (0.2 + 0.3 * ((T * 0.8) % 1)), w * (0.05 + 0.08 * ((T * 0.8) % 1)), 0, 0, Math.PI * 2); g.lineWidth = 3; g.strokeStyle = `rgba(255,255,255,${0.8 - 0.8 * ((T * 0.8) % 1)})`; g.stroke();
};
/** tropical palm, trunk base at (x,y) */
export const palm = (g, x, y, h, T = 0, col = "#3f9e5a") => {
  const sw = 10 * Math.sin(T * 1.3 + x);
  g.beginPath(); g.moveTo(x - 16, y); g.quadraticCurveTo(x + 10, y - h * 0.5, x + 30 + sw, y - h); g.lineTo(x + 50 + sw, y - h); g.quadraticCurveTo(x + 30, y - h * 0.5, x + 16, y); g.closePath(); g.fillStyle = "#9a6a3e"; g.fill(); ink(g, 5);
  for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.55 + 0.04 * Math.sin(T * 2 + i), L = h * 0.45, tx = x + 40 + sw, ty = y - h;
    g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + Math.cos(a) * L * 0.6 - Math.sin(a) * 40, ty + Math.sin(a) * L * 0.6 - 40, tx + Math.cos(a) * L * 1.1, ty + Math.sin(a) * L * 0.4 + L * 0.35);
    g.quadraticCurveTo(tx + Math.cos(a) * L * 0.5, ty + Math.sin(a) * L * 0.5 + 10, tx, ty); g.fillStyle = col; g.fill(); ink(g, 4); }
};
/** maple leaf (centre x,y, size s) */
export const maple = (g, x, y, s, rot = 0, col = "#d62f3a") => {
  const pts = [[0, -100], [14, -60], [40, -70], [34, -24], [80, -40], [70, -10], [96, 0], [50, 30], [58, 52], [10, 40], [8, 90], [-8, 90], [-10, 40], [-58, 52], [-50, 30], [-96, 0], [-70, -10], [-80, -40], [-34, -24], [-40, -70], [-14, -60]];
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s / 100, s / 100); g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.closePath(); g.fillStyle = col; g.fill(); ink(g, 6 * 100 / s); g.restore();
};
/** simplified fleur-de-lis */
export const fleur = (g, x, y, s, col = "#ffffff") => {
  g.save(); g.translate(x, y); g.scale(s / 100, s / 100); g.beginPath();
  g.moveTo(0, -100); g.bezierCurveTo(30, -60, 30, -20, 6, 10); g.lineTo(-6, 10); g.bezierCurveTo(-30, -20, -30, -60, 0, -100);
  g.moveTo(8, 6); g.bezierCurveTo(40, -40, 90, -20, 70, 20); g.bezierCurveTo(60, 0, 40, 10, 20, 26);
  g.moveTo(-8, 6); g.bezierCurveTo(-40, -40, -90, -20, -70, 20); g.bezierCurveTo(-60, 0, -40, 10, -20, 26);
  g.rect(-34, 22, 68, 14); g.moveTo(-10, 36); g.lineTo(10, 36); g.lineTo(16, 70); g.lineTo(-16, 70); g.closePath();
  g.fillStyle = col; g.fill(); g.restore();
};

// ---------------- (2026-11-25, star-canoe) Pacific voyaging set ----------------
/** layered ocean from y0 to the bottom: rolling swell bands, animated with T */
export const ocean = (g, y0, T = 0, cols = ["#2a7f9e", "#1f6a8a", "#175a78", "#104a66"], x0 = -1500, x1 = 2600, amp = 1) => {
  cols.forEach((c, i) => {
    const y = y0 + i * 120 * (1 + i * 0.35), A = (10 + i * 9) * amp, L = 260 + i * 90, sp = 0.6 + i * 0.35;
    g.beginPath(); g.moveTo(x0, 4000);
    for (let x = x0; x <= x1; x += 24) g.lineTo(x, y + A * Math.sin((x / L) * 6.283 + T * sp + i * 1.7) + A * 0.4 * Math.sin((x / L) * 15 - T * sp * 1.3));
    g.lineTo(x1, 4000); g.closePath(); g.fillStyle = c; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    g.strokeStyle = "rgba(255,255,255,0.45)"; g.lineWidth = 6; g.lineCap = "round";
    for (let k = 0; k < 7; k++) { const xx = x0 + ((rnd(k, i + 3) * (x1 - x0) + T * 40 * sp) % (x1 - x0)); g.beginPath(); g.moveTo(xx, y + 30 + i * 22); g.lineTo(xx + 60 + 40 * rnd(k, i), y + 30 + i * 22); g.stroke(); }
  });
};
/** starfield (twinkling), above yMax only */
export const stars = (g, T = 0, n = 120, yMax = 1300, seed = 1, W = 1080) => {
  for (let i = 0; i < n; i++) {
    const x = rnd(i, seed) * W, y = rnd(i, seed + 1) * yMax, r = 1.5 + rnd(i, seed + 2) * 3.5, tw = 0.55 + 0.45 * Math.sin(T * (1.5 + rnd(i, 9) * 3) + i);
    g.beginPath(); g.arc(x, y, r * (0.7 + 0.3 * tw), 0, Math.PI * 2); g.fillStyle = `rgba(255,248,220,${0.35 + 0.65 * tw})`; g.fill();
  }
};
/** a bright 4-point star (navigation star) */
export const bigStar = (g, x, y, r, T = 0, col = "#fff3b0") => {
  const k = 1 + 0.12 * Math.sin(T * 4);
  const gr = g.createRadialGradient(x, y, 0, x, y, r * 2.4); gr.addColorStop(0, "rgba(255,240,170,0.55)"); gr.addColorStop(1, "rgba(255,240,170,0)");
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 2.4, 0, Math.PI * 2); g.fill();
  g.beginPath(); for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, rr = (i % 2 ? r * 0.28 : r) * k; g.lineTo(x + Math.cos(a - Math.PI / 2) * rr, y + Math.sin(a - Math.PI / 2) * rr); }
  g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
};
/** double-hulled voyaging canoe, 3/4 side view (two hulls visible, deck between, two crab-claw sails). s=1 → ~760 px long.
 *  o: { T, rock, sail, hull, crew: [colours], dir, sails: 0..1 (raised) } */
export const canoe = (g, x, y, s = 1, o = {}) => {
  const T = o.T ?? 0, dir = o.dir ?? 1, rock = o.rock ?? 1, hullC = o.hull ?? "#7a3b24", sailC = o.sail ?? "#e9cfa0", up = o.sails ?? 1;
  g.save(); g.translate(x, y + 8 * Math.sin(T * 1.6) * rock); g.rotate(0.03 * Math.sin(T * 1.3) * rock); g.scale(s * dir, s);
  const hull = (dy, dx, c) => { g.beginPath(); g.moveTo(-380 + dx, -40 + dy); g.quadraticCurveTo(-400 + dx, -120 + dy, -350 + dx, -150 + dy);
    g.quadraticCurveTo(-320 + dx, -80 + dy, -250 + dx, -50 + dy); g.lineTo(250 + dx, -50 + dy); g.quadraticCurveTo(330 + dx, -80 + dy, 360 + dx, -160 + dy);
    g.quadraticCurveTo(400 + dx, -110 + dy, 380 + dx, -40 + dy); g.quadraticCurveTo(300 + dx, 30 + dy, 0 + dx, 30 + dy); g.quadraticCurveTo(-300 + dx, 30 + dy, -380 + dx, -40 + dy); g.closePath();
    g.fillStyle = c; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.moveTo(-300 + dx, -20 + dy); g.lineTo(300 + dx, -20 + dy); g.lineWidth = 6; g.strokeStyle = "#e8c070"; g.stroke(); };
  hull(-70, 60, shadeHex(hullC, 0.78)); // far hull
  // deck + cross beams
  g.beginPath(); g.moveTo(-260, -60); g.lineTo(300, -125); g.lineTo(300, -105); g.lineTo(-260, -40); g.closePath(); g.fillStyle = "#c8a070"; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
  for (let i = 0; i < 5; i++) { const bx = -220 + i * 110; g.beginPath(); g.moveTo(bx, -50); g.lineTo(bx + 60, -128); g.lineWidth = 9; g.strokeStyle = "#8a5a34"; g.stroke(); }
  // little deck shelter
  g.beginPath(); g.moveTo(-40, -70); g.lineTo(10, -140); g.lineTo(100, -150); g.lineTo(60, -80); g.closePath(); g.fillStyle = "#d9b77a"; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
  // crew heads
  (o.crew ?? []).forEach((c, i) => { const cx = -200 + i * 70 + (i % 2) * 10, cy = -95 - i * 6 + 3 * Math.sin(T * 3 + i); g.beginPath(); g.ellipse(cx, cy, 20, 23, 0, 0, Math.PI * 2); g.fillStyle = c; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.ellipse(cx, cy - 12, 20, 11, 0, Math.PI, 0); g.fillStyle = "#1c1a22"; g.fill(); });
  // crab-claw sails (two masts)
  for (const [mx, h] of [[-120, 420], [150, 470]]) {
    const H = h * up, sw = 1 + 0.04 * Math.sin(T * 2 + mx);
    g.beginPath(); g.moveTo(mx, -80); g.lineTo(mx + 20, -80 - H * 0.9); g.lineWidth = 10; g.strokeStyle = "#5a3a22"; g.stroke();
    g.beginPath(); g.moveTo(mx + 6, -110); g.quadraticCurveTo(mx - 120 * sw, -80 - H * 0.6, mx - 150 * sw, -80 - H); g.quadraticCurveTo(mx - 40, -80 - H * 0.78, mx + 60 * sw, -80 - H * 1.02);
    g.quadraticCurveTo(mx + 70 * sw, -80 - H * 0.5, mx + 6, -110); g.closePath(); g.fillStyle = sailC; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.moveTo(mx - 20, -80 - H * 0.45); g.lineTo(mx + 30, -80 - H * 0.5); g.moveTo(mx - 60, -80 - H * 0.75); g.lineTo(mx + 40, -80 - H * 0.8); g.lineWidth = 3; g.stroke();
  }
  hull(0, 0, hullC); // near hull
  g.restore();
};
/** balsa-log raft with a square sail and a sun-face, cabin; s=1 → ~640 px */
export const raft = (g, x, y, s = 1, T = 0, faceCol = "#c8323a") => {
  g.save(); g.translate(x, y + 7 * Math.sin(T * 1.7)); g.rotate(0.035 * Math.sin(T * 1.2)); g.scale(s, s);
  g.beginPath(); g.moveTo(-40, -40); g.lineTo(-30, -560); g.moveTo(40, -40); g.lineTo(30, -560); g.lineWidth = 12; g.strokeStyle = "#7a5a34"; g.stroke();
  g.beginPath(); g.rect(-190, -540, 380, 380); g.fillStyle = "#efe2c0"; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
  g.beginPath(); g.arc(0, -350, 120, 0, Math.PI * 2); g.fillStyle = faceCol; g.fill(); g.lineWidth = 6; g.stroke();
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.beginPath(); g.moveTo(Math.cos(a) * 125, -350 + Math.sin(a) * 125); g.lineTo(Math.cos(a) * 160, -350 + Math.sin(a) * 160); g.lineWidth = 9; g.strokeStyle = faceCol; g.stroke(); }
  g.fillStyle = "#efe2c0"; for (const ex of [-45, 45]) { g.beginPath(); g.ellipse(ex, -375, 22, 16, 0, 0, Math.PI * 2); g.fill(); }
  g.beginPath(); g.arc(0, -320, 50, 0.2, Math.PI - 0.2); g.lineWidth = 10; g.strokeStyle = "#efe2c0"; g.stroke();
  g.beginPath(); g.moveTo(130, -40); g.lineTo(150, -150); g.lineTo(300, -160); g.lineTo(300, -40); g.closePath(); g.fillStyle = "#d9b77a"; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
  for (let i = 0; i < 9; i++) { g.beginPath(); g.roundRect(-330 + i * 75, -50, 80, 60, 26); g.fillStyle = i % 2 ? "#c9a66b" : "#d8b87e"; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); }
  g.restore();
};
/** small tropical island (sand, green hill, palms) */
export const island = (g, x, y, w, T = 0, palms = 2) => {
  g.beginPath(); g.ellipse(x, y, w / 2, w * 0.12, 0, Math.PI, 0); g.fillStyle = "#f2d9a0"; g.fill(); g.lineWidth = Math.max(3, w / 120); g.strokeStyle = INK; g.stroke();
  g.beginPath(); g.ellipse(x - w * 0.05, y - w * 0.05, w * 0.3, w * 0.12, 0, Math.PI, 0); g.fillStyle = "#5fae5a"; g.fill(); g.stroke();
  for (let i = 0; i < palms; i++) palm(g, x - w * 0.18 + i * w * 0.3, y - w * 0.06, w * (0.42 - i * 0.06), T + i * 2);
};
/** white tern in flight (wings flap) */
export const tern = (g, x, y, s = 1, T = 0, dir = 1) => {
  const f = Math.sin(T * 9);
  g.save(); g.translate(x, y); g.scale(s * dir, s);
  for (const side of [-1, 1]) { g.beginPath(); g.moveTo(-10, 0); g.quadraticCurveTo(-30, -60 * f * side - 10, -90, -70 * f * side - (side > 0 ? 20 : -10)); g.quadraticCurveTo(-40, -10, 20, 0); g.closePath(); g.fillStyle = side > 0 ? "#ffffff" : "#e6eef2"; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); }
  g.beginPath(); g.ellipse(0, 0, 46, 15, 0, 0, Math.PI * 2); g.fillStyle = "#ffffff"; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
  g.beginPath(); g.moveTo(-44, 0); g.lineTo(-74, -12); g.lineTo(-66, 0); g.lineTo(-74, 12); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(44, -4); g.lineTo(70, 2); g.lineTo(44, 6); g.fillStyle = "#1c1a22"; g.fill();
  g.beginPath(); g.arc(32, -4, 4, 0, Math.PI * 2); g.fill();
  g.restore();
};
const blob4 = (g, x, y, rx, ry, c, lw = 5) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = c; g.fill(); g.lineWidth = lw; g.strokeStyle = INK; g.stroke(); };
const eyes2 = (g, x, y, d, r = 6) => { g.fillStyle = INK; for (const k of [-1, 1]) { g.beginPath(); g.arc(x + k * d, y, r, 0, Math.PI * 2); g.fill(); } };
/** cartoon pig, side-ish view facing right; s=1 → ~260 px */
export const pig = (g, x, y, s = 1, T = 0, happy = 1) => {
  g.save(); g.translate(x, y - Math.abs(Math.sin(T * 5)) * 8); g.scale(s, s);
  for (const lx of [-70, -30, 40, 75]) { g.beginPath(); g.roundRect(lx - 12, -40, 24, 50, 8); g.fillStyle = "#e8909a"; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); }
  blob4(g, 0, -90, 120, 75, "#f7b2b8");
  g.beginPath(); g.moveTo(-118, -100); g.bezierCurveTo(-150, -130, -150, -70, -128, -80); g.lineWidth = 5; g.stroke();
  blob4(g, 95, -120, 62, 55, "#f7b2b8");
  g.beginPath(); g.moveTo(70, -165); g.lineTo(60, -205); g.lineTo(95, -172); g.closePath(); g.fillStyle = "#e8909a"; g.fill(); g.stroke();
  blob4(g, 150, -112, 26, 22, "#ee98a2", 4); eyes2(g, 145, -112, 8, 4);
  eyes2(g, 100, -140, 16, 6);
  g.beginPath(); g.arc(108, -100, 16, 0.2, Math.PI - 0.2); g.lineWidth = 4; g.stroke();
  g.restore();
};
/** cartoon dog, sitting, facing right; s=1 → ~240 px */
export const dog = (g, x, y, s = 1, T = 0, col = "#c98a4a") => {
  g.save(); g.translate(x, y); g.scale(s, s);
  const wag = Math.sin(T * 14) * 0.5;
  g.save(); g.translate(-60, -50); g.rotate(-0.8 + wag); g.beginPath(); g.roundRect(-10, -80, 20, 80, 10); g.fillStyle = col; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); g.restore();
  blob4(g, 0, -70, 75, 70, col);
  for (const lx of [-20, 30]) { g.beginPath(); g.roundRect(lx - 14, -40, 28, 44, 10); g.fillStyle = col; g.fill(); g.lineWidth = 5; g.stroke(); }
  blob4(g, 30, -170, 66, 58, col);
  for (const ex of [-25, 70]) { g.save(); g.translate(ex, -210); g.rotate(ex < 0 ? -0.3 : 0.3); blob4(g, 0, 20, 18, 40, shadeHex(col, 0.7), 4); g.restore(); }
  blob4(g, 72, -150, 34, 24, "#f2dcc0", 4); g.beginPath(); g.arc(96, -158, 9, 0, Math.PI * 2); g.fillStyle = INK; g.fill();
  eyes2(g, 38, -182, 16, 6);
  g.beginPath(); g.moveTo(70, -138); g.quadraticCurveTo(80, -112 - 6 * Math.abs(Math.sin(T * 6)), 92, -138); g.fillStyle = "#e86e78"; g.fill(); g.lineWidth = 3; g.stroke();
  g.restore();
};
/** cartoon chicken facing right; s=1 → ~180 px; peck animates */
export const chicken = (g, x, y, s = 1, T = 0, col = "#f6f3ea") => {
  const pk = Math.max(0, Math.sin(T * 6)) * 0.35;
  g.save(); g.translate(x, y); g.scale(s, s);
  g.strokeStyle = "#e0a020"; g.lineWidth = 7; for (const lx of [-15, 15]) { g.beginPath(); g.moveTo(lx, -40); g.lineTo(lx, 0); g.lineTo(lx + 15, 0); g.stroke(); }
  blob4(g, 0, -80, 62, 48, col);
  g.beginPath(); g.moveTo(-55, -100); g.lineTo(-95, -140); g.lineTo(-80, -90); g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
  g.save(); g.translate(40, -110); g.rotate(pk);
  blob4(g, 10, -30, 32, 32, col);
  g.beginPath(); g.moveTo(0, -60); g.arc(4, -64, 10, Math.PI, 0); g.arc(20, -62, 9, Math.PI, 0); g.lineTo(26, -54); g.closePath(); g.fillStyle = "#e0303a"; g.fill(); g.lineWidth = 3; g.stroke();
  g.beginPath(); g.moveTo(38, -32); g.lineTo(60, -26); g.lineTo(38, -20); g.closePath(); g.fillStyle = "#f2b02a"; g.fill(); g.stroke();
  g.beginPath(); g.arc(20, -36, 5, 0, Math.PI * 2); g.fillStyle = INK; g.fill();
  g.restore(); g.restore();
};
/** magnetic compass (for "no compass") */
export const compass = (g, x, y, r, T = 0) => {
  blob4(g, x, y, r, r, "#c9a24a", r * 0.06); blob4(g, x, y, r * 0.82, r * 0.82, "#fffaf0", r * 0.03);
  g.fillStyle = INK; g.font = `900 ${r * 0.22}px Montserrat`; g.textAlign = "center"; g.textBaseline = "middle";
  [["N", 0], ["E", 1], ["S", 2], ["W", 3]].forEach(([l, i]) => { const a = (i * Math.PI) / 2 - Math.PI / 2; g.fillText(l, x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62); });
  g.save(); g.translate(x, y); g.rotate(0.3 * Math.sin(T * 2.3)); g.beginPath(); g.moveTo(0, -r * 0.5); g.lineTo(r * 0.1, 0); g.lineTo(-r * 0.1, 0); g.closePath(); g.fillStyle = "#e0303a"; g.fill();
  g.beginPath(); g.moveTo(0, r * 0.5); g.lineTo(r * 0.1, 0); g.lineTo(-r * 0.1, 0); g.closePath(); g.fillStyle = "#3a4a6a"; g.fill(); g.restore();
  blob4(g, x, y, r * 0.06, r * 0.06, "#c9a24a", 3);
};
/** rolled paper map with dotted route and X */
export const paperMap = (g, x, y, w, rot = 0) => {
  const h = w * 0.7; g.save(); g.translate(x, y); g.rotate(rot);
  g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.fillStyle = "#f2e2b8"; g.fill(); g.lineWidth = w * 0.015; g.strokeStyle = INK; g.stroke();
  for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * w / 2, 0, w * 0.04, h / 2 + 8, 0, 0, Math.PI * 2); g.fillStyle = "#e2cc98"; g.fill(); g.stroke(); }
  g.beginPath(); g.ellipse(-w * 0.2, -h * 0.1, w * 0.14, h * 0.2, 0.4, 0, Math.PI * 2); g.ellipse(w * 0.22, h * 0.12, w * 0.1, h * 0.14, -0.3, 0, Math.PI * 2); g.fillStyle = "#9fd08a"; g.fill(); g.lineWidth = 3; g.stroke();
  g.setLineDash([w * 0.03, w * 0.02]); g.beginPath(); g.moveTo(-w * 0.2, -h * 0.05); g.quadraticCurveTo(0, h * 0.3, w * 0.2, h * 0.1); g.lineWidth = w * 0.012; g.strokeStyle = "#c8323a"; g.stroke(); g.setLineDash([]);
  g.font = `900 ${w * 0.12}px Montserrat`; g.fillStyle = "#c8323a"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("X", w * 0.2, h * 0.1);
  g.restore();
};
/** sextant-like brass instrument */
export const sextant = (g, x, y, s = 1, rot = 0) => {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.beginPath(); g.moveTo(0, -150); g.lineTo(-110, 60); g.arc(0, -150, 236, Math.PI * 0.62, Math.PI * 0.38, true); g.closePath(); g.fillStyle = "#d8a84a"; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
  g.beginPath(); g.moveTo(-40, -60); g.lineTo(40, -60); g.lineTo(0, -150); g.closePath(); g.fillStyle = "#f2d79a"; g.fill(); g.lineWidth = 5; g.stroke();
  for (let i = 0; i < 9; i++) { const a = Math.PI * 0.4 + i * Math.PI * 0.025; g.beginPath(); g.moveTo(Math.cos(a) * 210, -150 + Math.sin(a) * 210); g.lineTo(Math.cos(a) * 236, -150 + Math.sin(a) * 236); g.lineWidth = 3; g.stroke(); }
  g.beginPath(); g.roundRect(30, -120, 120, 34, 14); g.fillStyle = "#3a3440"; g.fill(); g.stroke();
  g.restore();
};
/** star compass: ring of 32 houses with marks, rotating highlight */
export const starCompass = (g, x, y, r, T = 0, k = 1) => {
  g.save(); g.translate(x, y); g.globalAlpha = clamp(k, 0, 1);
  g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.lineWidth = 6; g.strokeStyle = "rgba(255,230,160,0.8)"; g.stroke();
  for (let i = 0; i < 32; i++) { const a = (i / 32) * Math.PI * 2, on = Math.floor(T * 4) % 32 === i; g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, on ? 16 : 9, 0, Math.PI * 2); g.fillStyle = on ? "#fff3b0" : "#c8b07a"; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    if (i % 4 === 0) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92); g.lineWidth = 2; g.strokeStyle = "rgba(255,230,160,0.35)"; g.stroke(); } }
  g.restore();
};
/** smartphone; txt on screen */
export const phone = (g, x, y, h, rot = 0, txt = "", scr = "#4fb3f0") => {
  const w = h * 0.5; g.save(); g.translate(x, y); g.rotate(rot);
  g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, w * 0.14); g.fillStyle = "#1c1a22"; g.fill(); g.lineWidth = h * 0.02; g.strokeStyle = INK; g.stroke();
  g.beginPath(); g.roundRect(-w / 2 + w * 0.08, -h / 2 + w * 0.12, w * 0.84, h - w * 0.24, w * 0.06); g.fillStyle = scr; g.fill();
  if (txt) { g.fillStyle = "#fff"; g.font = `900 ${w * 0.15}px Montserrat`; g.textAlign = "center"; g.textBaseline = "middle"; txt.split("\n").forEach((l, i, a) => g.fillText(l, 0, (i - (a.length - 1) / 2) * w * 0.2)); }
  g.restore();
};

// ======================= (2026-11-26, bicycle-africa) =======================
/** wheel with spokes (spin = angle) */
const wheel = (g, x, y, r, spin, rim = "#2a2a30") => {
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.lineWidth = r * 0.2; g.strokeStyle = INK; g.stroke(); g.lineWidth = r * 0.12; g.strokeStyle = rim; g.stroke();
  g.lineWidth = Math.max(1.5, r * 0.03); g.strokeStyle = "#8d949c";
  for (let i = 0; i < 8; i++) { const a = spin + (i * Math.PI) / 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9); g.stroke(); }
  g.beginPath(); g.arc(x, y, r * 0.1, 0, Math.PI * 2); g.fillStyle = INK; g.fill();
};
/** 1930s touring bicycle in side view facing +x, ground at y; optional side-profile rider (r = {skin, shirt, pants, hat, hatCol}).
 *  T drives wheel spin + pedalling; bags = loaded panniers + bedroll; push = rider walks beside it (pass rider null and draw your own) */
export const bikeSide = (g, x, y, s, T = 0, r = null, o = {}) => {
  g.save(); g.translate(x, y); g.scale(s * (o.dir || 1), s);
  const R = 110, spin = o.still ? 0 : T * 7, wy = -R, bx = -180, fx = 190;
  const frame = o.frame ?? "#2f4a6a";
  wheel(g, bx, wy, R, spin); wheel(g, fx, wy, R, spin);
  const BB = [-10, -95], ST = [-60, -300], HT = [140, -290], HB = [130, -360];
  const tube = (a, b, w = 16) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineWidth = w + 8; g.strokeStyle = INK; g.stroke(); g.lineWidth = w; g.strokeStyle = frame; g.stroke(); };
  tube([bx, wy], BB); tube([bx, wy], ST); tube(BB, ST); tube(ST, HT); tube(BB, HT); tube(HT, [fx, wy], 14); tube(HT, HB, 12);
  // handlebar + saddle
  g.beginPath(); g.moveTo(HB[0] - 10, HB[1]); g.quadraticCurveTo(HB[0] + 40, HB[1] - 20, HB[0] + 60, HB[1] + 20); g.lineWidth = 18; g.strokeStyle = INK; g.stroke(); g.lineWidth = 10; g.strokeStyle = "#8d949c"; g.stroke();
  g.beginPath(); g.ellipse(ST[0] - 10, ST[1] - 14, 52, 16, 0, 0, Math.PI * 2); g.fillStyle = "#4a3020"; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
  if (o.bags !== false) { // rear rack bags + bedroll
    g.beginPath(); g.roundRect(bx - 110, wy - 150, 150, 110, 18); g.fillStyle = "#8a6a3a"; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.moveTo(bx - 100, wy - 110); g.lineTo(bx + 30, wy - 110); g.lineWidth = 5; g.stroke();
    g.beginPath(); g.ellipse(bx - 35, wy - 175, 85, 30, 0, 0, Math.PI * 2); g.fillStyle = "#5a7a4a"; g.fill(); g.lineWidth = 7; g.stroke();
    g.beginPath(); g.roundRect(fx - 70, wy - 170, 80, 70, 12); g.fillStyle = "#8a6a3a"; g.fill(); g.lineWidth = 6; g.stroke();
  }
  // crank
  const ca = o.still ? 0.6 : T * 7, cr = 42;
  const P1 = [BB[0] + Math.cos(ca) * cr, BB[1] + Math.sin(ca) * cr], P2 = [BB[0] - Math.cos(ca) * cr, BB[1] - Math.sin(ca) * cr];
  g.beginPath(); g.arc(BB[0], BB[1], 26, 0, Math.PI * 2); g.fillStyle = "#c9ccd2"; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
  if (r) {
    const hip = [ST[0] - 4, ST[1] - 30], sk = r.skin ?? "#f3d2a8", lean = o.lean ?? 0.25;
    const knee = (p) => { const dx = p[0] - hip[0], dy = p[1] - hip[1], d = Math.hypot(dx, dy), L = 135, h = Math.sqrt(Math.max(0, L * L - (d / 2) * (d / 2)));
      return [hip[0] + dx / 2 + (dy / d) * h * -1 * -1, hip[1] + dy / 2 - (dx / d) * h * -1]; };
    const leg = (p, c) => { const k = knee(p); g.beginPath(); g.moveTo(hip[0], hip[1]); g.lineTo(k[0], k[1]); g.lineTo(p[0], p[1]); g.lineWidth = 40; g.strokeStyle = INK; g.stroke(); g.lineWidth = 30; g.strokeStyle = c; g.stroke();
      g.beginPath(); g.ellipse(p[0] + 14, p[1] + 6, 30, 14, 0, 0, Math.PI * 2); g.fillStyle = r.boots ?? "#3a2a1e"; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); };
    leg(P2, shadeHex(r.pants ?? "#7a6a4a", 0.75));
    // torso leaning forward
    const sh = [hip[0] + 150 * Math.sin(lean) + 20, hip[1] - 220 * Math.cos(lean)];
    g.beginPath(); g.moveTo(hip[0] - 40, hip[1] + 10); g.quadraticCurveTo(hip[0] - 50, sh[1] + 30, sh[0] - 20, sh[1] - 10); g.lineTo(sh[0] + 45, sh[1] + 15); g.quadraticCurveTo(hip[0] + 70, hip[1] - 60, hip[0] + 40, hip[1] + 12); g.closePath();
    g.fillStyle = r.shirt ?? "#d8c08a"; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
    if (r.pack) { g.beginPath(); g.roundRect(hip[0] - 95, sh[1] + 20, 70, 130, 18); g.fillStyle = r.pack; g.fill(); g.lineWidth = 6; g.stroke(); }
    // arm to the handlebar
    g.beginPath(); g.moveTo(sh[0] + 10, sh[1] + 20); g.quadraticCurveTo(sh[0] + 70, sh[1] + 70, HB[0] + 30, HB[1] - 8); g.lineWidth = 34; g.strokeStyle = INK; g.stroke(); g.lineWidth = 24; g.strokeStyle = shadeHex(r.shirt ?? "#d8c08a", 0.85); g.stroke();
    g.beginPath(); g.arc(HB[0] + 32, HB[1] - 8, 16, 0, Math.PI * 2); g.fillStyle = sk; g.fill(); g.lineWidth = 5; g.stroke();
    // head (profile bean) + nose + eye + hat
    const hx = sh[0] + 40, hy = sh[1] - 90 + (o.still ? 0 : 4 * Math.sin(T * 14));
    g.beginPath(); g.ellipse(hx, hy, 62, 74, 0.1, 0, Math.PI * 2); g.fillStyle = sk; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.ellipse(hx + 62, hy + 8, 16, 13, 0, 0, Math.PI * 2); g.fillStyle = sk; g.fill(); g.lineWidth = 5; g.stroke();
    g.beginPath(); g.arc(hx + 28, hy - 6, 8, 0, Math.PI * 2); g.fillStyle = INK; g.fill();
    g.beginPath(); g.arc(hx + 30, hy + 30, 14, 0.2, 1.6); g.lineWidth = 5; g.stroke();
    if (r.moustache) { g.beginPath(); g.ellipse(hx + 48, hy + 26, 20, 8, -0.2, 0, Math.PI * 2); g.fillStyle = r.moustache; g.fill(); g.lineWidth = 3; g.stroke(); }
    const hc = r.hatCol ?? "#c9a86a";
    if (r.hat === "safari") { g.beginPath(); g.ellipse(hx + 4, hy - 46, 105, 22, 0.05, 0, Math.PI * 2); g.fillStyle = hc; g.fill(); g.lineWidth = 6; g.stroke();
      g.beginPath(); g.ellipse(hx, hy - 62, 62, 46, 0, Math.PI, 0); g.closePath(); g.fillStyle = hc; g.fill(); g.lineWidth = 6; g.stroke(); g.fillStyle = r.band ?? "#5a3a24"; g.fillRect(hx - 60, hy - 66, 120, 14); }
    else { g.beginPath(); g.ellipse(hx - 8, hy - 40, 62, 44, 0, Math.PI * 1.05, Math.PI * 2.1); g.fillStyle = r.hair ?? "#3a2a1e"; g.fill(); g.lineWidth = 6; g.stroke(); }
    leg(P1, r.pants ?? "#7a6a4a");
  }
  // pedals
  for (const p of [P1, P2]) { g.beginPath(); g.roundRect(p[0] - 22, p[1] - 6, 44, 12, 4); g.fillStyle = "#555"; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); }
  g.restore();
};
/** acacia (flat-topped savanna tree), base at y */
export const acacia = (g, x, y, h, col = "#6f8a3a", T = 0) => {
  g.save(); g.translate(x, y); const s = h / 400;
  g.beginPath(); g.moveTo(-14 * s, 0); g.lineTo(-8 * s, -220 * s); g.lineTo(-90 * s, -330 * s); g.lineTo(-70 * s, -340 * s); g.lineTo(0, -250 * s); g.lineTo(80 * s, -345 * s); g.lineTo(98 * s, -333 * s); g.lineTo(14 * s, -215 * s); g.lineTo(16 * s, 0); g.closePath();
  g.fillStyle = "#5a3a24"; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
  const sw = 4 * Math.sin(T * 1.3);
  g.beginPath(); g.ellipse(sw * s, -370 * s, 210 * s, 50 * s, 0, 0, Math.PI * 2); g.fillStyle = col; g.fill(); g.lineWidth = 6; g.stroke();
  g.beginPath(); g.ellipse(-60 * s + sw * s, -395 * s, 110 * s, 30 * s, 0, 0, Math.PI * 2); g.fillStyle = shadeHex(col, 1.12); g.fill(); g.lineWidth = 5; g.stroke();
  g.restore();
};
/** rolling dunes band from y down */
export const dunes = (g, y, T = 0, cols = ["#f2c27a", "#e8a95e", "#d98f48"], x0 = -1500, x1 = 2600) => {
  cols.forEach((c, i) => {
    const yy = y + i * 150; g.beginPath(); g.moveTo(x0, 4000);
    for (let x = x0; x <= x1; x += 40) g.lineTo(x, yy + 70 * Math.sin(x / (260 + i * 90) + i * 1.7) + 30 * Math.sin(x / 120 + i));
    g.lineTo(x1, 4000); g.closePath(); g.fillStyle = c; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
  });
};
/** cartoon lion, side view facing +x, feet at y; roar 0..1 opens the mouth */
export const lion = (g, x, y, s = 1, T = 0, roar = 0, dir = 1) => {
  g.save(); g.translate(x, y); g.scale(s * dir, s);
  const ph = T * 6;
  for (const [lx, a] of [[-110, 0], [-70, 2], [80, 1], [120, 3]]) { g.beginPath(); g.roundRect(lx - 18, -110 + 6 * Math.sin(ph + a), 36, 110, 14); g.fillStyle = lx === -70 || lx === 120 ? "#c98a3a" : "#d99a48"; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); }
  g.beginPath(); g.moveTo(-150, -150); g.quadraticCurveTo(-240, -170 + 20 * Math.sin(ph), -250, -260); g.lineWidth = 20; g.strokeStyle = INK; g.stroke(); g.lineWidth = 11; g.strokeStyle = "#d99a48"; g.stroke();
  blob4(g, -252, -262, 22, 22, "#7a3a1e", 5);
  blob4(g, 0, -170, 175, 80, "#e8a95a", 6);
  // mane
  g.beginPath(); for (let i = 0; i <= 20; i++) { const a = (i / 20) * Math.PI * 2, rr = i % 2 ? 120 : 150; g.lineTo(150 + Math.cos(a) * rr, -260 + Math.sin(a) * rr); } g.closePath(); g.fillStyle = "#9a4a22"; g.fill(); g.lineWidth = 7; g.stroke();
  blob4(g, 165, -255, 92, 86, "#f2b464", 6);
  for (const ex of [110, 200]) blob4(g, ex, -335, 22, 20, "#e8a95a", 5);
  g.beginPath(); g.arc(140, -280, 9, 0, Math.PI * 2); g.arc(200, -280, 9, 0, Math.PI * 2); g.fillStyle = INK; g.fill();
  g.beginPath(); g.moveTo(125, -300); g.lineTo(152, -292); g.moveTo(215, -300); g.lineTo(188, -292); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
  blob4(g, 172, -230, 50, 34, "#f6d39a", 5); g.beginPath(); g.moveTo(160, -250); g.lineTo(184, -250); g.lineTo(172, -236); g.closePath(); g.fillStyle = INK; g.fill();
  const m = clamp(roar, 0, 1);
  if (m > 0.05) { g.beginPath(); g.ellipse(172, -205, 34, 6 + 34 * m, 0, 0, Math.PI * 2); g.fillStyle = "#6a1a22"; g.fill(); g.lineWidth = 5; g.stroke();
    g.fillStyle = "#fff"; for (const tx of [150, 194]) { g.beginPath(); g.moveTo(tx - 8, -208 - 26 * m); g.lineTo(tx + 8, -208 - 26 * m); g.lineTo(tx, -190 - 26 * m); g.closePath(); g.fill(); g.lineWidth = 3; g.stroke(); } }
  else { g.beginPath(); g.moveTo(150, -212); g.quadraticCurveTo(172, -200, 194, -212); g.lineWidth = 5; g.stroke(); }
  g.restore();
};
/** dromedary camel, side view facing +x, feet at y; walk phase; optional rider colour block (seat) */
export const camel = (g, x, y, s = 1, phase = 0, col = "#d9a866", dir = 1) => {
  g.save(); g.translate(x, y); g.scale(s * dir, s);
  const p = phase * Math.PI * 2, bob = -6 * Math.abs(Math.sin(p));
  const leg = (lx, a, c) => { g.beginPath(); g.moveTo(lx, -230 + bob); g.lineTo(lx + 22 * Math.sin(a), -110); g.lineTo(lx + 30 * Math.sin(a + 0.6), 0); g.lineWidth = 26; g.strokeStyle = INK; g.stroke(); g.lineWidth = 15; g.strokeStyle = c; g.stroke(); };
  leg(-90, Math.sin(p + 1.4), shadeHex(col, 0.8)); leg(90, Math.sin(p + 2.8), shadeHex(col, 0.8));
  g.beginPath(); g.moveTo(-170, -250 + bob); g.quadraticCurveTo(-200, -200 + bob, -190, -160 + bob); g.lineWidth = 12; g.strokeStyle = INK; g.stroke();
  g.beginPath(); g.moveTo(-180, -250 + bob); g.bezierCurveTo(-170, -330 + bob, -60, -440 + bob, 10, -350 + bob); g.bezierCurveTo(60, -300 + bob, 150, -310 + bob, 170, -260 + bob);
  g.quadraticCurveTo(160, -200 + bob, 0, -200 + bob); g.quadraticCurveTo(-150, -195 + bob, -180, -250 + bob); g.closePath(); g.fillStyle = col; g.fill(); ink(g, 6);
  // neck + head
  g.beginPath(); g.moveTo(140, -280 + bob); g.quadraticCurveTo(230, -260 + bob, 240, -400 + bob); g.lineTo(290, -410 + bob); g.quadraticCurveTo(275, -240 + bob, 165, -225 + bob); g.closePath(); g.fillStyle = col; g.fill(); ink(g, 6);
  g.beginPath(); g.ellipse(285, -420 + bob, 58, 30, 0.15, 0, Math.PI * 2); g.fillStyle = col; g.fill(); ink(g, 6);
  g.beginPath(); g.arc(275, -432 + bob, 7, 0, Math.PI * 2); g.fillStyle = INK; g.fill(); g.beginPath(); g.moveTo(262, -440 + bob); g.lineTo(290, -444 + bob); g.lineWidth = 5; g.stroke();
  g.beginPath(); g.moveTo(320, -405 + bob); g.quadraticCurveTo(333, -398 + bob, 340, -410 + bob); g.lineWidth = 4; g.stroke();
  blob4(g, 248, -448 + bob, 10, 16, shadeHex(col, 0.85), 4);
  // saddle blanket on the hump
  g.beginPath(); g.moveTo(-80, -360 + bob); g.quadraticCurveTo(10, -420 + bob, 60, -330 + bob); g.lineTo(40, -270 + bob); g.lineTo(-90, -280 + bob); g.closePath(); g.fillStyle = "#b8323a"; g.fill(); ink(g, 5);
  g.fillStyle = "#f2c94a"; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(-70 + i * 35, -278 + bob, 7, 0, Math.PI * 2); g.fill(); }
  leg(-60, Math.sin(p), col); leg(120, Math.sin(p + 3.4), col);
  g.restore();
  return (-380 + bob) * s;
};
/** small river boat with a palm-thatch cabin and a name on the bow; waterline at y */
export const riverBoat = (g, x, y, s = 1, T = 0, name = "MARYS", dir = 1) => {
  g.save(); g.translate(x, y + 6 * Math.sin(T * 2)); g.rotate(0.02 * Math.sin(T * 1.6)); g.scale(s * dir, s);
  g.beginPath(); g.moveTo(-330, -60); g.lineTo(330, -60); g.quadraticCurveTo(320, 30, 230, 40); g.lineTo(-250, 40); g.quadraticCurveTo(-330, 20, -330, -60); g.closePath();
  g.fillStyle = "#7a4a2a"; g.fill(); ink(g, 7); g.fillStyle = "#5a321c"; g.fillRect(-320, -30, 640, 12);
  g.beginPath(); g.moveTo(-200, -60); g.lineTo(-200, -210); g.lineTo(120, -210); g.lineTo(120, -60); g.fillStyle = "#c9a060"; g.fill(); ink(g, 6);
  g.beginPath(); g.moveTo(-240, -200); g.quadraticCurveTo(-40, -300, 160, -200); g.closePath(); g.fillStyle = "#8a9a3a"; g.fill(); ink(g, 6);
  g.strokeStyle = "rgba(60,40,20,0.5)"; g.lineWidth = 4; for (let i = -180; i < 120; i += 34) { g.beginPath(); g.moveTo(i, -200); g.lineTo(i + 10, -70); g.stroke(); }
  g.beginPath(); g.roundRect(-150, -170, 70, 60, 6); g.fillStyle = "#3a2a1e"; g.fill(); ink(g, 4);
  g.save(); g.scale(dir, 1); g.font = "900 46px Montserrat"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#f6f0d8"; g.fillText(name, dir * 230, -14); g.restore();
  g.restore();
};
/** mosquito with buzzing wings */
export const mosquito = (g, x, y, s = 1, T = 0) => {
  g.save(); g.translate(x, y); g.scale(s, s);
  const f = Math.sin(T * 90) * 0.5;
  for (const k of [-1, 1]) { g.save(); g.rotate(k * (0.6 + f)); g.beginPath(); g.ellipse(0, -40, 16, 40, 0, 0, Math.PI * 2); g.fillStyle = "rgba(220,240,255,0.7)"; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); g.restore(); }
  g.beginPath(); g.ellipse(0, 0, 40, 14, 0.2, 0, Math.PI * 2); g.fillStyle = "#4a3a3a"; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
  g.beginPath(); g.arc(42, -6, 14, 0, Math.PI * 2); g.fillStyle = "#4a3a3a"; g.fill(); g.stroke(); g.beginPath(); g.arc(48, -10, 6, 0, Math.PI * 2); g.fillStyle = "#e83a3a"; g.fill();
  g.beginPath(); g.moveTo(54, -2); g.lineTo(92, 14); g.lineWidth = 4; g.stroke();
  for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-10 + i * 16, 8); g.lineTo(-30 + i * 22, 50); g.lineTo(-40 + i * 24, 60); g.lineWidth = 3; g.stroke(); }
  g.restore();
};
/** canvas tent, base at y */
export const tent = (g, x, y, s = 1, col = "#c9b27a", glow = 0) => {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.beginPath(); g.moveTo(-220, 0); g.lineTo(0, -230); g.lineTo(220, 0); g.closePath(); g.fillStyle = col; g.fill(); ink(g, 7);
  g.beginPath(); g.moveTo(-60, 0); g.lineTo(0, -170); g.lineTo(60, 0); g.closePath(); g.fillStyle = glow ? `rgba(255,190,90,${0.5 + 0.5 * glow})` : "#5a4a30"; g.fill(); ink(g, 5);
  g.beginPath(); g.moveTo(0, -230); g.lineTo(0, -270); g.lineWidth = 8; g.stroke();
  g.restore();
};
/** striped lighthouse (Cape Agulhas has a red/white one), base at y */
export const lighthouse = (g, x, y, h, T = 0) => {
  g.save(); g.translate(x, y); const s = h / 600;
  g.beginPath(); g.moveTo(-70 * s, 0); g.lineTo(-45 * s, -480 * s); g.lineTo(45 * s, -480 * s); g.lineTo(70 * s, 0); g.closePath(); g.fillStyle = "#f6f0e0"; g.fill(); ink(g, 7);
  g.save(); g.clip(); g.fillStyle = "#c8323a"; for (let i = 0; i < 4; i++) g.fillRect(-90 * s, (-100 - i * 120) * s, 180 * s, 60 * s); g.restore();
  g.beginPath(); g.moveTo(-70 * s, 0); g.lineTo(-45 * s, -480 * s); g.lineTo(45 * s, -480 * s); g.lineTo(70 * s, 0); g.closePath(); ink(g, 7);
  g.beginPath(); g.rect(-60 * s, -500 * s, 120 * s, 20 * s); g.fillStyle = "#3a3a44"; g.fill(); ink(g, 5);
  g.beginPath(); g.rect(-34 * s, -570 * s, 68 * s, 70 * s); g.fillStyle = "#ffe48a"; g.fill(); ink(g, 5);
  g.beginPath(); g.moveTo(-46 * s, -570 * s); g.lineTo(0, -620 * s); g.lineTo(46 * s, -570 * s); g.closePath(); g.fillStyle = "#c8323a"; g.fill(); ink(g, 5);
  const a = T * 1.5; g.save(); g.translate(0, -535 * s); g.rotate(Math.sin(a) * 0.5);
  const gr = g.createLinearGradient(0, 0, 700 * s, 0); gr.addColorStop(0, "rgba(255,240,170,0.55)"); gr.addColorStop(1, "rgba(255,240,170,0)");
  g.beginPath(); g.moveTo(0, 0); g.lineTo(700 * s, -110 * s); g.lineTo(700 * s, 110 * s); g.closePath(); g.fillStyle = gr; g.fill(); g.restore();
  g.restore();
};
/** whitewashed North-African town (Algiers): stacked cubes, arches, a minaret; base at y */
export const whiteTown = (g, y, T = 0, seed = 3) => {
  for (let row = 0; row < 3; row++) for (let i = 0; i < 9; i++) {
    const w = 120 + rnd(i + row * 9, seed) * 90, h = 90 + rnd(i, row + seed) * 100, x = -120 + i * 150 + (row % 2) * 60, yy = y - row * 110;
    g.beginPath(); g.rect(x, yy - h, w, h); g.fillStyle = ["#fbf7ee", "#f1ebde", "#e8e0cf"][(i + row) % 3]; g.fill(); ink(g, 5);
    g.beginPath(); g.roundRect(x + w * 0.3, yy - h * 0.7, w * 0.22, h * 0.42, [14, 14, 0, 0]); g.fillStyle = "#2f6fb0"; g.fill(); ink(g, 3);
  }
  const mx = 820, my = y - 330; g.beginPath(); g.rect(mx - 40, my - 300, 80, 300); g.fillStyle = "#fbf7ee"; g.fill(); ink(g, 6);
  g.beginPath(); g.rect(mx - 52, my - 320, 104, 26); g.fill(); ink(g, 5); g.beginPath(); g.rect(mx - 26, my - 380, 52, 60); g.fillStyle = "#fbf7ee"; g.fill(); ink(g, 5);
  g.beginPath(); g.arc(mx, my - 380, 26, Math.PI, 0); g.fillStyle = "#3f9e6a"; g.fill(); ink(g, 5);
};
/** Africa outline (normalised [0..1] points) + helpers to place towns */
export const AFRICA = [[0.08, 0.12], [0.2, 0.07], [0.33, 0.08], [0.42, 0.12], [0.52, 0.13], [0.62, 0.12], [0.68, 0.14], [0.74, 0.27], [0.82, 0.37], [0.95, 0.41], [0.92, 0.47], [0.83, 0.57],
  [0.8, 0.66], [0.78, 0.74], [0.7, 0.82], [0.6, 0.93], [0.47, 0.975], [0.42, 0.93], [0.38, 0.8], [0.34, 0.66], [0.33, 0.55], [0.31, 0.47], [0.27, 0.43], [0.14, 0.43], [0.07, 0.38], [0.0, 0.3], [0.03, 0.2]];
export const africa = (g, X, Y, Wd, Hd, col = "#e8b35e", T = 0) => {
  g.beginPath(); AFRICA.forEach(([u, v], i) => (i ? g.lineTo(X + u * Wd, Y + v * Hd) : g.moveTo(X + u * Wd, Y + v * Hd))); g.closePath();
  g.fillStyle = col; g.fill(); ink(g, 9);
  g.save(); g.clip(); // green jungle belt + savanna band + sahara stays sand
  g.fillStyle = "rgba(90,150,70,0.85)"; g.beginPath(); g.ellipse(X + 0.5 * Wd, Y + 0.53 * Hd, 0.32 * Wd, 0.09 * Hd, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "rgba(170,170,80,0.6)"; g.fillRect(X, Y + 0.38 * Hd, Wd, 0.07 * Hd); g.fillRect(X, Y + 0.62 * Hd, Wd, 0.14 * Hd);
  g.restore();
  g.beginPath(); g.ellipse(X + 0.86 * Wd, Y + 0.72 * Hd, 0.035 * Wd, 0.09 * Hd, 0.3, 0, Math.PI * 2); g.fillStyle = col; g.fill(); ink(g, 6); // Madagascar
};
