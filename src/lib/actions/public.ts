"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { getCurrentUser } from "@/lib/users";

const email = z.string().trim().toLowerCase().email().max(200);

export async function subscribeNewsletter(formData: FormData) {
  const back = String(formData.get("back") ?? "/resources");
  const parsed = email.safeParse(formData.get("email"));
  if (!parsed.success) redirect(`${back}?newsletter=invalid#newsletter`);
  const user = await getCurrentUser();
  await db.insert(s.requests).values({ type: "newsletter", email: parsed.data, userId: user?.id, accountId: user?.accountId });
  redirect(`${back}?newsletter=ok#newsletter`);
}

const demoSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email,
  company: z.string().trim().min(1).max(200),
  role: z.string().trim().max(100).optional(),
  release: z.string().trim().max(50).optional(),
  teamSize: z.string().trim().max(50).optional(),
  message: z.string().trim().max(4000).optional(),
});

export async function requestDemo(formData: FormData) {
  const parsed = demoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/demo?error=1#form");
  const d = parsed.data;
  const interests = formData.getAll("interests").map(String).slice(0, 10);
  const user = await getCurrentUser();
  await db.insert(s.requests).values({
    type: "demo", name: `${d.firstName} ${d.lastName}`, email: d.email, company: d.company, role: d.role,
    message: d.message, details: { release: d.release, teamSize: d.teamSize, interests, plan: formData.get("plan") || undefined },
    userId: user?.id, accountId: user?.accountId,
  });
  redirect("/demo?sent=1#form");
}
