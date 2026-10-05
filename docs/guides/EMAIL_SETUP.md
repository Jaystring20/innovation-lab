# Turning on order emails

The Supabase Edge Functions are deployed but refuse to send until
`RESEND_API_KEY` is set. Until then a registration still succeeds and the
reference still shows on screen — only the email is skipped.

| Function | What it does |
|---|---|
| `send-order-confirmation` | Emails the reference + payment instructions right after registration |
| `send-payment-receipt` | Emails an official receipt when an organizer confirms payment (auto-fires on "Confirm payment") |
| `recover-order-references` | Emails a school its references when it has lost them |
| `lab-notifications` | The Lab's daily mailer (stage opens, deadline reminders, feedback, gate results) — see `LAB_SETUP.md` |

## 1. Get a Resend API key

Sign up at [resend.com](https://resend.com), then **API Keys → Create**.

For real sending you also need a verified domain (**Domains → Add Domain**, then
add the DNS records it gives you). Until a domain is verified, Resend only
delivers to the address that owns the account — fine for testing, not for
schools.

## 2. Set the secrets

Supabase dashboard → **Edge Functions → Secrets**, or via CLI:

```bash
supabase secrets set --project-ref sctsrxuquhzdjjnlsqbm RESEND_API_KEY=re_xxxxxxxx
```

| Secret | Required | Notes |
|---|---|---|
| `RESEND_API_KEY` | **Yes** | Nothing sends without it |
| `ORDER_EMAIL_FROM` | Recommended | e.g. `APEN 2026 <apen@digitalcreativeshubltd.com>`. Defaults to that address; must be on a Resend-verified domain |
| `ORDER_EMAIL_REPLY_TO` | Optional | A monitored mailbox for replies. Defaults to the `ORDER_EMAIL_FROM` address |
| `SITE_URL` | Recommended | e.g. `https://apen.digitalcreativeshubltd.com` — makes the "Track your order" / "Open the Lab" buttons appear |
| `CRON_SECRET` | **Yes, for the Lab mailer** | Shared secret for the `lab-notifications` cron — see `LAB_SETUP.md` |
| `BANK_NAME` | **Yes, before launch** | Shown in the payment instructions |
| `BANK_ACCOUNT_NAME` | **Yes, before launch** | |
| `BANK_ACCOUNT_NUMBER` | **Yes, before launch** | |

The **WhatsApp confirmation number** and the **dispatch-timing wording** are not
secrets — they live in `store_settings` (row `id = 1`) and an organizer can
change them with SQL:

```sql
update public.store_settings set
  whatsapp_number       = '2348038838094',
  dispatch_note_lagos   = '3–5 working days after payment is confirmed',
  dispatch_note_outside = '5–7 working days after payment is confirmed'
where id = 1;
```

> The email bank details (`BANK_*` Edge Function secrets, above) and the ones
> shown on the order page (`src/config/bank.ts`, a plain constant) are separate
> — keep them in sync. Both are public, so only use an account you're willing
> to publish.

## 3. Check it works

Register a test school using an address you control. You should get the
confirmation within a few seconds. If not, check
**Edge Functions → send-order-confirmation → Logs**.

## Deploying changes

Function source lives in `supabase/functions/`. Redeploy with:

```bash
supabase functions deploy send-order-confirmation --project-ref sctsrxuquhzdjjnlsqbm
```

Both are deployed with `verify_jwt = false` because schools register without an
account. That is safe here: recipients are always read from the database, never
taken from the request, so neither endpoint can be pointed at an arbitrary
address. The confirmation endpoint additionally refuses to resend within 60
seconds, and the recovery endpoint returns an identical response whether or not
an address has orders, so it cannot be used to discover which schools have
registered.
