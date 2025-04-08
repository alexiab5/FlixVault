import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { initSocketServer } from './server/socket-handler.js';
import { reviewsStore } from './lib/apiStore.js';

// Create Express app and HTTP server
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO with the HTTP server
const io = initSocketServer(httpServer);

// Middleware
app.use(cors());
app.use(express.json());

// Import AFTER socket server is initialized
import { startReviewGenerator } from './server/reviewGenerator.js';

// Get a single review by ID
app.get('/api/movieReviews', (req, res) => {
  res.json(reviewsStore.getReviews());
});

app.get('/api/movieReviews/:id', (req, res) => {
  const review = reviewsStore.getReviewById(parseInt(req.params.id));
  if (review) {
    res.json(review);
  } else {
    res.status(404).json({ error: 'Review not found' });
  }
});

// Create a new review
app.post('/api/movieReviews', (req, res) => {
  const newReview = req.body;
  const review = reviewsStore.addReview(newReview);
  
  // Notify connected clients about the new review
  io.emit('newReview', review);
  
  // Update stats
  const stats = calculateReviewStats(reviewsStore.getReviews());
  io.emit('reviewStats', stats);
  
  res.status(201).json(review);
});

// Update an existing review
app.put('/api/movieReviews/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const updatedData = req.body;
  const updatedReview = reviewsStore.updateReview(id, updatedData);

  if (updatedReview) {
    // Notify clients if needed (optional: 'reviewUpdated' event)
    io.emit('reviewUpdated', updatedReview);

    // Update stats
    const stats = calculateReviewStats(reviewsStore.getReviews());
    io.emit('reviewStats', stats);

    res.json(updatedReview);
  } else {
    res.status(404).json({ error: 'Review not found' });
  }
});

// Delete a review
app.delete('/api/movieReviews/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const deleted = reviewsStore.deleteReview(id);

  if (deleted) {
    // Notify clients about deletion
    io.emit('reviewDeleted', id);

    // Update stats
    const stats = calculateReviewStats(reviewsStore.getReviews());
    io.emit('reviewStats', stats);

    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Review not found' });
  }
});

// Start the background review generator
const GENERATE_INTERVAL = 10000; // Generate a review every 30 seconds
startReviewGenerator(GENERATE_INTERVAL);

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});