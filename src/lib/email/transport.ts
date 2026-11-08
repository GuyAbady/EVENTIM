import "server-only";
import nodemailer from "nodemailer";

// Gmail SMTP with an App Password. Swap this file to move to another provider.
export function hasEmailEnv() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export function createTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  if (!user || !pass) {
    // Local development without credentials: print the message instead of sending.
    if (process.env.NODE_ENV !== "production" || process.env.EMAIL_DRY_RUN === "1") {
      return nodemailer.createTransport({ jsonTransport: true });
    }
    throw new Error("email_not_configured");
  }
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

export function fromAddress() {
  const name = process.env.EMAIL_FROM_NAME?.trim();
  const user = process.env.GMAIL_USER ?? "noreply@example.com";
  return name ? `"${name.replace(/"/g, "")}" <${user}>` : user;
}
