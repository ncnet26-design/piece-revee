import { chromium } from "@playwright/test";
const [url, out, w = "1440", h = "1000", full = "1"] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.addInitScript(() => { localStorage.setItem("pr_camille_guide", "off"); localStorage.setItem("pr_camille_vu", "1"); });
await p.goto(url, { waitUntil: "networkidle" }); await p.waitForTimeout(1500);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); } scrollTo(0, 0); });
await p.waitForTimeout(800); await p.screenshot({ path: out, fullPage: full === "1" }); await b.close();
