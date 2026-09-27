# JC Handyman (jchandyman.work)

One-page landing site for a handyman/contractor business. Static
HTML/CSS/JS — no build step, no framework, no dependencies.

Contact info, business name, and service area are already filled in:
phone (510) 361-6584, james@jchandyman.work, James Callahan, San
Francisco Bay Area. Double-check those before launch.

## Before you launch — remaining edits

1. **Services list** — edit the numbered `<li>` items in the Services
   section if the service list changes.
2. **Photos** — replace the placeholder files in `assets/img/gallery/`
   with real before/after photos, and update each `<figcaption>` with
   the real job type/neighborhood. See `assets/img/README.md`.
3. **Favicon / social image** — replace `assets/img/favicon.ico` and
   `assets/img/og-cover.jpg` with real branded images (optional).

## Structure

```
index.html
assets/
  css/styles.css
  js/main.js
  img/
    gallery/before-1.jpg, after-1.jpg, ...
    og-cover.jpg
```

## Deploying to Namecheap

**Option A — cPanel File Manager (simplest)**
1. Log in to Namecheap → hosting dashboard → cPanel.
2. Open **File Manager** → navigate to `public_html` (this is what
   `jchandyman.work` serves).
3. Upload `index.html` and the `assets/` folder here (keep the folder
   structure intact — don't flatten it).
4. Visit `https://jchandyman.work` to confirm it's live.

**Option B — FTP**
1. In cPanel, create/find FTP credentials (or use the account you set
   up with Namecheap).
2. Connect with an FTP client (FileZilla, Cyberduck, etc.) to your
   hosting server.
3. Upload `index.html` and `assets/` into `public_html`.

**HTTPS:** Namecheap's shared hosting includes a free AutoSSL
certificate — enable it in cPanel under SSL/TLS if `https://` isn't
already working.

## Local preview

No server required — just open `index.html` in a browser. Or, to
preview it the way it'll behave when hosted:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`.
