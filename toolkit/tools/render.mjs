import { chromium } from "playwright";
import http from "http"; import fs from "fs"; import path from "path";
const [,, outDir, spec] = process.argv; fs.mkdirSync(outDir, { recursive: true });
const root = path.resolve("web");
const srv = http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(q.url.split("?")[0])); const ext = path.extname(p);
  r.writeHead(200, { "content-type": ext === ".js" ? "text/javascript" : ext === ".html" ? "text/html" : "application/octet-stream" }); fs.createReadStream(p).pipe(r); }).listen(8123);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell" });
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
pg.on("pageerror", (e) => console.log("PAGEERR", e.message)); pg.on("console", (m) => m.type() === "error" && console.log("CONSOLE", m.text()));
await pg.goto("http://localhost:8123/index.html"); await pg.waitForFunction(() => window.ready, null, { timeout: 30000 });
const N = await pg.evaluate(() => Math.round(window.DUR * 30));
let frames = [];
if (spec === "all") frames = [...Array(N).keys()];
else spec.split(",").forEach((s) => { if (s.includes("-")) { const [a, c] = s.split("-").map(Number); for (let i = a; i <= c; i++) frames.push(i); } else frames.push(Number(s)); });
const t0 = Date.now();
for (const f of frames) {
  const out = path.join(outDir, `f${String(f).padStart(4, "0")}.jpg`);
  if (process.env.RESUME && fs.existsSync(out)) continue;
  const url = await pg.evaluate((f) => { window.renderFrame(f); return document.getElementById("c").toDataURL("image/jpeg", 0.93); }, f);
  fs.writeFileSync(out, Buffer.from(url.split(",")[1], "base64"));
  if (f % 100 === 0) console.log("frame", f, "/", N, ((Date.now() - t0) / 1000).toFixed(0) + "s");
}
console.log("done", frames.length, "frames in", ((Date.now() - t0) / 1000).toFixed(1), "s");
await b.close(); srv.close();
