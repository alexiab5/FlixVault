import { Server } from 'socket.io';
import { reviewsStore } from '../lib/apiStore.js'; 

let io;

export function initSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:3001',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected');
    
    // Send initial data
    socket.emit('initialReviews', reviewsStore.getAll());
    
    // Send initial stats
    const stats = calculateReviewStats(reviewsStore.getAll());
    socket.emit('reviewStats', stats);
    
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  return io;
}

export function getSocketIO() {
  if (!io) {
    throw new Error('Socket.IO has not been initialized');
  }
  return io;
}

// Helper function to calculate review statistics
export function calculateReviewStats(reviews) {
  // Rating distribution (1-5 stars)
  const ratingCounts = [0, 0, 0, 0, 0];
  
  // Year distribution
  const yearDistribution = {};
  
  reviews.forEach(review => {
    // Count ratings
    if (review.rating >= 1 && review.rating <= 5) {
      ratingCounts[review.rating - 1]++;
    }
    
    // Count years
    const year = review.released;
    if (year) {
      yearDistribution[year] = (yearDistribution[year] || 0) + 1;
    }
  });
  
  return {
    ratingDistribution: ratingCounts,
    yearDistribution,
    totalReviews: reviews.length
  };
}