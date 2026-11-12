// Screenshots of the ribbon page at several scroll positions (QA). Expects a server on :8765.
import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); }); page.on("pageerror", (e) => errs.push(e.message));
await page.goto("http://127.0.0.1:8765/index.html", { waitUntil: "load" });
await page.waitForTimeout(3500);
const out = process.argv[2];
for (const f of [0, 0.22, 0.32, 0.45, 0.6, 0.95]) {
  await page.evaluate((f) => scrollTo(0, f * (document.getElementById("track").offsetHeight - innerHeight)), f);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${out}/rb_${String(f).replace(".", "")}.png` });
}
console.log("errors:", JSON.stringify(errs));
await browser.close();
