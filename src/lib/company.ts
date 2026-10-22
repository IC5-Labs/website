import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { imageSize } from "image-size";
import { db, schema as s } from "@/db";

export const INDUSTRIES = [
  "Technology", "Financial services", "Insurance", "Healthcare and life sciences", "Government and public sector",
  "Education", "Manufacturing", "Retail and consumer", "Telecommunications and media", "Energy and utilities",
  "Transportation and logistics", "Professional services", "Nonprofit", "Other",
];
export const COMPANY_SIZES = ["1–50", "51–200", "201–1,000", "1,001–5,000", "5,001–10,000", "10,000+"];
export const LOGO_MAX_BYTES = 1024 * 1024;
const LOGO_TYPES: Record<string, string> = { png: "image/png", jpeg: "image/jpeg", jpg: "image/jpeg", webp: "image/webp" };

export const COMPANY_ERRORS: Record<string, string> = {
  name: "Enter a company name of 2 to 120 characters.",
  website: "Enter a website like https://example.com.",
  email: "Enter a valid billing contact email, or leave it empty.",
  phone: "Enter a phone number using digits, spaces, and + ( ) - only.",
  logosize: "Logos can be up to 1 MB.",
  logotype: "Upload the logo as a PNG, JPG, or WebP image.",
};

/** Logo URL with a version, so a new upload shows right away instead of a cached copy. */
export const logoHref = (a: { id: number; logoUpdatedAt: Date | null }) =>
  a.logoUpdatedAt ? `/logos/${a.id}?v=${new Date(a.logoUpdatedAt).getTime()}` : null;

const opt = (v: FormDataEntryValue | null, max: number) => {
  const t = String(v ?? "").trim().slice(0, max);
  return t || null;
};

function normalizeWebsite(v: string | null) {
  if (!v) return { ok: true as const, value: null };
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".")) return { ok: false as const };
    return { ok: true as const, value: u.toString().replace(/\/$/, "") };
  } catch { return { ok: false as const }; }
}

/** Save the company details form for an account. Returns an error code, or null when saved. */
export async function saveCompanyDetails(accountId: number, f: FormData): Promise<string | null> {
  const name = z.string().trim().min(2).max(120).safeParse(f.get("name"));
  if (!name.success) return "name";
  const website = normalizeWebsite(opt(f.get("website"), 300));
  if (!website.ok) return "website";
  const billingEmail = opt(f.get("billingEmail"), 200)?.toLowerCase() ?? null;
  if (billingEmail && !z.string().email().safeParse(billingEmail).success) return "email";
  const phone = opt(f.get("phone"), 40);
  if (phone && !/^[0-9+()\-.\s]{5,40}$/.test(phone)) return "phone";
  const industry = opt(f.get("industry"), 80);
  const companySize = opt(f.get("companySize"), 40);

  const upload = f.get("logo");
  const file = upload instanceof File && upload.size > 0 ? upload : null;
  let logo: { contentType: string; data: Buffer } | null = null;
  if (file) {
    if (file.size > LOGO_MAX_BYTES) return "logosize";
    const data = Buffer.from(await file.arrayBuffer());
    let type: string | undefined;
    try { type = imageSize(data).type; } catch { return "logotype"; }
    const contentType = type ? LOGO_TYPES[type] : undefined;
    if (!contentType) return "logotype";
    logo = { contentType, data };
  }
  const removeLogo = !logo && f.get("removeLogo") === "on";
  const now = new Date();
  await db.update(s.accounts).set({
    name: name.data, website: website.value, billingEmail, phone,
    industry: industry && INDUSTRIES.includes(industry) ? industry : null,
    companySize: companySize && COMPANY_SIZES.includes(companySize) ? companySize : null,
    location: opt(f.get("location"), 120),
    updatedAt: now,
    ...(logo ? { logoUpdatedAt: now } : removeLogo ? { logoUpdatedAt: null } : {}),
  }).where(eq(s.accounts.id, accountId));
  if (logo) {
    await db.insert(s.accountLogos).values({ accountId, ...logo, updatedAt: now })
      .onConflictDoUpdate({ target: s.accountLogos.accountId, set: { ...logo, updatedAt: now } });
  } else if (removeLogo) {
    await db.delete(s.accountLogos).where(eq(s.accountLogos.accountId, accountId));
  }
  return null;
}
