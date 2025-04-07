const API_URL = '/api/movieReviews';

export const reviewApiService = {
  // Get all reviews with optional filtering and sorting
  async getAllReviews(rating = null, sort = 'desc', limit = null) {
    let url = API_URL;
    const params = new URLSearchParams();
    
    if (rating !== null) {
      params.append('rating', rating);
    }
    
    if (sort) {
      params.append('sort', sort);
    }
    
    if (limit) {
      params.append('limit', limit);
    }
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    return data.reviews;
  },
  
  // Get a single review by ID
  async getReview(id) {
    const response = await fetch(`${API_URL}/${id}`);
    const data = await response.json();
    return data.review;
  },
  
  // Add a new review
  async addReview(review) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(review),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to add review');
    }
    
    return data.review;
  },
  
  // Update an existing review
  async updateReview(review) {
    const response = await fetch(`${API_URL}/${review.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(review),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update review');
    }
    
    return data.review;
  },
  
  // Delete a review
  async deleteReview(id) {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete review');
    }
    
    return data.review;
  },
  
  // Reset all reviews
  async resetReviews() {
    const response = await fetch(`${API_URL}/reset`, {
      method: 'POST',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to reset reviews');
    }
    
    return data.message;
  }
};