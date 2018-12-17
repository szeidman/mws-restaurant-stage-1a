/* Set files to cache */
const filesToCache = [
  '/',
  '../css/responsive.css',
  '../css/styles.css',
  '../index.html',
  '../restaurant.html',
  '../images/1-400_small.jpg',
  '../images/2-400_small.jpg',
  '../images/3-400_small.jpg',
  '../images/4-400_small.jpg',
  '../images/5-400_small.jpg',
  '../images/6-400_small.jpg',
  '../images/7-400_small.jpg',
  '../images/8-400_small.jpg',
  '../images/9-400_small.jpg',
  '../images/10-400_small.jpg'
  /* 'pages/offline.html',
  'pages/404.html' */
];

const staticCacheName = 'sw-cache-v1';

/* Listen for install event, set callback */
self.addEventListener('install', event => {
  console.log('Attempting to install service worker and cache static assets');
  event.waitUntil(
    caches.open(staticCacheName)
    .then(cache => {
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', event => {
  console.log("Service worker activating...");
});

self.addEventListener('fetch', event => {
  console.log('Fetching:', event.request.url);
});
