# Handyman Quotes

Generates itemized remodel quotes for a Northern California handyman/contractor
business: enter a customer, the rooms being worked on and their measurements,
pick materials, upload a "before" photo, and the app computes a phase-by-phase
cost breakdown (demolition, materials, installation, debris disposal),
estimates labor hours, generates an AI "after" photo of the space, and emails
the whole thing to the customer.

## Stack

Next.js (App Router) + TypeScript + Prisma + Tailwind. Server Actions handle
all mutations — no separate API layer. SQLite in dev (zero setup); swap to
Postgres for production (see below).

## Using it on a phone

This is a mobile-responsive, installable web app (a PWA) — not a native
App Store / Play Store app. On a phone, open it in the browser and:

- **iOS (Safari):** Share button → "Add to Home Screen"
- **Android (Chrome):** menu (⋮) → "Install app" (or a banner offers this automatically)

Either way it launches full-screen with its own icon, no browser chrome. The
photo upload button already opens the phone's camera/photo picker natively —
no extra setup needed there. See `public/manifest.json` and `public/sw.js`
if you ever want to add real offline support (the current service worker is
intentionally a no-op beyond satisfying installability — this app is
behind login and shows live, frequently-changing data, so it deliberately
does not cache pages).

## Quick start

```bash
npm install
cp .env.example .env        # already done if you're reading this in the repo
npm run db:push             # create the SQLite dev database from the schema
npm run db:seed             # seed the NorCal price book + an admin login
npm run dev
```

Open http://localhost:3000, sign in with the admin login printed by the seed
script (default `admin@example.com` / `changeme123` — **change this**, see
below), and create a quote.

## Demo mode (default)

The app starts in **demo mode** (`DEMO_MODE=true` in `.env`). In this mode:

- **AI "after" photos** are not generated — the before photo is shown back
  with an unmistakable "DEMO PREVIEW — not a real render" badge, both in the
  app and in the quote email.
- **Emails are not sent** — the app logs what it *would* have sent (subject,
  recipient, rendered HTML byte count) to the server console instead of
  calling a real email provider.

This lets you exercise the entire flow — create a quote, add rooms and
materials, upload photos, compute the estimate, "send" the quote — for free,
with no API keys, before connecting real services.

### Going live

1. **AI photos** — pick one (or set up both and switch with `AI_IMAGE_PROVIDER`):
   - Google Gemini: get a key at https://aistudio.google.com/apikey, set `GEMINI_API_KEY`.
   - OpenAI (`gpt-image-1`): get a key at https://platform.openai.com/api-keys, set `OPENAI_API_KEY`.

   Both require billing enabled on the provider account before generation
   works — a bare API key alone isn't enough. **Google Cloud Billing in
   particular rejects prepaid/virtual debit cards** (it's a fraud-prevention
   policy aimed at cloud-compute abuse) — use a standard bank-issued card.
   `AI_IMAGE_PROVIDER` ("gemini" or "openai") picks explicitly when both keys
   are set; left blank, the app auto-picks (openai wins if both are present).
2. **Email** — create a [Resend](https://resend.com) account, verify a
   sending domain, get an API key, and set `RESEND_API_KEY` and `EMAIL_FROM`
   in `.env`.
3. Set `DEMO_MODE=false`.
4. Set `APP_URL` to your real deployed URL (used to build absolute photo
   links inside the email — email clients can't load `/uploads/...`
   relative paths).

Both the AI image generator and the email sender are written behind small
interfaces (`src/lib/ai-photo`, `src/lib/email`) specifically so a different
provider can be swapped in without touching any calling code — that's how
Gemini and OpenAI coexist today, each a self-contained implementation of the
same `ImageGenerator` interface.

## What's real here, and what isn't

Three parts of this app are deliberately **not** "live data feeds," because
those feeds don't exist publicly. Read this before quoting a real job:

- **Material pricing** (`prisma/seed.ts`) is a seeded price book of realistic
  mid-2020s Northern California averages for mid-grade materials — not a live
  connection to Home Depot/Lowe's/local supplier pricing. No such public API
  exists, and scraping retailer sites breaks constantly and violates their
  terms of service. **Update `unitCost` in the price book (or build an admin
  screen for it) whenever real supplier prices move.** Every material row
  has a `lastUpdated` timestamp so you can tell how stale a number is.
- **Labor production rates** (also in `prisma/seed.ts`, the `laborRates`
  array) are common contractor rate-of-production benchmarks (e.g. "0.3
  hours to set and grout a square foot of tile") — not pulled from a paid
  estimating database like RSMeans (~$500+/yr, and not something this app
  has a license to redistribute). **Tune `hoursPerUnit` and `hourlyRate` to
  match your actual crew's speed and pay rate.**
- **Debris/disposal volumes** are estimated cubic-yard-per-unit factors
  (e.g. "removing a tub/shower unit generates about 1.5 cubic yards of
  debris"), combined with NorCal-typical transfer station tipping fees.
  Real tipping fees vary by facility and change over time — check against
  your actual hauler's current rates periodically.

None of this is hidden from the person using the app: every quote shows its
line items with quantities and unit costs, so a contractor reviewing a quote
before it goes out can catch anything that looks off.

## The AI "after" photo

The important design choice here: the image generator **edits the uploaded
before photo in place** (image-to-image editing via Google's Gemini
"nano banana" model), rather than generating a brand-new image from a text
description. The prompt (`src/lib/ai-photo/prompt.ts`) explicitly instructs
the model to preserve the room's real camera angle, wall/window/door
positions, and lighting, and only change the finishes being installed. That's
what keeps the result looking like the customer's actual room instead of a
generic stock-photo-style render.

The specific finishes described to the model come from each material's
`imageDescriptor` field in the price book (e.g. "matte porcelain wood-look
tile flooring, warm walnut tone") — so the render reflects whatever the
contractor actually selected for that job.

## Data model

See `prisma/schema.prisma`. Rough shape: a `Quote` belongs to a `Customer`,
has one or more `Space`s (rooms, with measurements), `MaterialSelection`s
(each pointing at a `MaterialPrice` from the price book), `Photo`s
(before/after, per space), and — once computed — a snapshot of
`EstimateLineItem`s and labor-hour totals. That snapshot is deliberate: once
an estimate is computed, its numbers don't silently change if the price book
is edited afterward. Recompute explicitly to pick up new prices.

The actual cost/labor-hour math lives in `src/lib/estimate/engine.ts` — a
pure, dependency-free function with its own unit test suite
(`engine.test.ts`) covering quantity derivation, demo/disposal debris
aggregation, overhead/tax compounding, and validation errors.

## Testing

```bash
npm test          # run once
npm run test:watch
npm run typecheck
npm run lint
```

## Moving to Postgres for production

SQLite is fine for local dev and a quick demo, but a real deployment (behind
a load balancer, multiple instances, or a serverless host) needs Postgres:

1. Provision a Postgres database (Neon, Supabase, RDS, etc.).
2. In `prisma/schema.prisma`, change:
   ```prisma
   datasource db {
     provider = "postgresql"   // was "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
3. Set `DATABASE_URL` to the Postgres connection string.
4. Run `npm run db:push` (or set up proper migrations with `prisma migrate`)
   and `npm run db:seed`.

## Uploaded/generated photos

Photos are written to `public/uploads/` on local disk
(`src/lib/uploads/storage.ts`). That only works for a single long-running
server process — it will **not** work on a serverless/edge host with an
ephemeral filesystem (e.g. Vercel's default functions). If you deploy there,
swap `storage.ts` for an object-storage backend (S3, Cloudflare R2, etc.)
before going live; the function signatures (`saveUploadedPhoto`,
`saveGeneratedPhoto`) are the only thing calling code depends on.

## Auth

Single-admin-style login: a `User` row with a bcrypt password hash, a signed
JWT session cookie (`src/lib/auth`), and middleware that protects every route
except `/login`. Good enough for one contractor (or a couple of people
sharing a login/employee accounts you create by hand) — there's no
self-service signup, invite flow, or per-role permissions. **Change the
seeded admin password** (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars
before running `npm run db:seed`, or update the `User` row directly) before
using this for real.

## Known limitations worth knowing about before you rely on this

- No PDF export — quotes are HTML email only.
- No payment/deposit collection, scheduling, or job tracking after a quote
  is accepted — this app only gets you to "quote sent."
- One region (Northern California) and one price book — multi-region pricing
  would need a `region` filter added to the material/labor/disposal queries.
- Wall-area and countertop/backsplash/cabinetry quantities are estimates from
  simple formulas (see `WALL_OPENINGS_DEDUCTION` in `engine.ts`) or explicit
  contractor-entered quantities — not a real architectural takeoff.
