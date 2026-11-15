import nodemailer from "nodemailer";

export const smtpReady = () => !!process.env.SMTP_HOST;

/** Kirim email lewat SMTP. Jika SMTP belum diatur (mode pengembangan), isi email dicetak ke terminal server. */
export async function sendMail(to: string, subject: string, text: string, html?: string) {
  if (!process.env.SMTP_HOST) {
    console.log(`\n[EMAIL - SMTP belum diatur]\nKepada : ${to}\nSubjek : ${subject}\n${text}\n`);
    return false;
  }
  const port = Number(process.env.SMTP_PORT) || 587;
  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port, secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await t.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text, html });
  return true;
}
