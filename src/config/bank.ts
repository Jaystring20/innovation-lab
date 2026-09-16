/**
 * Bank transfer details shown to schools on the order-status page.
 *
 * These are public, static, and display-only — every visitor is meant to see
 * them in order to pay. They are a plain constant rather than an env var:
 * Vite inlines VITE_* into the client bundle anyway, so an env var would give
 * no privacy, and changing either one still needs a rebuild.
 *
 * The payment-instruction EMAILS are separate — the send-order-confirmation
 * and lab-notifications Edge Functions read BANK_NAME / BANK_ACCOUNT_NAME /
 * BANK_ACCOUNT_NUMBER from Supabase Edge Function secrets (server-side). Keep
 * these two in sync with those.
 */
export const BANK_DETAILS = {
  name: 'Sterling Bank',
  accountName: 'Imperial Educational Services Ltd',
  accountNumber: '0087287663',
};
