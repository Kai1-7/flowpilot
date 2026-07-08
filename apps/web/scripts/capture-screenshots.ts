import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const webUrl = process.env.FLOWPILOT_WEB_URL ?? "http://localhost:5173";
const outputDir = path.resolve(process.cwd(), "../../docs/screenshots");

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });

await page.goto(webUrl, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(outputDir, "dashboard.png"), fullPage: true });

await page.goto(`${webUrl}/automations`, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(outputDir, "automations.png"), fullPage: true });

await page.goto(`${webUrl}/automations/new?template=csv-report`, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(outputDir, "builder.png"), fullPage: true });

await page.goto(`${webUrl}/runs`, { waitUntil: "networkidle" });
const preferredRun = page.getByRole("link", { name: "Customer CSV Insight" }).first();
if ((await preferredRun.count()) > 0) {
  await preferredRun.click();
} else {
  await page.locator("tbody a").first().click();
}
await page.waitForLoadState("networkidle");
await page.getByText("Timeline").waitFor();
await page.evaluate(() => window.scrollTo(0, 0));
await page.screenshot({ path: path.join(outputDir, "runs.png"), fullPage: true });

await page.goto(`${webUrl}/artifacts`, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(outputDir, "artifacts.png"), fullPage: true });

await browser.close();
console.log(`Screenshots written to ${outputDir}`);
