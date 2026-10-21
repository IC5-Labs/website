import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { headers } from "next/headers";

/**
 * Outgoing email. With RESEND_API_KEY set, mail goes through Resend's SMTP service. Any other
 * SMTP provider works with SMTP_HOST, SMTP_PORT (default 587), SMTP_USER and SMTP_PASS.
 * EMAIL_FROM overrides the sender (default "IC5 Labs <support@ic5labs.com>"). With neither set,
 * nothing is sent and the caller is told so; sending never throws, so a mail problem can't block
 * the action.
 */
export type MailResult = "sent" | "off" | "failed";

let transport: Transporter | null = null;
function getTransport() {
  const resend = process.env.RESEND_API_KEY;
  if (!resend && !process.env.SMTP_HOST) return null;
  if (!transport) {
    transport = resend
      ? nodemailer.createTransport({ host: "smtp.resend.com", port: 465, secure: true, auth: { user: "resend", pass: resend } })
      : nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Number(process.env.SMTP_PORT) === 465,
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
    await t.sendMail({ from: process.env.EMAIL_FROM || "IC5 Labs <support@ic5labs.com>", ...msg });
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
