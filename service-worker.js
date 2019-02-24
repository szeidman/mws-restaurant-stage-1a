/*Below functions are adapted, with modifications, from Udacity lessons and following along with the exercise located at https://developers.google.com/web/ilt/pwa/lab-caching-files-with-service-worker, created and shared by Google, which was licensed with a Creative Commons 3.0 License (https://creativecommons.org/licenses/by/3.0/) with code samples licensed under an Apache 2.0 license (http://www.apache.org/licenses/LICENSE-2.0). */

/* Set files to cache */
const filesToCache = [
  '/',
  '/css/responsive.css',
  '/css/styles.css',
  '/index.html',
  '/restaurant.html',
  '/restaurant.html?id=1',
  '/restaurant.html?id=2',
  '/restaurant.html?id=3',
  '/restaurant.html?id=4',
  '/restaurant.html?id=5',
  '/restaurant.html?id=6',
  '/restaurant.html?id=7',
  '/restaurant.html?id=8',
  '/restaurant.html?id=9',
  '/restaurant.html?id=10',
  '/data/restaurants.json',
  '/images/1-400_small.jpg',
  '/images/2-400_small.jpg',
  '/images/3-400_small.jpg',
  '/images/4-400_small.jpg',
  '/images/5-400_small.jpg',
  '/images/6-400_small.jpg',
  '/images/7-400_small.jpg',
  '/images/8-400_small.jpg',
  '/images/9-400_small.jpg',
  '/images/10-400_small.jpg',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/picturefill.min.js',
  '/js/restaurant_info.js'
];

const staticCacheName = 'sw-cache-v2';

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

/* Listen for activate event, delete caches as found */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('sw-cache-') &&
                 cacheName != staticCacheName;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

/* Listen for fetch event, check if url is in cache and return from cache if found. */
self.addEventListener('fetch', event => {
  console.log('Fetch event for ', event.request.url);
  event.respondWith(
    caches.match(event.request)
    .then(response => {
      if (response) {
        console.log('Found ', event.request.url, ' in cache');
        return response;
      }
      console.log('Network request for ', event.request.url);
      return fetch(event.request)

    .then(response => {
      return caches.open(staticCacheName).then(cache => {
      cache.put(event.request.url, response.clone());
      return response;
      });
    });


    }).catch(error => {
      console.log('Error!');
    })
  );
});
