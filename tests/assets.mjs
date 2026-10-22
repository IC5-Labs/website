import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const BASE = "http://localhost:5000";
// Usage: node tests/assets.mjs [screenshot folder]. Runs against a freshly reset local database.
const OUT = process.argv[2] ?? "/tmp";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
const p = await ctx.newPage();
await p.goto(`${BASE}/signin`);
await p.fill('form:has(input[value="dev"]) input[name="email"]', "kit@ic5labs.com");
await p.click('form:has(input[value="dev"]) button[type="submit"]');
await p.waitForLoadState("networkidle");

// upload three files at once
await p.goto(`${BASE}/admin/assets`);
await p.setInputFiles('input[name="files"]', [
  "public/assets/blog-new-product-bottleneck.jpg",
  "public/assets/kit-corry.jpg",
  "content/documents/customer-signals-agent-product-brief.pdf",
]);
await p.click('button:has-text("Upload")');
await p.waitForURL(/ok=uploaded/);
console.log("upload:", (await p.locator(".flash").first().innerText()).trim());
const cards = await p.locator(".assetcard .aname").allInnerTexts();
console.log("cards:", cards);
assert.equal(cards.length, 3);
await p.screenshot({ path: `${OUT}/assets-library.png`, fullPage: true });

// rejected file type
await p.setInputFiles('input[name="files"]', { name: "logo.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>") });
await p.click('button:has-text("Upload")');
await p.waitForURL(/error=filetype/);
console.log("svg rejected:", (await p.locator(".flash").first().innerText()).slice(0, 60));

// copy markdown
await p.goto(`${BASE}/admin/assets`);
const heroCard = p.locator(".assetcard", { hasText: "Blog new product bottleneck" });
await heroCard.locator('button:has-text("Copy Markdown")').click();
console.log("clipboard:", await p.evaluate(() => navigator.clipboard.readText()));

// edit name + alt
await heroCard.locator('a:has-text("Edit")').click();
await p.waitForURL(/\/admin\/assets\/\d+$/);
const heroId = p.url().split("/").pop();
await p.fill('input[name="name"]', "Product bottleneck hero");
await p.fill('textarea[name="alt"]', "Signals flowing into a single bottleneck");
await p.click('form:has(input[name="name"]) button[type="submit"]');
await p.waitForURL(/ok=saved/);
await p.screenshot({ path: `${OUT}/assets-edit.png`, fullPage: true });

// mixing kinds on replace is refused
await p.setInputFiles('input[name="file"]', "content/documents/customer-signals-agent-product-brief.pdf");
await p.click('form:has(input[name="name"]) button[type="submit"]');
await p.waitForURL(/error=kind/);
console.log("replace image with pdf refused: ok");

// use in a new blog post via the pickers
await p.goto(`${BASE}/admin/resources/new?type=blog`);
await p.fill('input[name="title"]', "Asset library test post");
await p.selectOption('select[name="status"]', "published");
await p.click('summary:has-text("Choose from the library")');
await p.click('.atile[title="Use as hero image: Product bottleneck hero"]');
console.log("hero value:", await p.inputValue('input[name="heroImage"]'));
await p.fill('textarea[name="body"]', "## Intro\n\nSome text.");
await p.click('summary:has-text("Insert an image or file")');
await p.click('.atile[title="Insert: Kit corry"]');
await p.click('summary:has-text("Insert an image or file")');
await p.click('.atile[title="Insert: Customer signals agent product brief"]');
const body = await p.inputValue('textarea[name="body"]');
console.log("body:", JSON.stringify(body));
await p.screenshot({ path: `${OUT}/assets-editor.png`, fullPage: true });
await p.click('form.panel button:has-text("Save")');
await p.waitForURL(/ok=saved/);

// public page shows both images and the pdf link
await p.goto(`${BASE}/resources/asset-library-test-post`);
const imgs = await p.evaluate(() => [...document.images].filter((i) => i.src.includes("/media/")).map((i) => [i.getAttribute("src"), i.naturalWidth, i.alt]));
console.log("page images:", imgs);
assert.ok(imgs.length >= 2 && imgs.every((i) => i[1] > 0));
const pdf = await p.locator('a[href*="/media/"]').first().getAttribute("href");
const res = await p.request.get(BASE + pdf);
console.log("pdf:", res.status(), res.headers()["content-type"], res.headers()["content-disposition"], (await res.body()).equals(readFileSync("content/documents/customer-signals-agent-product-brief.pdf")));

// served to signed-out visitors too
const anon = await (await b.newContext()).newPage();
const r2 = await anon.request.get(`${BASE}/media/${heroId}/x.jpg`);
console.log("anon image:", r2.status(), r2.headers()["content-type"]);

// usage shows on the asset page, and delete warns
await p.goto(`${BASE}/admin/assets/${heroId}`);
console.log("usage:", (await p.locator(".ause").innerText()).replace(/\s+/g, " "));
await p.click('summary:has-text("Delete asset")');
console.log("delete warning:", (await p.locator(".adel-body p").innerText()).trim());
await p.screenshot({ path: `${OUT}/assets-delete.png`, fullPage: true });
await p.click('button:has-text("Delete permanently")');
await p.waitForURL(/ok=deleted/);
console.log("after delete:", await p.locator(".assetcard").count(), "cards; image 404:", (await anon.request.get(`${BASE}/media/${heroId}/x.jpg`)).status());

// phone width
await p.setViewportSize({ width: 390, height: 844 });
await p.goto(`${BASE}/admin/assets`);
console.log("phone scroll width:", await p.evaluate(() => document.documentElement.scrollWidth));
await b.close();
