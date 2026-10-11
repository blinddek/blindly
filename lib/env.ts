// What the live shop needs from its environment, checked by the daily cron and reported to the admin.
// Each entry says what breaks without it — most of these fail silently (CLAUDE.md §9).

const REQUIRED: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: "no database",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "no database",
  SUPABASE_SERVICE_ROLE_KEY: "checkout, the ITN and admin writes fail",
  NEXT_PUBLIC_APP_URL: "PayFast return and notify URLs point at the wrong host",
  PAYFAST_MERCHANT_ID: "checkout cannot build a payment",
  PAYFAST_MERCHANT_KEY: "checkout cannot build a payment",
  PAYFAST_PASSPHRASE: "ITN signatures are checked without a passphrase",
  RESEND_API_KEY: "no email is sent",
  RESEND_FROM: "mail goes out from noreply@example.com",
  ADMIN_EMAIL: "admin copies go to admin@example.com",
  SUPPLIER_EMAIL: "a paid order does not reach the supplier",
  CRON_SECRET: "the daily cron refuses to run",
};

/** Every problem with the production environment, as "NAME: consequence" lines; empty when sound. */
export function envProblems(): string[] {
  const problems = Object.entries(REQUIRED)
    .filter(([name]) => !process.env[name]?.trim())
    .map(([name, why]) => `${name} is not set: ${why}`);
  if (process.env.PAYFAST_SANDBOX === "true") {
    problems.push("PAYFAST_SANDBOX is true: payments go to the sandbox and the ITN source-IP check is off");
  }
  return problems;
}
