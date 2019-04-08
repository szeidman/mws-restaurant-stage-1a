/* jshint -W104 */ /* jshint -W119 */

//import { openDb, deleteDb } from 'idb';
/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}`;
  }

  /**
   * Fetch all restaurants, or one by id if given.
   */

  static fetchRestaurants(id) {
    return fetch(`${DBHelper.DATABASE_URL}/restaurants/${id || ""}`)
    .then(response => response.json())
    .then(json => json)
    .catch(e => console.log(e));
  }
//Fetch all reviews, or one by id if given
  static fetchReviews(id) {
    return fetch(`${DBHelper.DATABASE_URL}/reviews/${id || ""}`)
    .then(response => response.json())
    .then(json => json)
    .catch(e => console.log(e));
  }
//Fetch reviews for a particular restaurant.
  static fetchReviewsByRestaurant(restID) {
    return fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${restID}`)
    .then(response => response.json())
    .then(json => json)
    .catch(e => console.log(e));
  }
  //Create a review
    static createReview(data) {
      return fetch(`${DBHelper.DATABASE_URL}/reviews/`, {
          method: 'POST',
          body: JSON.stringify(data),
          headers: {'Content-Type': 'application/json'}
        }
      )
      .then(response => response.json())
      .then(json => {console.log(json); location.reload();})
      .catch(e => console.log(e));
    }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
    // fetch all restaurants with proper error handling.
    return DBHelper.fetchRestaurants(id).then(r => {
        const restaurant = r;
        if (restaurant) { // Got the restaurant
          return restaurant;
        } else { // Restaurant does not exist in the database
          return('Restaurant does not exist');
        }
      })
      .catch(e => console.log(e));
    }

  static toggleFavoriteRestaurant(id, isFavorite) {
    console.log(isFavorite);
    return fetch(`${DBHelper.DATABASE_URL}/restaurants/${id}/?is_favorite=${!isFavorite}`, {
      method: 'PUT'
      }
    )
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    return DBHelper.fetchRestaurants().then(restaurants => {
        // Filter restaurants to have only given cuisine type
        let results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
    })
    .catch(error => console.log(error));
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then(restaurants => {
        // Filter restaurants to have only given neighborhood
        let results = restaurants.filter(r => r.neighborhood == neighborhood);
        console.log("fetchRestaurantByNeighborhood " + results);
        return results;
      })
      .catch(e => console.log(e));
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then(restaurants => {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        console.log("fetchRestaurantByCuisineAndNeighborhood " + results);
        return results;
    })
    .catch(e => console.log(e));
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then(restaurants => {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        console.log('uniqueNeighborhoods ' + uniqueNeighborhoods );
        return uniqueNeighborhoods;
    })
    .catch(e => console.log(e));
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines() {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then(restaurants => {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        console.log('uniqueCuisines ' + uniqueCuisines );
        return uniqueCuisines;
    })
    .catch(e => console.log(e));
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageLargeUrlForRestaurant(restaurant) {
    return (`/images/${restaurant.id}-800_large.jpg`);
  }

  /**
   * Restaurant image URL.
   */
  static imageSmallUrlForRestaurant(restaurant) {
    return (`/images/${restaurant.id}-400_small.jpg`);
  }

  /**
   * Restaurant alt text.
   */
  static imageAltForRestaurant(restaurant) {
    return (`${restaurant.alt_text}`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
    });
      marker.addTo(newMap);
    return marker;
  }

  //TODO: Add function to send form post via fetch

  //TODO: Add function to update form put via fetch

  //TODO: Add function to update isFavorite on restaurants via fetch

}
