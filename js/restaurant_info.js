/* jshint -W104 */ /* jshint -W119 */

var restaurant;
var newMap;

// Register service worker.

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
  .then(function(registration) {
    console.log('Registration successful, scope is:', registration.scope);
  })
  .catch(function(error) {
    console.log('Service worker registration failed, error:', error);
  });
}

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL().then(r => {
      const restaurant = self.restaurant;
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1Ijoic2p6bWFwYm94IiwiYSI6ImNqcGNyZTZhZzI1c3QzcG4wcWE1cWQyaXYifQ.afEzEbeArNUN31DJZcq6uw',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(newMap);
      fillBreadcrumb();
      return DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
  })
  .catch(e=> console.log(e));
};

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

fetchReviewsFromURL = (restID) => {
  if(self.restaurant){
    if (self.restaurant.reviews) {
      return self.restaurant.reviews;
    }
    return DBHelper.fetchReviewsByRestaurant(restID)
    .then(reviews => {
      self.restaurant.reviews = reviews;
      if(!reviews) {
        console.error(error);
        return;
      }
      fillReviewsHTML(self.restaurant.reviews);
    })
    .catch(e=>console.log(e));
  }
};
/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = () => {
  if (self.restaurant) { // restaurant already fetched!
    if(!self.restaurant.reviews){
      fetchReviewsFromURL(self.restaurant.id)
      .then(r=> self.restaurant)
      .catch(e=>console.log(e));
    }
    return self.restaurant;
  } else {
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
      error = 'No restaurant id in URL';
      return console.log(error);
    } else {
      return DBHelper.fetchRestaurantById(id).then(restaurant => {
        self.restaurant = restaurant;
        if (!restaurant) {
          console.error(error);
          return;
        }
        fetchReviewsFromURL(id);
      })
      .then(r => {fillRestaurantHTML();})
      .catch(e => console.log(e));
    }
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  /* Add responsive images. */
  const picture = document.getElementById('restaurant-picture');
  picture.className = 'restaurant-img';
  const large = document.createElement('source');
  large.srcset = DBHelper.imageLargeUrlForRestaurant(restaurant);
  large.media = "(min-width: 500px)";
  picture.append(large);
  const small = document.createElement('source');
  small.srcset = DBHelper.imageSmallUrlForRestaurant(restaurant);
  small.media = "(max-width: 499px)";
  picture.append(small);
  const image = document.createElement('img');
  image.src = DBHelper.imageLargeUrlForRestaurant(restaurant);
  image.alt = DBHelper.imageAltForRestaurant(restaurant);
  image.className = 'restaurant-img';
  picture.append(image);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  //fillReviewsHTML();

}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');
    const day = document.createElement('td');
    const span = document.createElement('span');
    span.innerHTML = key;
    day.appendChild(span);
    day.className = "day";
    day.setAttribute("data-td", key[0]);
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    time.className = "time";
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.setAttribute('aria-label', "Reviews");
  title.tabIndex = "0";
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  ul.appendChild(reviewForm());
  //TODO: Add a ul append child for the form here.
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const topbar = document.createElement('div');
  topbar.classList.add("review-topbar");
  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.classList.add("review-name");
  topbar.appendChild(name);
  const date = document.createElement('p');
  let reviewDate = new Date(review.updatedAt);
  date.innerHTML = reviewDate.toLocaleString();
  date.classList.add("review-date");
  topbar.appendChild(date);
  li.appendChild(topbar);
  //&star; &starf;
  const starRating = review.rating;
  let stars = "";
  for (let i = 0; i<5; i++){
    stars += (starRating - i >= 1) ? `&starf;` : `&star;`;
  }
  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${stars}`;
  rating.setAttribute("aria-label", `Rating: ${starRating} stars out of 5`);
  rating.classList.add("review-rating");
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.classList.add("review-comments");
  li.appendChild(comments);

  return li;
}

reviewForm = () => {
  const li = document.createElement('li');
  li.setAttribute("role", "form");
  li.setAttribute("aria-labelledby", "add-review");
  const topbar = document.createElement('div');
  topbar.classList.add("review-topbar");
  const name = document.createElement('h4');
  name.innerHTML = "Add a Review";
  name.classList.add("review-name");
  name.id = "add-review";
  topbar.appendChild(name);
  /*
  const date = document.createElement('p');
  let reviewDate = new Date();
  date.innerHTML = reviewDate.toLocaleString();
  date.classList.add("review-date");
  topbar.appendChild(date);
  */
  li.appendChild(topbar);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: `;
  rating.classList.add("review-rating");
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = ``;
  comments.classList.add("review-comments");
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const id = getParameterByName('id');
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  const liLink = document.createElement('a');
  liLink.setAttribute('href', `./restaurant.html?id=${id}`);
  liLink.innerHTML = restaurant.name;
  liLink.setAttribute('aria-current', 'page');
  li.appendChild(liLink);
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

//TODO: Add in JS to populate the form element
