import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

interface Attachment {
  filename: string;
  content: Buffer;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  attachments?: Attachment[]
) {
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const resend = getResend();
  const payload: Parameters<typeof resend.emails.send>[0] = {
    from,
    to,
    subject,
    html,
  };

  if (attachments && attachments.length > 0) {
    payload.attachments = attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
    }));
  }

  const { data, error } = await resend.emails.send(payload);

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  return data;
}
