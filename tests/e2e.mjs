/**
 * End-to-end test of accounts, roles, cases, admin, and public forms.
 * Requires a running server with ENABLE_DEV_LOGIN=true and a fresh database.
 *   BASE_URL=http://localhost:5000 node tests/e2e.mjs
 */
import { chromium } from "playwright";
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL ?? "http://localhost:5000";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const results = [];
const step = async (name, fn) => {
  try { await fn(); results.push(["PASS", name]); console.log("PASS", name); }
  catch (e) { results.push(["FAIL", name]); console.log("FAIL", name, "\n   ", e.message.split("\n")[0]); }
};

async function session(email) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/signin`);
  await page.fill('input[name="email"]', email);
  await page.click('form:has(input[value="dev"]) button[type="submit"]');
  await page.waitForLoadState("networkidle");
  return page;
}
const text = (p) => p.locator("body").innerText();

// ---------- public ----------
const anon = await (await browser.newContext()).newPage();
await step("anonymous visitor is sent to sign in from /account", async () => {
  await anon.goto(`${BASE}/account`);
  assert.match(anon.url(), /\/signin\?callbackUrl=%2Faccount/);
});
await step("anonymous visitor is sent to sign in from /admin", async () => {
  await anon.goto(`${BASE}/admin/users`);
  assert.match(anon.url(), /\/signin/);
});
await step("anonymous visitor can read docs, blog, and resources", async () => {
  await anon.goto(`${BASE}/docs/customer-signals-agent/1.1/installation`);
  assert.match(await text(anon), /Configuration Instructions/);
  await anon.goto(`${BASE}/resources/new-product-bottleneck`);
  assert.match(await text(anon), /The ratio nobody planned for/);
  await anon.goto(`${BASE}/resources`);
  assert.match(await text(anon), /State of Product 2027/);
});
await step("anonymous visitor can subscribe to the newsletter", async () => {
  await anon.goto(`${BASE}/resources`);
  await anon.fill('#newsletter input[name="email"]', "reader@example.com");
  await anon.click('#newsletter button[type="submit"]');
  await anon.waitForURL(/newsletter=ok/);
});
await step("anonymous visitor can request a demo", async () => {
  await anon.goto(`${BASE}/demo`);
  await anon.fill('input[name="firstName"]', "Jordan");
  await anon.fill('input[name="lastName"]', "Lee");
  await anon.fill('input[name="email"]', "jordan@prospect.com");
  await anon.fill('input[name="company"]', "Prospect Co");
  await anon.click('form#form button[type="submit"]');
  await anon.waitForURL(/sent=1/);
  assert.match(await text(anon), /your request is in/);
});

// ---------- first user creates the company account ----------
const priya = await session("priya@northwind.com");
await step("first user from a company is asked to create the company account", async () => {
  await priya.goto(`${BASE}/account`);
  assert.match(priya.url(), /\/onboarding/);
  assert.match(await text(priya), /Create your company account/);
});
await step("first user creates the account and becomes account admin", async () => {
  await priya.fill('main input[name="name"]', "Northwind Insurance");
  await priya.click('button:has-text("Create company account")');
  await priya.waitForURL(/\/account\?welcome=1/);
  await priya.goto(`${BASE}/account/team`);
  assert.match(await text(priya), /Account admin/);
  assert.match(await text(priya), /Invite a teammate/);
});

let inviteUrl = "";
await step("account admin invites a teammate by email", async () => {
  await priya.fill('main input[name="email"]', "dan@northwind.com");
  await priya.click('button:has-text("Send invite")');
  await priya.waitForURL(/invited=/);
  inviteUrl = (await priya.locator(".copybox").first().innerText()).trim();
  assert.match(inviteUrl, /\/invite\//);
});

const lee = await session("lee@northwind.com");
await step("an uninvited coworker can't create a duplicate company or see its data", async () => {
  await lee.goto(`${BASE}/account`);
  assert.match(lee.url(), /\/onboarding/);
  assert.match(await text(lee), /Ask for an invite/);
  await lee.goto(`${BASE}/account/cases`);
  assert.match(lee.url(), /\/onboarding/);
});

const dan = await session("dan@northwind.com");
await step("invited user joins the account automatically when registering", async () => {
  await dan.goto(`${BASE}/account`);
  assert.match(dan.url(), /\/account$/);
  assert.match(await text(dan), /Northwind Insurance/);
});
await step("invite link page also works for the invited user", async () => {
  await dan.goto(inviteUrl.replace(/^https?:\/\/[^/]+/, BASE));
  assert.match(await text(dan), /You’re on the team/);
});
await step("members can't invite or change roles", async () => {
  await dan.goto(`${BASE}/account/team`);
  assert.doesNotMatch(await text(dan), /Invite a teammate/);
  assert.match(await text(dan), /Only account admins/);
});
await step("account admin can make another user an account admin", async () => {
  await priya.goto(`${BASE}/account/team`);
  await priya.locator("tr", { hasText: "dan@northwind.com" }).locator('button:has-text("Make account admin")').click();
  await priya.waitForURL(/ok=role/);
  await dan.goto(`${BASE}/account/team`);
  assert.match(await text(dan), /Invite a teammate/);
});
await step("the last account admin can't be demoted", async () => {
  await dan.goto(`${BASE}/account/team`);
  await dan.locator("tr", { hasText: "priya@northwind.com" }).locator('button:has-text("Make member")').click();
  await dan.waitForURL(/ok=role/);
  await dan.locator("tr", { hasText: "dan@northwind.com" }).locator('button:has-text("Make member")').click();
  await dan.waitForURL(/error=lastadmin/);
  // restore Priya
  await dan.goto(`${BASE}/account/team`);
  await dan.locator("tr", { hasText: "priya@northwind.com" }).locator('button:has-text("Make account admin")').click();
  await dan.waitForURL(/ok=role/);
});

let caseUrl = "";
await step("account user creates a support case", async () => {
  await dan.goto(`${BASE}/account/cases/new`);
  await dan.check('input[name="severity"][value="2"]');
  await dan.fill('input[name="subject"]', "Analyze fails on transcripts longer than 60 minutes");
  await dan.fill('textarea[name="description"]', "The conversation stays in Analyzing for transcripts over an hour. Shorter calls work.");
  await dan.click('form button[type="submit"]:has-text("Submit case")');
  await dan.waitForURL(/\/account\/cases\/CS\d+\?created=1/);
  caseUrl = dan.url().split("?")[0];
  assert.match(await text(dan), /Sev 2/);
});
await step("teammates in the same account see and reply to the case", async () => {
  await priya.goto(`${BASE}/account/cases`);
  assert.match(await text(priya), /Analyze fails on transcripts/);
  await priya.goto(caseUrl);
  await priya.fill('textarea[name="body"]', "Adding: this happens on our production instance only.");
  await priya.click('button:has-text("Send reply")');
  await priya.waitForURL(/ok=reply/);
  assert.match(await text(priya), /production instance only/);
});

const eve = await session("eve@contoso.com");
await step("a user from another company can't see the case", async () => {
  await eve.goto(`${BASE}/onboarding`);
  await eve.fill('main input[name="name"]', "Contoso");
  await eve.click('button:has-text("Create company account")');
  await eve.waitForURL(/\/account/);
  const res = await eve.goto(caseUrl);
  assert.equal(res.status(), 404);
  await eve.goto(`${BASE}/account/cases?filter=all`);
  assert.doesNotMatch(await text(eve), /Analyze fails on transcripts/);
});
await step("non-admins can't open the admin console", async () => {
  await priya.goto(`${BASE}/admin`);
  assert.match(priya.url(), /\/account$/);
});

// ---------- platform admin ----------
const kit = await session("kit@ic5labs.com");
await step("kit@ic5labs.com has the admin role and sees all cases", async () => {
  await kit.goto(`${BASE}/admin/cases`);
  assert.match(kit.url(), /\/admin\/cases/);
  assert.match(await text(kit), /Northwind Insurance/);
});
await step("admin replies and sets the case to awaiting customer", async () => {
  await kit.goto(caseUrl.replace("/account/cases/", "/admin/cases/"));
  await kit.fill('textarea[name="body"]', "Confirmed. Split the transcript into two parts as a workaround; a fix is planned for v1.1.");
  await kit.selectOption('form#reply select[name="status"]', "awaiting_customer");
  await kit.click('button:has-text("Send reply")');
  await kit.waitForURL(/ok=reply/);
  await priya.goto(`${BASE}/account`);
  assert.match(await text(priya), /awaiting your reply/i);
});
await step("internal notes stay hidden from customers", async () => {
  await kit.goto(caseUrl.replace("/account/cases/", "/admin/cases/"));
  await kit.fill('textarea[name="body"]', "Internal: reproduce on Bedrock us-east-1.");
  await kit.check('input[name="internal"]');
  await kit.click('button:has-text("Send reply")');
  await kit.waitForURL(/ok=reply/);
  await priya.goto(caseUrl);
  assert.doesNotMatch(await text(priya), /reproduce on Bedrock/);
});
await step("admin adds a license and the customer sees it", async () => {
  await kit.goto(`${BASE}/admin/accounts`);
  await kit.click('a:has-text("Northwind Insurance")');
  const add = kit.locator(".lic", { hasText: "Add a license" });
  await add.locator('select[name="productId"]').selectOption({ label: "Customer Signals" });
  await add.locator('input[name="plan"]').fill("Team");
  await add.locator('input[name="seats"]').fill("9");
  await add.locator('input[name="instance"]').fill("northwind.service-now.com");
  await add.locator('button:has-text("Add license")').click();
  await kit.waitForURL(/ok=license/);
  await dan.goto(`${BASE}/account/licenses`);
  assert.match(await text(dan), /Customer Signals/);
  assert.match(await text(dan), /9 users/);
});
await step("customer requests a license change, admin sees it", async () => {
  await dan.goto(`${BASE}/account/requests`);
  await dan.fill('textarea[name="message"]', "We'd like to upgrade to Pro next quarter.");
  await dan.click('button:has-text("Send request")');
  await dan.waitForURL(/ok=sent/);
  await kit.goto(`${BASE}/admin/requests`);
  assert.match(await text(kit), /upgrade to Pro/);
  assert.match(await text(kit), /jordan@prospect.com/);
  assert.match(await text(kit), /reader@example.com/);
});
await step("admin publishes a blog post and visitors can read it", async () => {
  await kit.goto(`${BASE}/admin/resources/new?type=blog`);
  await kit.fill('input[name="title"]', "Every Team Can Build Now. Most Are Building the Wrong Thing, Faster.");
  await kit.selectOption('select[name="status"]', "published");
  await kit.fill('textarea[name="summary"]', "Speed without evidence just means shipping guesses at a higher velocity.");
  await kit.fill('textarea[name="body"]', "## Speed is not the goal\n\nShipping faster only helps if you ship the right thing.");
  await kit.click('button:has-text("Save")');
  await kit.waitForURL(/ok=saved/);
  await anon.goto(`${BASE}/resources`);
  assert.match(await text(anon), /Most Are Building the Wrong Thing/);
});
await step("admin creates a document resource", async () => {
  await kit.goto(`${BASE}/admin/resources/new?type=document`);
  await kit.fill('input[name="title"]', "Security overview");
  await kit.selectOption('select[name="status"]', "published");
  await kit.fill('textarea[name="body"]', "## Data handling\n\nCustomer Signals Agent runs in your instance.");
  await kit.click('button:has-text("Save")');
  await kit.waitForURL(/ok=saved/);
  await anon.goto(`${BASE}/resources/security-overview`);
  assert.match(await text(anon), /Data handling/);
});
await step("admin starts docs v1.2 and makes it latest; v1.1 shows the older-version banner", async () => {
  await kit.goto(`${BASE}/admin/docs`);
  const v11 = kit.locator(".lic", { hasText: "v1.1" }).first();
  await v11.locator('input[name="to"]').fill("1.2");
  await v11.locator('button:has-text("Copy to new version")').click();
  await kit.waitForURL(/ok=copied/);
  const anonRes = await anon.goto(`${BASE}/docs/customer-signals-agent/1.2/installation`);
  assert.equal(anonRes.status(), 404, "draft version must be hidden from visitors");
  const v12 = kit.locator(".lic", { hasText: "v1.2" }).first();
  await v12.locator('select[name="versionStatus"]').selectOption("latest");
  await v12.locator('button:has-text("Set")').click();
  await kit.waitForURL(/ok=status/);
  await anon.goto(`${BASE}/docs/customer-signals-agent`);
  assert.match(anon.url(), /\/1\.2\/installation$/);
  await anon.goto(`${BASE}/docs/customer-signals-agent/1.1/installation`);
  assert.match(await text(anon), /The latest version is v1\.2/);
});
await step("admin can change a user's platform role", async () => {
  await kit.goto(`${BASE}/admin/users?q=lee`);
  const row = kit.locator("tr", { hasText: "lee@northwind.com" });
  await row.locator('select[name="accountId"]').selectOption({ label: "Northwind Insurance" });
  await row.locator('button:has-text("Save")').click();
  await kit.waitForURL(/ok=saved/);
  await lee.goto(`${BASE}/account`);
  assert.match(await text(lee), /Northwind Insurance/);
});
await step("docs search finds content within a version", async () => {
  await anon.goto(`${BASE}/docs?q=Bedrock&product=customer-signals-agent&version=1.0`);
  assert.match(await text(anon), /result/);
  assert.match(await text(anon), /v1\.0/);
});
await step("sign out ends the session", async () => {
  await dan.goto(`${BASE}/account/profile`);
  await dan.click('main button:has-text("Sign out")');
  await dan.waitForURL(`${BASE}/`);
  await dan.goto(`${BASE}/account`);
  assert.match(dan.url(), /\/signin/);
});

await browser.close();
const failed = results.filter((r) => r[0] === "FAIL").length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
