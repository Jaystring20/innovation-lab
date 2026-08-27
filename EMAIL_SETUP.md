# Turning on order emails

Two Supabase Edge Functions are deployed and working, but they will refuse to
send until `RESEND_API_KEY` is set. Until then a registration still succeeds and
the reference still shows on screen — only the email is skipped.

| Function | What it does |
|---|---|
| `send-order-confirmation` | Emails the reference + payment instructions right after registration |
| `recover-order-references` | Emails a school its references when it has lost them |

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
| `ORDER_EMAIL_FROM` | Recommended | e.g. `APEN 2026 <noreply@yourdomain.ng>`. Defaults to Resend's test sender, which only reaches your own address |
| `SITE_URL` | Recommended | e.g. `https://apen2026.ng` — makes the "Track your order" button appear |
| `BANK_NAME` | **Yes, before launch** | Shown in the payment instructions |
| `BANK_ACCOUNT_NAME` | **Yes, before launch** | |
| `BANK_ACCOUNT_NUMBER` | **Yes, before launch** | |

> The bank details are set **twice** — here for the emails, and in the site's
> own `.env` (`VITE_BANK_*`) for the order page. Both must match. They are
> public either way, so only use an account you're willing to publish.

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
