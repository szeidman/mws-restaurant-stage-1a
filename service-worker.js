/*Below functions are adapted, with modifications, from Udacity lessons and following along with the exercise located at https://developers.google.com/web/ilt/pwa/lab-caching-files-with-service-worker, created and shared by Google, which was licensed with a Creative Commons 3.0 License (https://creativecommons.org/licenses/by/3.0/) with code samples licensed under an Apache 2.0 license (http://www.apache.org/licenses/LICENSE-2.0). */

/* Set files to cache */
const filesToCache = [
  '/',
  '/css/responsive.css',
  '/css/styles.css',
  '/index.html',
  '/restaurant.html',
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
  '/images/icon192.png',
  '/images/icon512.png',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/picturefill.min.js',
  '/js/restaurant_info.js',
  '/js/manifest.json'
];

const staticCacheName = 'sw-cache-v2';

if (typeof idb === 'undefined' || idb === null) {
  self.importScripts('./js/idb.js');
  console.log('it was undefined');
}
console.log(idb);
const openDatabase = idb.openDb('restrev-store', 2, upgradeDb => {
  console.log("udb", upgradeDb);
  switch (upgradeDb.oldVersion){
    case 0:
      upgradeDb.createObjectStore('restaurants-obj', {keyPath: 'id'});
  }
});


/* Listen for install event, set callback */
self.addEventListener('install', event => {
  console.log('Attempting to install service worker and cache static assets');
  event.waitUntil(
    caches.open(staticCacheName)
    .then(cache => {
      return cache.addAll(filesToCache);
    })
    .catch(e=>console.log(e))
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
  let parseURL = new URL(event.request.url)
  let requestHost = parseURL.host;
  // add functions based on URL of Request
  // one for database requests and one for the rest
  // if a database request look to idb
  if (requestHost === 'localhost:8000'){
    console.log('cache time');
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
} else if (requestHost === 'localhost:1337'){
  let requestPath = parseURL.pathname;
  let restaurantID = requestPath.replace('/restaurants/','');

  console.log(1337);
  console.log(requestPath);
  event.respondWith(
      //change this to a lookup in the data, if so return it if not return the fetch(event.request)
      //see if there's anything in the db and return it if so
      //if not then do the fetch
      //when fetch assign the id to the database: just data for now
      //name
      //neighborhood

      openDatabase.then(db => {
        if(!!restaurantID){
          console.log('id is', restaurantID);
          let idNumber = parseInt(restaurantID);
          return db.transaction('restaurants-obj')
          .objectStore('restaurants-obj').get(idNumber);
        } else {
          return db.transaction('restaurants-obj')
          .objectStore('restaurants-obj').getAll();
        }
      })
      .then(db=>{
        console.log("the db is", db);
        //console.log("in the db function, it's", db[0].data);
        //if (!db){console.log("nope no db")}
        //if (db && db[0] && db[0].data){console.log('Found ', event.request.url, ' in idb'); return db[0].data}
        //data return: put it back to json for response and end it
        return fetch(event.request)
      })
      .then(data => {
        let dataClone = data.clone();
        dataClone.json().then(json => {
          openDatabase.then(db => {
            const tx = db.transaction('restaurants-obj', 'readwrite');
            if (Array.isArray(json)){
              json.forEach(j=>{
                tx.objectStore('restaurants-obj').put(j);
              })
            } else {
              tx.objectStore('restaurants-obj').put(json);
            }
            tx.complete;
          });
        });
        return data;
    }));
  }
});
