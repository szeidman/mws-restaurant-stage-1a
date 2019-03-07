## Restaurant Reviews Project Stage 2 of 3
### Description
This branch aims to meet the specifications for Stage 2 of the Restaurant Reviews project. Stage 1 added some caching, responsiveness, and a11y features to a pre-built site. Currently, the site features:
* Accessibility features, e.g., use of aria and other best practices for screen readers, appropriate color contrast, and more
* Responsive layouts, including responsive images, for main and detail pages to allow clean viewing across screen sizes
* Caching via a Service Worker and IndexedDB to enable offline use
* Performance features to meet various benchmarks checked with Lighthouse

### Usage
You'll need to install node and npm if you've not already.
(https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

This site relies on an API server provided by Udacity. The fork I used in development is below for posterity; you can follow the instructions therein to get it up and running on port 1337.
https://github.com/szeidman/mws-restaurant-stage-2

Clone this repo and open it from your terminal and run 'npm install'. Then launch the site locally however you'd like (I generally used the Python command 'python -m SimpleHTTPServer') on port 8000.

With both servers running you can access http://localhost:8000 to see the site and test behavior on and offline.
