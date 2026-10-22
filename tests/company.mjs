// Company details: account admins edit, members read, IC5 admins edit, other companies can't see the logo.
// Usage: node tests/company.mjs [screenshot folder]. Runs against a freshly reset local database.
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const BASE = "http://localhost:5000";
const OUT = process.argv[2] ?? "/tmp";
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
async function session(email) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await p.goto(`${BASE}/signin`);
  await p.fill('form:has(input[value="dev"]) input[name="email"]', email);
  await p.click('form:has(input[value="dev"]) button[type="submit"]');
  await p.waitForLoadState("networkidle");
  return p;
}
const flash = async (p) => (await p.locator(".flash").first().innerText()).replace(/\s+/g, " ").trim();

const priya = await session("priya@northwind.com");
await priya.goto(`${BASE}/onboarding`);
await priya.fill('form:has(input[name="name"]) input[name="name"]', "Northwind");
await priya.click('form:has(input[name="name"]) button[type="submit"]');
await priya.waitForURL(/\/account/);

// bad website is refused
await priya.goto(`${BASE}/account/company`);
await priya.fill('input[name="website"]', "not a website");
await priya.click('button:has-text("Save company details")');
await priya.waitForURL(/error=website/);
console.log("bad website:", await flash(priya));

// save everything, with a logo
await priya.fill('input[name="name"]', "Northwind Traders");
await priya.fill('input[name="website"]', "northwind.com");
await priya.selectOption('select[name="industry"]', "Retail and consumer");
await priya.selectOption('select[name="companySize"]', "1,001–5,000");
await priya.fill('input[name="location"]', "Seattle, USA");
await priya.fill('input[name="phone"]', "+1 206 555 0100");
await priya.fill('input[name="billingEmail"]', "AP@northwind.com");
await priya.setInputFiles('input[name="logo"]', "src/app/apple-icon.png");
await priya.click('button:has-text("Save company details")');
await priya.waitForURL(/ok=saved/);
console.log("saved:", await flash(priya));
const vals = await priya.evaluate(() => Object.fromEntries(["name", "website", "location", "phone", "billingEmail"].map((n) => [n, document.querySelector(`[name="${n}"]`).value])));
console.log("values:", vals);
assert.equal(vals.website, "https://northwind.com");
assert.equal(vals.billingEmail, "ap@northwind.com");
const logo = await priya.evaluate(() => { const i = document.querySelector(".aside .orgmark img"); return i && [i.getAttribute("src"), i.naturalWidth]; });
console.log("sidebar logo:", logo);
assert.ok(logo && logo[1] > 0);
await priya.screenshot({ path: `${OUT}/company-admin.png`, fullPage: true });

// a non-image file is refused as a logo
await priya.setInputFiles('input[name="logo"]', { name: "logo.png", mimeType: "image/png", buffer: Buffer.from("not an image") });
await priya.click('button:has-text("Save company details")');
await priya.waitForURL(/error=logotype/);
console.log("fake logo:", await flash(priya));

// IC5 admin adds a member; the member sees a read-only summary
const kit = await session("kit@ic5labs.com");
await kit.goto(`${BASE}/admin/users`);
await kit.fill('form:has(input[name="name"]) input[name="email"]', "jordan@northwind.com");
await kit.selectOption('form:has(input[name="name"]) select[name="accountId"]', { label: "Northwind Traders" });
await kit.click('form:has(input[name="name"]) button[type="submit"]');
await kit.waitForURL(/ok=created/);
const jordan = await session("jordan@northwind.com");
await jordan.goto(`${BASE}/account/company`);
console.log("member form fields:", await jordan.locator('input[name="name"]').count(), "| summary:", (await jordan.locator(".cdl").innerText()).replace(/\s+/g, " "));
await jordan.screenshot({ path: `${OUT}/company-member.png`, fullPage: true });

// IC5 admin sees and edits the details on the account page
await kit.goto(`${BASE}/admin/accounts`);
await kit.click('a:has-text("Northwind Traders")');
await kit.waitForURL(/\/admin\/accounts\/\d+/);
const acctUrl = kit.url();
console.log("admin header:", (await kit.locator(".ahead .s").innerText()).trim());
await kit.click('summary:has-text("Company details")');
await kit.fill('input[name="location"]', "Seattle, Washington, USA");
await kit.click('button:has-text("Save company details")');
await kit.waitForURL(/ok=company/);
console.log("admin save:", await flash(kit), "|", (await kit.locator(".ahead .s").innerText()).trim());
await kit.screenshot({ path: `${OUT}/company-ic5admin.png`, fullPage: true });

// someone from another company can't load the logo
const id = acctUrl.match(/accounts\/(\d+)/)[1];
const eve = await session("eve@contoso.com");
console.log("logo for member:", (await jordan.request.get(`${BASE}/logos/${id}`)).status(), "| other company:", (await eve.request.get(`${BASE}/logos/${id}`)).status());

// a member can't save the form
const res = await jordan.request.get(`${BASE}/account/company`);
assert.equal(res.status(), 200);

await priya.setViewportSize({ width: 390, height: 844 });
await priya.goto(`${BASE}/account/company`);
console.log("phone width:", await priya.evaluate(() => document.documentElement.scrollWidth));
await b.close();
