# Images

`gallery/*.jpg` are real job-site photos (resized to ~1000px wide,
JPEG quality 0.8). `logo/`, `favicon.png`, and `og-cover.png` are the
real JC Handyman brand assets (from the logo kit).

## Gallery

A plain photo grid (`.photo-grid` in `index.html`) — no before/after
pairing needed.

- Recommended size: ~1000px on the long edge, JPG, under 250KB each.
- Add a photo by copying one of the `<figure>` blocks in the Gallery
  section of `index.html`, pointing `src` at the new file, and writing
  a short `<figcaption>` describing the job.

## Logo

- `logo/logo-mark.svg` — icon + wordmark in the brand blue
  (#9ab1d6), transparent background. Used in the header, which sits
  on a light background.
- `logo/logo-mark-white.svg` — same lockup in white. Used in the
  footer, which sits on a dark teal background.

## Social preview

- `og-cover.png`: the branded cover image, shown when the link is
  shared on Facebook/iMessage/etc.

## Favicon

- `favicon.png`: a 512x512 crop of the logo icon on the brand teal
  background, referenced via `<link rel="icon" type="image/png">`.
