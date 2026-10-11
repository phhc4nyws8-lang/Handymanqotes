# Handyman Quotes

Generates itemized remodel quotes for a Northern California handyman/contractor
business: enter a customer, the rooms being worked on and their measurements,
pick materials, upload a "before" photo, and the app computes a phase-by-phase
cost breakdown (demolition, materials, installation, debris disposal),
estimates labor hours, generates an AI "after" photo of the space, and emails
the whole thing to the customer.

## Stack

Next.js (App Router) + TypeScript + Prisma + Tailwind. Server Actions handle
all mutations — no separate API layer. Postgres (local or hosted) both in
dev and production — see "Local Postgres for dev" below if you don't have
one running yet.

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
# edit .env: set DATABASE_URL to a Postgres instance (see "Local Postgres
# for dev" below if you don't have one running yet)
npm run db:push             # create the tables from the schema
npm run db:seed             # seed the NorCal price book + an admin login
npm run dev
```

### Local Postgres for dev

Any local Postgres works. Quickest with Docker:

```bash
docker run -d --name handyman-dev -e POSTGRES_USER=handyman \
  -e POSTGRES_PASSWORD=devpassword -e POSTGRES_DB=handyman_dev \
  -p 5432:5432 postgres:16
```

Then set `DATABASE_URL="postgresql://handyman:devpassword@localhost:5432/handyman_dev"`
in `.env`.

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

## Deploying to Render

This app is built to run as a single Render **Web Service** (a persistent
Node process — not serverless), with Render's managed **Postgres** for the
database and a Render **persistent Disk** for uploaded/generated photos.

### 1. Create the Postgres database

In Render: New → PostgreSQL. Once it's up, copy its **Internal Database
URL** (same-region internal connections are free of egress charges; use the
internal URL, not the external one, since the web service lives in the same
Render region).

### 2. Create the Web Service

New → Web Service, pointed at this repo/branch.

- **Runtime:** Node (not Docker — there is no `Dockerfile` in this repo).
- **Build command:** `npm install && npm run build`
- **Start command:** `npm start`
- The `.node-version` file (and `engines.node` in `package.json`) pin Node
  22 so Render provisions a matching build image automatically.

### 3. Add a persistent Disk for photos

Web Service → Disks → Add Disk. Mount it wherever Render suggests (e.g.
`/var/data`). Photos are stored outside the app's `public/` directory so
they survive deploys — without a disk, every deploy wipes uploaded/generated
photos, since Render's filesystem is otherwise ephemeral per-deploy.

Set the environment variable:

```
UPLOADS_DIR=/var/data/uploads
```

(matching whatever mount path you chose). This only changes **where on
disk** files are written — they're still served at the same `/uploads/...`
URLs either way (`src/app/uploads/[...path]/route.ts`), so nothing else
needs to change. A disk-backed path on a real deployed host **is** publicly
reachable (that's what makes email image links work) — it only fails to
work on serverless/edge hosts with no persistent filesystem at all (e.g.
Vercel's default functions), which this deployment path isn't using.

### 4. Set environment variables

In the Web Service's Environment tab, set everything from `.env.example`:

| Variable | Value |
|---|---|
| `DATABASE_URL` | the Postgres Internal Database URL from step 1 |
| `AUTH_SECRET` | output of `openssl rand -base64 32` |
| `DEMO_MODE` | `false` |
| `AI_IMAGE_PROVIDER` | `openai` (or `gemini`) |
| `OPENAI_API_KEY` / `GEMINI_API_KEY` | your real key |
| `RESEND_API_KEY` | your real key |
| `EMAIL_FROM` | a verified sender on your Resend domain |
| `APP_URL` | your real `https://...onrender.com` URL (or custom domain) — email image links are built from this, so it must be the real public URL, not `localhost` |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | your real admin login — **set these before seeding**, don't ship with the `admin@example.com` / `changeme123` default |
| `UPLOADS_DIR` | the disk mount path from step 3 |

### 5. First deploy: push schema + seed

After the first successful deploy, run once via Render's Shell (Web Service
→ Shell tab):

```bash
npm run db:push
npm run db:seed
```

`db:seed` is safe to re-run later (it upserts the price book by name instead
of duplicating it) — but `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` must
already be set to their real values the first time it runs, since that's
when the admin login gets created.

### 6. Verify

Visit the real URL, log in with the real admin credentials, create a test
quote, generate an after photo, and send a test email to yourself — confirm
the embedded photo actually loads in Gmail (this is what `APP_URL` being
correct fixes).

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
