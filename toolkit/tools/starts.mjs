import { chromium } from "playwright"; import http from "http"; import fs from "fs"; import path from "path";
const root = path.resolve("web");
const srv = http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(q.url.split("?")[0])); const ext = path.extname(p);
  r.writeHead(200, { "content-type": ext === ".js" ? "text/javascript" : ext === ".html" ? "text/html" : "application/octet-stream" }); fs.createReadStream(p).pipe(r); }).listen(8124);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell" });
const pg = await b.newPage(); pg.on("pageerror", (e) => console.log("PAGEERR", e.message));
await pg.goto("http://localhost:8124/index.html"); await pg.waitForFunction(() => window.ready, null, { timeout: 30000 });
const s = await pg.evaluate(() => window.SHOT_STARTS.map((x) => Math.round(x * 100) / 100));
fs.writeFileSync("starts.json", JSON.stringify(s)); console.log(s.length, JSON.stringify(s)); await b.close(); srv.close();
