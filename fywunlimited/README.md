# FYW Unlimited — landing page

Static site for fywunlimited.com. No build step: plain HTML, CSS and JS.

## Run locally
    cd fywunlimited && python3 -m http.server 8000   # open http://localhost:8000

## Before launch
1. **Email signup:** create a free form at formspree.io and replace `YOUR_FORM_ID` in both `<form>` tags in `index.html`. Until then the forms show "Signups open soon."
2. **Copy:** the hero, pillars and CTA text are first-draft. Replace them with your real offer.
3. **Contact email:** `hello@fywunlimited.com` in the footer must be a real inbox.

## Deploy (Namecheap shared hosting / cPanel)
1. cPanel > SSL/TLS Status: confirm fywunlimited.com has an active certificate (run AutoSSL if not).
2. cPanel > File Manager > `public_html/`: delete Namecheap's default `index.html`/`default.html`.
3. Upload these into `public_html/` (contents, not the folder): `index.html`, `styles.css`, `main.js`, `.htaccess`, `assets/`. Enable "Show Hidden Files" in File Manager settings to see `.htaccess`.
4. Visit http://www.fywunlimited.com and confirm it redirects to https://fywunlimited.com.

Do not upload `README.md`. `.htaccess` forces HTTPS, so upload it only after step 1 or the site will fail to load.

## Assets
`assets/` holds the logo kit: `icon.svg` (wolf mark, cropped from the full logo), `logo.svg` / `logo-white.svg` (full lockup), `wordmark-black.svg`, plus generated `favicon-32.png`, `apple-touch-icon.png` and `og-image.jpg` (1200x630 link preview).
Brand colors: cyan `#08C7D6` → navy `#02023E`. Logo font is Steelfish (commercial); the site uses Oswald from Google Fonts as a free stand-in.
