import type { Product } from "@/db/schema";

/** Product-specific copy for an article's call to action and sidebar promo. */
export type Promo = {
  eyebrow: string;
  name: string;
  blurb: string;
  ctaText: string;
  ctaLabel: string;
  href: string;
  demoHref: string;
};

export const DEMO_INTEREST: Record<string, string> = {
  "customer-signals": "Customer Signals",
  "customer-signals-agent": "Customer Signals",
  "product-model": "Product Model",
  "release-intelligence": "Release Intelligence",
};

/** Demo form link with the matching interest ticked. */
export function demoHref(slug: string | null | undefined) {
  const interest = slug ? DEMO_INTEREST[slug] : undefined;
  return interest ? `/demo?interest=${encodeURIComponent(interest)}` : "/demo";
}

export function productPromo(p: Product | null | undefined): Promo {
  if (!p || !p.active) {
    return {
      eyebrow: "Built for ServiceNow",
      name: "Product Builder Experience",
      blurb: "Customer Signals, Product Model, and Release Intelligence: one connected workflow from customer conversation to release.",
      ctaText: "See how Product Builder Experience takes customer evidence from the first conversation to the release that answers it.",
      ctaLabel: "Explore the products",
      href: "/products",
      demoHref: "/demo",
    };
  }
  const store = p.kind === "store_app";
  const interest = DEMO_INTEREST[p.slug];
  return {
    eyebrow: store ? "Live on the ServiceNow Store" : `Product Builder Experience${p.plan ? ` · ${p.plan} plan` : ""}`,
    name: p.name,
    blurb: p.tagline ?? p.description ?? "",
    ctaText: p.description ?? p.tagline ?? "",
    ctaLabel: `Explore ${p.name}`,
    href: p.page ? (store ? `/agents/${p.slug}` : `/products/${p.slug}`) : "/products",
    demoHref: interest ? `/demo?interest=${encodeURIComponent(interest)}` : "/demo",
  };
}
