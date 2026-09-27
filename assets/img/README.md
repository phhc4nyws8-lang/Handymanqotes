# Images

`gallery/before-1.jpg` … `after-3.jpg` are solid-color placeholders
generated for layout purposes only. Replace them with real photos
before launch — keep the same filenames (or update the `src`
attributes in `index.html` if you rename them).

`logo/`, `favicon.png`, and `og-cover.png` are the real JC Handyman
brand assets (from the logo kit) — no placeholders there.

## Before/after gallery

- Recommended size: 800x600px (4:3), JPG, under 300KB each.
- Shoot "before" and "after" from the same angle/distance so the slider
  comparison lines up.
- Naming pattern already wired into `index.html`:
  `before-1.jpg` / `after-1.jpg`, `before-2.jpg` / `after-2.jpg`, etc.
- Add a 4th pair by copying one of the `.ba-slider` blocks in the
  Gallery section of `index.html` and updating the numbers.
- Update each `<figcaption>` with the real job type/neighborhood.

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
