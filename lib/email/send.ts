import { renderTemplate, type TemplateMap, type TemplateName } from "./templates";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

// Non-blocking, never throws — email failures must not break the user flow.
export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from =
    opts.from ?? process.env.RESEND_FROM ?? "STUDIO BODA <hello@studioboda.kr>";

  if (!key) {
    console.log(
      "[email] RESEND_API_KEY missing — skipping send.",
      JSON.stringify({ to: opts.to, subject: opts.subject }),
    );
    return { ok: false, error: "RESEND_API_KEY missing" };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(opts.to) ? opts.to : [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[email] Resend error", res.status, text.slice(0, 200));
      return { ok: false, error: `Resend ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] send error", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "send error",
    };
  }
}

export async function sendTemplate<T extends TemplateName>(
  to: string,
  template: T,
  data: TemplateMap[T],
): Promise<{ ok: boolean; error?: string }> {
  if (!to) return { ok: false, error: "no recipient" };
  const rendered = renderTemplate(template, data);
  return sendEmail({ to, subject: rendered.subject, html: rendered.html });
}
