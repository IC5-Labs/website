"use server";
import { signIn, signOut } from "@/auth";

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function signInWith(formData: FormData) {
  const provider = String(formData.get("provider") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/account");
  const safe = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/account";
  if (provider === "dev") {
    await signIn("dev", { email: String(formData.get("email") ?? ""), redirectTo: safe });
    return;
  }
  await signIn(provider, { redirectTo: safe });
}
