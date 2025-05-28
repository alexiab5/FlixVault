// Constants for localStorage keys
const PENDING_OPS_KEY = 'pendingReviewOps';
const CACHED_REVIEWS_KEY = 'cachedReviews';
const CACHED_MOVIES_KEY = 'cachedMovies';

class OfflineService {
  constructor() {
    this.pendingOperations = [];
    this.loadPendingOperations();
  }

  // Load pending operations from localStorage
  loadPendingOperations() {
    const stored = localStorage.getItem(PENDING_OPS_KEY);
    this.pendingOperations = stored ? JSON.parse(stored) : [];
  }

  // Save pending operations to localStorage
  savePendingOperations() {
    localStorage.setItem(PENDING_OPS_KEY, JSON.stringify(this.pendingOperations));
  }

  // Queue a new operation
  queueOperation(operation) {
    this.pendingOperations.push({
      ...operation,
      timestamp: Date.now(),
      status: 'pending'
    });
    this.savePendingOperations();
  }

  // Get all pending operations
  getPendingOperations() {
    return this.pendingOperations;
  }

  // Remove a completed operation
  removeOperation(operationId) {
    this.pendingOperations = this.pendingOperations.filter(op => op.id !== operationId);
    this.savePendingOperations();
  }

  // Cache a review
  cacheReview(review) {
    const cachedReviews = this.getCachedReviews();
    const existingIndex = cachedReviews.findIndex(r => r.id === review.id);
    
    if (existingIndex >= 0) {
      cachedReviews[existingIndex] = review;
    } else {
      cachedReviews.push(review);
    }
    
    localStorage.setItem(CACHED_REVIEWS_KEY, JSON.stringify(cachedReviews));
  }

  // Cache multiple reviews
  cacheReviews(reviews) {
    localStorage.setItem(CACHED_REVIEWS_KEY, JSON.stringify(reviews));
  }

  // Get cached reviews
  getCachedReviews() {
    const cached = localStorage.getItem(CACHED_REVIEWS_KEY);
    return cached ? JSON.parse(cached) : [];
  }

  // Cache a movie
  cacheMovie(movie) {
    const cachedMovies = this.getCachedMovies();
    const existingIndex = cachedMovies.findIndex(m => m.id === movie.id);
    
    if (existingIndex >= 0) {
      cachedMovies[existingIndex] = movie;
    } else {
      cachedMovies.push(movie);
    }
    
    localStorage.setItem(CACHED_MOVIES_KEY, JSON.stringify(cachedMovies));
  }

  // Get cached movies
  getCachedMovies() {
    const cached = localStorage.getItem(CACHED_MOVIES_KEY);
    return cached ? JSON.parse(cached) : [];
  }

  // Sync pending operations with the server
  async syncPendingOperations() {
    const operations = [...this.pendingOperations];
    
    for (const operation of operations) {
      try {
        const response = await fetch(operation.url, {
          method: operation.method,
          headers: {
            ...operation.headers,
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: operation.body
        });

        if (response.ok) {
          // Remove successful operation
          this.removeOperation(operation.id);
          
          // Update cached data if needed
          if (operation.method === 'POST' || operation.method === 'PUT') {
            const data = await response.json();
            if (data.review) {
              this.cacheReview(data.review);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to sync operation:`, error);
        // Keep failed operations in the queue
      }
    }
  }

  // Check if we're online and server is reachable
  async isOnline() {
    if (!navigator.onLine) return false;
    
    try {
      const response = await fetch('/api/ping', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Create a singleton instance
const offlineService = new OfflineService();
export default offlineService; 