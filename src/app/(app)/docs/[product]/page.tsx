import { notFound, redirect } from "next/navigation";
import { docsCatalog } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function ProductDocs({ params }: { params: Promise<{ product: string }> }) {
  const { product } = await params;
  const entry = (await docsCatalog()).find((c) => c.product.slug === product);
  if (!entry || !entry.versions.length) notFound();
  redirect(`/docs/${product}/${entry.versions[0].version}`);
}
