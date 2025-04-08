import { io } from 'socket.io-client';

const API_URL = '/api/movieReviews';
const PENDING_OPS_KEY = 'pendingReviewOps'; 

async function isOnline() {
  return navigator.onLine && await reviewApiService.isServerReachable();
}

async function syncPending() {
  const queue = JSON.parse(localStorage.getItem(PENDING_OPS_KEY)) || [];
  const newQueue = [];

  for (const op of queue) {
    try {
      await fetch(op.url, {
        method: op.method,
        headers: op.headers,
        body: op.body
      });
    } catch (e) {
      newQueue.push(op); // keep it in the queue
    }
  }

  localStorage.setItem(PENDING_OPS_KEY, JSON.stringify(newQueue));
}

class ReviewApiService {
  constructor() {
    this.socket = null;
    this.socketListeners = [];
  }

  // Simple server check
  async isServerReachable() {
    if (!navigator.onLine) return false;
    try {
      const response = await fetch("/api/ping", { method: "GET" });
      return response.ok;
    } catch (err) {
      return false;
    }
  }

  queueOperation(op) {
    const queue = JSON.parse(localStorage.getItem(PENDING_OPS_KEY)) || [];
    queue.push(op);
    localStorage.setItem(PENDING_OPS_KEY, JSON.stringify(queue));
    return true;
  }
  
  storeReviewsLocally(reviews) {
    localStorage.setItem('cachedReviews', JSON.stringify(reviews));
  }
  
  getCachedReviews() {
    const cached = localStorage.getItem('cachedReviews');
    return cached ? JSON.parse(cached) : [];
  }

  async getAllReviews(rating = null, sort = 'desc', limit = null) {
    if (!await isOnline()) throw new Error('Offline: cannot fetch reviews');

    let url = API_URL;
    const params = new URLSearchParams();

    if (rating !== null) params.append('rating', rating);
    if (sort) params.append('sort', sort);
    if (limit) params.append('limit', limit);

    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    const response = await fetch(url);
    const data = await response.json();
    return data.reviews;
  }

  async getReview(id) {
    if (!await isOnline()) throw new Error('Offline: cannot fetch review');
    const response = await fetch(`${API_URL}/${id}`);
    const data = await response.json();
    return data.review;
  }

  async getReviewById(reviewId) {
    try {
      const response = await fetch(`/api/movieReviews/${reviewId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch review: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching review by ID:', error);
      throw error;
    }
  }

  async addReview(review) {
    if (!await isOnline()) {
      queueOperation({
        url: API_URL,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review)
      });
      return { ...review, id: Date.now(), offline: true }; // Fake ID
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to add review');
    return data.review;
  }

  async updateReview(review) {
    if (!await isOnline()) {
      queueOperation({
        url: `${API_URL}/${review.id}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review)
      });
      return review;
    }

    const response = await fetch(`${API_URL}/${review.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update review');
    return data.review;
  }

  async deleteReview(id) {
    if (!await isOnline()) {
      queueOperation({
        url: `${API_URL}/${id}`,
        method: 'DELETE',
        headers: {}
      });
      return { id, deleted: true };
    }

    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete review');
    return data.review;
  }

  async resetReviews() {
    if (!await isOnline()) throw new Error('Offline: cannot reset reviews');

    const response = await fetch(`${API_URL}/reset`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to reset reviews');
    return data.message;
  }

  async syncPendingReviews() {
    await syncPending();
  }

  // Add WebSocket methods
  connectSocket() {
    if (this.socket) return this.socket;
    
    this.socket = io('http://localhost:3000'); // !!!???
    
    console.log('WebSocket connection established');
    return this.socket;
  }
  
  onNewReview(callback) {
    const socket = this.connectSocket();
    socket.on('newReview', callback);
    this.socketListeners.push({ event: 'newReview', callback });
    return () => socket.off('newReview', callback);
  }
  
  onReviewUpdated(callback) {
    const socket = this.connectSocket();
    socket.on('reviewUpdated', callback);
    this.socketListeners.push({ event: 'reviewUpdated', callback });
    return () => socket.off('reviewUpdated', callback);
  }
  
  onReviewDeleted(callback) {
    const socket = this.connectSocket();
    socket.on('reviewDeleted', callback);
    this.socketListeners.push({ event: 'reviewDeleted', callback });
    return () => socket.off('reviewDeleted', callback);
  }
  
  onReviewStats(callback) {
    const socket = this.connectSocket();
    socket.on('reviewStats', callback);
    this.socketListeners.push({ event: 'reviewStats', callback });
    return () => socket.off('reviewStats', callback);
  }
  
  disconnectSocket() {
    if (this.socket) {
      this.socketListeners.forEach(({ event, callback }) => {
        this.socket.off(event, callback);
      });
      this.socket.disconnect();
      this.socket = null;
      this.socketListeners = [];
      console.log('WebSocket disconnected');
    }
  }
}

const reviewApiService = new ReviewApiService();
export default reviewApiService;
