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

export const reviewApiService = {
  // Simple server check
  async isServerReachable() {
    if (!navigator.onLine) return false;
    try {
      const response = await fetch("/api/ping", { method: "GET" });
      return response.ok;
    } catch (err) {
      return false;
    }
  },

  queueOperation(op) {
    const queue = JSON.parse(localStorage.getItem(PENDING_OPS_KEY)) || [];
    queue.push(op);
    localStorage.setItem(PENDING_OPS_KEY, JSON.stringify(queue));
    return true;
  },
  
  storeReviewsLocally(reviews) {
    localStorage.setItem('cachedReviews', JSON.stringify(reviews));
  },
  
  getCachedReviews() {
    const cached = localStorage.getItem('cachedReviews');
    return cached ? JSON.parse(cached) : [];
  },

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
  },

  async getReview(id) {
    if (!await isOnline()) throw new Error('Offline: cannot fetch review');
    const response = await fetch(`${API_URL}/${id}`);
    const data = await response.json();
    return data.review;
  },

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
  },

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
  },

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
  },

  async resetReviews() {
    if (!await isOnline()) throw new Error('Offline: cannot reset reviews');

    const response = await fetch(`${API_URL}/reset`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to reset reviews');
    return data.message;
  },

  async syncPendingReviews() {
    await syncPending();
  }
};
