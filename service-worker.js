/* jshint -W104 */ /* jshint -W119 */

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
  '/img/icons/icon192.png',
  '/img/icons/icon512.png',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/picturefill.min.js',
  '/js/restaurant_info.js',
  '/js/manifest.json'
];

const staticCacheName = 'sw-cache-v3';

if (typeof idb === 'undefined' || idb === null) {
  self.importScripts('./js/idb.js');
}

const openDatabase = idb.openDb('restrev-store', 3, upgradeDb => {
  console.log("open database");
  switch (upgradeDb.oldVersion){
    case 0:
      upgradeDb.createObjectStore('restaurants-obj', {keyPath: 'id'});
    case 1:
      upgradeDb.createObjectStore('reviews-obj', {keyPath: 'id'});
    case 2:
      upgradeDb.createObjectStore('review-form-submits', {keyPath: 'key', autoIncrement: true});
      upgradeDb.createObjectStore('restaurant-favorite-submits', {keyPath: 'key', autoIncrement: true});
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

/* Listen for activate event, delete caches as found
Can possibly add idb cleanup here too
*/
self.addEventListener('activate', event => {
  console.log('activate');
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

self.addEventListener('message', event => {
  console.log(event.data);
  openDatabase.then(db=>{
    const tx = db.transaction('review-form-submits', 'readwrite');
    tx.objectStore('review-form-submits').put({value: event.data});
    tx.complete;
  });
});
/* Listen for fetch event, check if url is in cache and return from cache if found. */

self.addEventListener('fetch', event => {
  console.log('Fetch event for ', event.request.url);
  console.log('Fetch event is', event)
  let parseURL = new URL(event.request.url);
  let requestHost = parseURL.host;
  let requestPath = parseURL.pathname;
  let requestSearch = parseURL.search;
  // add functions based on URL of Request
  // one for database requests and one for the rest
  // if a database request look to idb
  // TODO: change handling by looking at whether response is json reponse instead of by host
  if (requestHost === 'localhost:8000'){
    event.respondWith(
      caches.match(event.request, {ignoreSearch: true})
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
    if (requestPath.startsWith('/restaurants')){
      let restaurantID = requestPath.replace('/restaurants/','');
      //TODO: break up into different methods for get versus post and put
      //if put event.request.method === 'PUT'
      //
      console.log(event);
      //Function for get
      event.respondWith(
          openDatabase.then(db => {
            if(!!restaurantID){
              let idNumber = parseInt(restaurantID);
              return db.transaction('restaurants-obj')
              .objectStore('restaurants-obj').get(idNumber);
            } else {
              return db.transaction('restaurants-obj')
              .objectStore('restaurants-obj').getAll();
            }
          })
          .then(db=>{
            //TODO: debug if not array
            //pass result over and update accordingly
            let dbData = false;
            let idbData;
            if(db){
              if(Array.isArray(db)){
                if (db.length > 1){
                  dbData = true;
                }
              } else {
                dbData = true;
              }
            }
            if (dbData){
              // convert to a response to allow clone(), json() functions to work
              idbData = new Response(JSON.stringify(db));
            }
            // TODO: decide when to re-fetch data from API:
            // If database, return its data, then fetch and update  database. If nothing returned, just fetch and update.
            return fetch(event.request).then(data => {
              let dataClone = data.clone();
              dataClone.json().then(json => {
                openDatabase.then(db => {
                  const tx = db.transaction('restaurants-obj',  'readwrite');
                  //Handle array of json objects versus just one object
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
            }).catch(r=>{console.log("caught restaurant!"); return idbData || console.log(r);});
            //catch goes here for idb temporary store if it doesn't work online
          }).catch(err=>{console.log(err);})
        )
        //function for put
        //Execute the fetch, catch with putting it into the temp idb
      } else if (requestPath.startsWith('/reviews')){
        //TODO: add in stuff for review requests
        let reviewID = false;
        if (!requestSearch){
          reviewID = requestPath.replace('/reviews/','');
        }
        if (event.request.method === 'POST'){
          console.log("here's the event ", event);
          let eventClone = event.request.clone();
          event.respondWith(
            fetch(event.request)
            .then(response=>{
                  let responseClone = response.clone();
                  responseClone.json().then(json=>{
                    openDatabase.then(db=>{
                      const tx = db.transaction('reviews-obj', 'readwrite');
                      tx.objectStore('reviews-obj').put(json);
                      tx.complete;
                    });
                  });
                  return response;
                }
              )
              //No catch here since fallback is at dbhelper
          );
          //catch goes here to send to the temp database if offline
        } else if (event.request.method === 'GET'){
          event.respondWith(
            //change these: grab everything from the db, then just return the ones you want?
              openDatabase.then(db => {
                if(!!reviewID){
                  let idNumber = parseInt(reviewID);
                  return db.transaction('reviews-obj')
                  .objectStore('reviews-obj').get(idNumber);
                } else {
                  return db.transaction('reviews-obj')
                  .objectStore('reviews-obj').getAll();
                  //Add logic for review by restaurant to sort above
                }
              })
              .then(db=>{
                //TODO: debug if not array
                //pass result over and update accordingly
                let dbData = false;
                let idbData;
                if(db){
                  if(Array.isArray(db)){
                    if (db.length > 1){
                      dbData = true;
                    }
                  } else {
                    dbData = true;
                  }
                }
                if (dbData){
                  // convert to a response to allow clone(), json() functions to work
                  idbData = new Response(JSON.stringify(db));
                }
                // TODO: decide when to re-fetch data from API:
                // If database, return its data, then fetch and update  database. If nothing returned, just fetch and update.
                //return idbData || fetch(event.request).then(data => {
                return fetch(event.request).then(data => {
                  let dataClone = data.clone();
                  dataClone.json().then(json => {
                    openDatabase.then(db => {
                      const tx = db.transaction('reviews-obj', 'readwrite');
                      //Handle array of json objects versus just one object
                      if (Array.isArray(json)){
                        json.forEach(j=>{
                          tx.objectStore('reviews-obj').put(j);
                        })
                      } else {
                        tx.objectStore('reviews-obj').put(json);
                      }
                      tx.complete;
                    }).catch(err=>{console.log(err);});
                  }).catch(err=>{console.log(err);});
                  return data;
                }).catch(r=>{return idbData || console.log(r);});
                //catch goes here to send to the temp database if offline
              }).catch(err=>{console.log(err);})
            )
        }

      }
    }
});
/*
TODO: add event listener to see if online. Perhaps add to fetch logic
*/
self.addEventListener('sync', event => {
  if (event.tag === 'dataSync'){
    console.log('listening time!');
  }
  event.waitUntil(
    openDatabase.then(db =>
       db.transaction('review-form-submits')
      .objectStore('review-form-submits').getAll()
    ).then(formSubmits=>{
      Promise.all(formSubmits.map(sub=>{
        fetch(sub.value.url, sub.value.params)
        .then(response => response.json())
        .then(json => {console.log(json);})
        .catch(e => {console.log(e);});
      }));
    })
  );
  /*
  return fetch(fetchUrl, fetchParams)
  .then(response => response.json())
  .then(json => {console.log(json);})
  */
});

//TODO: Add a listener when connection's offline to push through updates from IDB when reconnected (can be 2-way updates)
