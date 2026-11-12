// Records each local site in a phone-sized viewport with a smooth scroll. Usage: node record.mjs
import { chromium } from "playwright";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const ROOT = "D:/Websites/motion-sites";
const SITES = [
  ["kv-fracht", "kv"], ["wendland-bibliothek", "wb"], ["runway", "rw"],
  ["tiefenpfad", "tp"], ["nektarlinie", "nl"], ["kernwald", "kw"],
];
const OUT = path.resolve("rec"); fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// optional args: key=url (already-running dev servers)
const EXT = Object.fromEntries(process.argv.slice(2).map((a) => a.split("=")));
let port = 8710;
for (const [dir, key] of SITES) {
  port++;
  if (Object.keys(EXT).length && !EXT[key]) continue;
  const srv = EXT[key] ? { kill() {} } : spawn("python", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], { cwd: path.join(ROOT, dir), stdio: "ignore" });
  const url = EXT[key] || `http://127.0.0.1:${port}/`;
  await sleep(800);
  const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
  const ctx = await browser.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 1, recordVideo: { dir: OUT, size: { width: 540, height: 960 } } });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "load", timeout: 60000 });
  } catch (e) { console.log(key, "load warn", e.message); }
  await sleep(2500);
  await page.mouse.move(270, 480);
  for (let i = 0; i < 160; i++) { await page.mouse.wheel(0, 14); await sleep(50); }
  await sleep(600);
  const vpath = await page.video().path();
  await ctx.close(); await browser.close(); srv.kill();
  fs.renameSync(vpath, path.join(OUT, `${key}.webm`));
  console.log(key, "ok");
}
