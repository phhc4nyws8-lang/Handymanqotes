# FYW Unlimited — landing page

Static site for fywunlimited.com. No build step: plain HTML, CSS and JS.

## Run locally
    cd fywunlimited && python3 -m http.server 8000   # open http://localhost:8000

## Before launch
1. **Email signup:** create a free form at formspree.io and replace `YOUR_FORM_ID` in both `<form>` tags in `index.html`. Until then the forms show "Signups open soon."
2. **Copy:** the hero, pillars and CTA text are first-draft. Replace them with your real offer.
3. **Contact email:** `hello@fywunlimited.com` in the footer must be a real inbox.

## Deploy
Any static host works (Netlify, Vercel, Cloudflare Pages, GitHub Pages). Set the publish directory to `fywunlimited/`, then point the fywunlimited.com DNS at the host.

## Assets
`assets/` holds the logo kit: `icon.svg` (wolf mark, cropped from the full logo), `logo.svg` / `logo-white.svg` (full lockup), `wordmark-black.svg`, plus generated `favicon-32.png`, `apple-touch-icon.png` and `og-image.jpg` (1200x630 link preview).
Brand colors: cyan `#08C7D6` → navy `#02023E`. Logo font is Steelfish (commercial); the site uses Oswald from Google Fonts as a free stand-in.
