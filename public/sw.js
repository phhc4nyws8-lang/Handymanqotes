// Minimal service worker — exists only to satisfy the browser's "installable
// PWA" checklist (Chrome requires a registered service worker with a fetch
// handler before it will offer "Add to Home Screen"/"Install app").
//
// Deliberately does NOT cache anything. This app is behind login and every
// page shows live, frequently-changing data (quotes, prices, photos) — an
// offline-first cache here would risk showing a contractor stale pricing or,
// worse, another user's cached authenticated page. If real offline support
// is wanted later, cache only the truly static assets (icons, manifest)
// explicitly, never page HTML or API/Server Action responses.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // GET-only: iOS Safari has a known bug where re-issuing a POST with a
  // large/multipart body through event.respondWith(fetch(event.request))
  // fails ("FetchEvent.respondWith received an error: TypeError: Load
  // failed") — broke photo uploads. Not responding at all for non-GET lets
  // the browser handle the request natively, which is equivalent anyway
  // since this worker does no caching.
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request));
});
