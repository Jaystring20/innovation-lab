# STEAM Foundry

The **APEN 2026 Innovation Store and Lab** — one app.

- **Store** — schools register, choose a division, order their kit, and submit payment proof.
- **Lab** — runs the innovation challenge end to end: submissions, judging, judge
  comments, feedback, and final score aggregation.
- **Organizer console** — holds both halves, gated by Supabase Auth.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Postgres + RLS, Auth, Storage, Edge Functions)
- React Router

## Local development

Requires Node.js 18+ and npm.

```sh
npm install
npm run dev
```

The dev server runs on `http://localhost:8080`.

Create a `.env` from the variables below (Vite exposes anything prefixed `VITE_`
to the client bundle):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_BANK_NAME=
VITE_BANK_ACCOUNT_NAME=
VITE_BANK_ACCOUNT_NUMBER=
```

## Build

```sh
npm run build      # outputs to dist/
npm run preview     # serve the production build locally
```

## Deploy

The app is a static SPA (`dist/`). Any static host works — point the host at the
`npm run build` command with `dist/` as the publish directory, set the `VITE_*`
env vars in the host dashboard, and make sure unknown routes fall back to
`index.html` (config for Netlify, Cloudflare Pages, and Vercel is included in the
repo).

Supabase (project `sctsrxuquhzdjjnlsqbm`, eu-west-2) is managed separately —
migrations and Edge Functions are deployed with the Supabase CLI / dashboard.
