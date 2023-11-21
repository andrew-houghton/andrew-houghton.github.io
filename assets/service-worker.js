importScripts('./version.js');
const CACHE_NAME = "mpwa-cache-v" + clientVersion;
const urlsToCache = [
  "/",
  "/assets/decode.js",
  "/assets/gauges.js",
  "/assets/search.js",
  "/assets/splash.png",
  "/assets/svg/01d.svg",
  "/assets/svg/02d.svg",
  "/assets/svg/03d.svg",
  "/assets/svg/04.svg",
  "/assets/svg/05d.svg",
  "/assets/svg/06d.svg",
  "/assets/svg/07d.svg",
  "/assets/svg/08d.svg",
  "/assets/svg/09.svg",
  "/assets/svg/10.svg",
  "/assets/svg/11.svg",
  "/assets/svg/12.svg",
  "/assets/svg/13.svg",
  "/assets/svg/14.svg",
  "/assets/svg/15.svg",
  "/assets/svg/20d.svg",
  "/assets/svg/21d.svg",
  "/assets/svg/22.svg",
  "/assets/svg/23.svg",
  "/assets/svg/24d.svg",
  "/assets/svg/25d.svg",
  "/assets/svg/26d.svg",
  "/assets/svg/27d.svg",
  "/assets/svg/28d.svg",
  "/assets/svg/29d.svg",
  "/assets/svg/30.svg",
  "/assets/svg/31.svg",
  "/assets/svg/32.svg",
  "/assets/svg/33.svg",
  "/assets/svg/34.svg",
  "/assets/svg/40d.svg",
  "/assets/svg/41d.svg",
  "/assets/svg/42d.svg",
  "/assets/svg/43d.svg",
  "/assets/svg/44d.svg",
  "/assets/svg/45d.svg",
  "/assets/svg/46.svg",
  "/assets/svg/47.svg",
  "/assets/svg/48.svg",
  "/assets/svg/49.svg",
  "/assets/svg/50.svg",
];

/**
 * Listen for the install event, which fires when the service worker is installing.
 * We use event.waitUntil() to ensure the install doesn't finished until our promise resolves
 * so we don't do anything else until the initial caching is done.
 */
self.addEventListener("install", async (event) => {
  console.log("installing!");
  self.skipWaiting();
  event.waitUntil(cache_assets());
});

async function cache_assets() {
  const cache = await self.caches.open(CACHE_NAME);
  return cache.addAll(urlsToCache);
}

/**
 * Listen for the activate event, which is fired after installation
 * Activate is when the service worker actually takes over from the previous
 * version, which is a good time to clean up old caches.
 * Again we use waitUntil() to ensure we don't move on until the old caches are deleted.
 */
self.addEventListener("activate", async (event) => {
  console.log("activating!");
  event.waitUntil(delete_old_caches());
});

async function delete_old_caches() {
  // Get the keys of all the old caches
  const keys = await caches.keys();
  const deletePromises = keys
    .filter((key) => key !== CACHE_NAME)
    .map((key) => self.caches.delete(key));
  return Promise.all(deletePromises);
}

/**
 * Listen for browser fetch events.
 * These fire any time the browser tries to load anything.
 * This isn't just fetch() calls; clicking a <a href> triggers it too.
 */
self.addEventListener("fetch", (event) => {
  console.log("fetching!");
  event.respondWith(get_response(event.request));
});

/**
 * We follow the "stale-while-revalidate" pattern:
 * respond with the cached response immediately (if we have one)
 * even though this might be "stale" (not the most recent version).
 * In the background fetch the latest version and put that into cache
 * on next request the user will get the latest version
 */
async function get_response(request) {
  const cache = await self.caches.open(CACHE_NAME);
  const cached_response = await cache.match(request);
  // Important: we do not await here, since that would defeat the point of using the cache
  const pending_response = fetch(request).then((response) => {
    cache.put(request, response.clone());
    return response;
  });
  return cached_response || pending_response;
}
