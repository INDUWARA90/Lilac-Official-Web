import "server-only";
import { serverEnv } from "@/lib/env";

/**
 * Resend — used ONLY for winner-confirmation emails and admin alerts, kept
 * separate from Brevo (verification email) so verification volume can never
 * exhaust the winner-email quota. https://resend.com/docs/api-reference/emails
 */
const RESEND_URL = "https://api.resend.com/emails";

export interface SendResult {
  ok: boolean;
  id?: string;
  reason?: string;
}

async function send(to: string, subject: string, html: string, text: string): Promise<SendResult> {
  const { apiKey, senderEmail, senderName } = serverEnv.resend;

  if (!apiKey || !senderEmail) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[dev] Resend not configured — would email "${subject}" to a recipient`);
      return { ok: true, reason: "dev-no-provider" };
    }
    return { ok: false, reason: "resend-not-configured" };
  }

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: `${senderName} <${senderEmail}>`,
        to: [to],
        subject,
        html,
        text,
      }),
    });
    if (!res.ok) {
      console.error(`Resend send failed: HTTP ${res.status}`);
      return { ok: false, reason: `http-${res.status}` };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id };
  } catch {
    console.error("Resend send failed: request error");
    return { ok: false, reason: "request-error" };
  }
}

export function sendWinnerEmail(args: {
  to: string;
  name: string;
  ticketCode: string;
}): Promise<SendResult> {
  const first = args.name.split(" ")[0] || "there";
  const text =
    `Dear ${first},\n\n` +
    `We are pleased to inform you that your entry (ticket ${args.ticketCode}) has ` +
    `been selected as a winner in the Lilac draw.\n\n` +
    `A member of the Lilac team will be in touch shortly with details. Your full ` +
    `name and ticket code now appear on the public results page, as disclosed at ` +
    `the time of entry.\n\nRegards,\nThe Lilac Team`;

  const html = `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#211b26;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;padding:32px 24px;">
<tr><td style="font-size:20px;font-weight:bold;color:#45329f;padding-bottom:24px;">Lilac</td></tr>
<tr><td style="font-size:16px;line-height:1.6;padding-bottom:16px;">Dear ${escapeHtml(first)},</td></tr>
<tr><td style="font-size:16px;line-height:1.6;padding-bottom:16px;">We are pleased to inform you that your entry
(ticket <strong>${escapeHtml(args.ticketCode)}</strong>) has been selected as a winner in the Lilac draw.</td></tr>
<tr><td style="font-size:16px;line-height:1.6;padding-bottom:16px;">A member of the Lilac team will be in touch shortly.
Your full name and ticket code now appear on the public results page, as disclosed at the time of entry.</td></tr>
<tr><td style="font-size:14px;line-height:1.6;padding-top:8px;">Regards,<br>The Lilac Team</td></tr>
</table></body></html>`;

  return send(args.to, "You have won the Lilac draw", html, text);
}

export function sendAdminAlert(subject: string, text: string): Promise<SendResult> {
  if (!serverEnv.adminNotifyEmail) return Promise.resolve({ ok: false, reason: "no-admin-email" });
  return send(
    serverEnv.adminNotifyEmail,
    `[Lilac admin] ${subject}`,
    `<pre style="font-family:Arial,Helvetica,sans-serif;font-size:14px;white-space:pre-wrap;">${escapeHtml(text)}</pre>`,
    text,
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
