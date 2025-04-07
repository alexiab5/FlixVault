// This file provides a consistent in-memory store for the API routes
import movieReviews from './reviews';

// Create a module-scoped variable to store the reviews
let reviews = [...movieReviews];

// If we're on the server, use a global variable to ensure it's shared between API calls
if (typeof window === 'undefined') {
  if (!global._reviewsStore) {
    global._reviewsStore = reviews;
  } else {
    reviews = global._reviewsStore;
  }
}

// Export functions to interact with the store
export const reviewsStore = {
  getAll() {
    return reviews;
  },
  
  getById(id) {
    return reviews.find(review => String(review.id) === String(id));
  },
  
  add(newReview) {
    // Check for duplicates
    if (reviews.some(review => String(review.id) === String(newReview.id))) {
      throw new Error('Review with this ID already exists');
    }
    
    // Add to beginning of array
    reviews = [newReview, ...reviews];
    
    // Update global reference if on server
    if (typeof window === 'undefined') {
      global._reviewsStore = reviews;
    }
    
    return newReview;
  },
  
  update(id, updatedReview) {
    const reviewIndex = reviews.findIndex(review => String(review.id) === String(id));
    
    if (reviewIndex === -1) {
      throw new Error('Review not found');
    }
    
    reviews[reviewIndex] = updatedReview;
    
    // Update global reference if on server
    if (typeof window === 'undefined') {
      global._reviewsStore = reviews;
    }
    
    return updatedReview;
  },
  
  delete(id) {
    const reviewToDelete = this.getById(id);
    
    if (!reviewToDelete) {
      throw new Error('Review not found');
    }
    
    reviews = reviews.filter(review => String(review.id) !== String(id));
    
    // Update global reference if on server
    if (typeof window === 'undefined') {
      global._reviewsStore = reviews;
    }
    
    return reviewToDelete;
  },
  
  reset() {
    reviews = [...movieReviews];
    
    // Update global reference if on server
    if (typeof window === 'undefined') {
      global._reviewsStore = reviews;
    }
    
    return reviews;
  },
  
  filter(options = {}) {
    const { rating, sort = 'desc', limit } = options;
    
    let result = [...reviews];
    
    // Filter by rating if provided
    if (rating !== null && rating !== undefined) {
      const ratingNum = parseInt(rating);
      result = result.filter(review => review.rating === ratingNum);
    }
    
    // Sort by date
    result.sort((a, b) => {
      const dateA = new Date(a.year, new Date(Date.parse(a.month + " 1, 2000")).getMonth(), a.day);
      const dateB = new Date(b.year, new Date(Date.parse(b.month + " 1, 2000")).getMonth(), b.day);
      return sort === 'desc' ? dateB - dateA : dateA - dateB;
    });
    
    // Apply limit if specified
    if (limit) {
      result = result.slice(0, limit);
    }
    
    return result;
  }
};