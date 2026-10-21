import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { headers } from "next/headers";

/**
 * Outgoing email over SMTP. Works with Google Workspace, Resend, Postmark, SendGrid and most
 * other providers. Configure with SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASS and
 * EMAIL_FROM (for example "IC5 Labs <hello@ic5labs.com>"). When SMTP_HOST is not set, nothing is
 * sent and the caller is told so; sending never throws, so a mail problem can't block the action.
 */
export type MailResult = "sent" | "off" | "failed";

let transport: Transporter | null = null;
function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  if (!transport) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transport;
}

export async function sendEmail(msg: { to: string; subject: string; html: string; text: string; replyTo?: string }): Promise<MailResult> {
  const t = getTransport();
  if (!t) {
    console.info(`[email] not configured, skipped "${msg.subject}" to ${msg.to}`);
    return "off";
  }
  try {
    await t.sendMail({ from: process.env.EMAIL_FROM || process.env.SMTP_USER, ...msg });
    return "sent";
  } catch (e) {
    console.error(`[email] failed "${msg.subject}" to ${msg.to}:`, e);
    return "failed";
  }
}

/** The public address of the site, for links and images in emails. */
export async function siteOrigin() {
  const fixed = process.env.SITE_URL || process.env.AUTH_URL;
  if (fixed) return fixed.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}
