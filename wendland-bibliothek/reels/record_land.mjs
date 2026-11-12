// Desktop (16:10) recordings of every motion site for the ribbon page. Usage: node record_land.mjs [key ...]
import { chromium } from "playwright";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const ROOT = "D:/Websites/motion-sites";
const rwDir = fs.readdirSync(ROOT).find((d) => d.startsWith("sichere"));
// [key, dir, page, server]  server: "static" = python http.server, "vite" = npx vite dev server
const SITES = [
  ["nl", "nektarlinie", "index.html", "static"],
  ["kv", "kv-fracht", "index.html", "static"],
  ["kw", "kernwald", "index.html", "static"],
  ["tp", "tiefenpfad", "rundgang.html", "static"],
  ["fw", "fadenwerk", "index.html", "static"],
  ["wb", "wendland-bibliothek", "", "vite"],
  ["rw", rwDir, "", "vite"],
];
const OUT = path.resolve("rec_land"); fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const only = process.argv.slice(2);
let port = Number(process.env.REC_PORT || 8810);
for (const [key, dir, pagePath, kind] of SITES) {
  port++;
  if (only.length && !only.includes(key)) continue;
  const cwd = path.join(ROOT, dir);
  const srv = kind === "vite"
    ? spawn(path.join(cwd, "node_modules", ".bin", "vite.cmd"), ["--port", String(port), "--host", "127.0.0.1", "--strictPort"], { cwd, stdio: "ignore", shell: true })
    : spawn("python", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], { cwd, stdio: "ignore" });
  const url = `http://127.0.0.1:${port}/${pagePath}`;
  for (let k = 0; k < 60; k++) { try { const r = await fetch(url); await r.arrayBuffer(); if (r.ok) break; } catch {} await sleep(500); }   // wait until the server answers
  const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, recordVideo: { dir: OUT, size: { width: 1440, height: 900 } } });
  const page = await ctx.newPage();
  try { await page.goto(url, { waitUntil: "load", timeout: 90000 }); } catch (e) { console.log(key, "load warn", e.message); }
  await sleep(3500);
  await page.mouse.move(720, 450);
  for (let i = 0; i < 230; i++) { await page.mouse.wheel(0, 16); await sleep(50); }   // ~12 s of smooth scrolling
  await sleep(800);
  const vpath = await page.video().path();
  await ctx.close(); await browser.close();
  if (kind === "vite") spawn("taskkill", ["/pid", String(srv.pid), "/T", "/F"], { stdio: "ignore" }); else srv.kill();
  fs.renameSync(vpath, path.join(OUT, `${key}.webm`));
  console.log(key, "ok", url);
}
