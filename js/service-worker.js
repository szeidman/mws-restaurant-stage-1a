// Listen for install event, set callback
self.addEventListener('install', function(event) {
    console.log("installed!");
});

self.addEventListener('activate', function(event) {
  console.log("activated!");
});
