import { notFound, redirect } from "next/navigation";
import { docsCatalog } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function VersionDocs({ params }: { params: Promise<{ product: string; version: string }> }) {
  const { product, version } = await params;
  const entry = (await docsCatalog()).find((c) => c.product.slug === product);
  const first = entry?.pages.filter((p) => p.version === version).sort((a, b) => a.sortOrder - b.sortOrder)[0];
  if (!first) notFound();
  redirect(`/docs/${product}/${version}/${first.slug}`);
}
