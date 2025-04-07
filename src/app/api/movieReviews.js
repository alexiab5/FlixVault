import { NextResponse } from 'next/server';
import movieReviews from '../lib/reviews';

// In-memory data store
let reviews = [...movieReviews];

// GET all reviews
export async function GET(request) {
  const url = new URL(request.url);
  const rating = url.searchParams.get('rating');
  const sort = url.searchParams.get('sort') || 'desc';
  const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')) : null;
  
  let filteredReviews = [...reviews];
  
  // Filter by rating if provided
  if (rating !== null) {
    filteredReviews = filteredReviews.filter(review => review.rating === parseInt(rating));
  }
  
  // Sort reviews by date
  filteredReviews.sort((a, b) => {
    const dateA = new Date(a.year, new Date(Date.parse(a.month + " 1, 2000")).getMonth(), a.day);
    const dateB = new Date(b.year, new Date(Date.parse(b.month + " 1, 2000")).getMonth(), b.day);
    return sort === 'desc' ? dateB - dateA : dateA - dateB;
  });
  
  // Apply limit if specified
  if (limit) {
    filteredReviews = filteredReviews.slice(0, limit);
  }
  
  return NextResponse.json({ reviews: filteredReviews });
}

// GET a single review by ID
export async function GET(request, { params }) {
  const { id } = params;
  const review = reviews.find(review => review.id === id);
  
  if (!review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }
  
  return NextResponse.json({ review });
}

// POST a new review
export async function POST(request) {
  try {
    const newReview = await request.json();
    
    // Validate review data
    if (!newReview.id || !newReview.movie || !newReview.rating || 
        !newReview.year || !newReview.month || !newReview.day || 
        !newReview.released || !newReview.poster) {
      return NextResponse.json({ error: 'Invalid review data' }, { status: 400 });
    }
    
    // Check for duplicate ID
    if (reviews.some(review => review.id === newReview.id)) {
      return NextResponse.json({ error: 'Review with this ID already exists' }, { status: 409 });
    }
    
    // Add new review to the beginning of the array
    reviews = [newReview, ...reviews];
    
    return NextResponse.json({ review: newReview }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
  }
}

// PUT (update) an existing review
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const updatedReview = await request.json();
    
    // Validate review data
    if (!updatedReview.id || !updatedReview.movie || !updatedReview.rating || 
        !updatedReview.year || !updatedReview.month || !updatedReview.day || 
        !updatedReview.released || !updatedReview.poster) {
      return NextResponse.json({ error: 'Invalid review data' }, { status: 400 });
    }
    
    // Ensure IDs match
    if (updatedReview.id !== id) {
      return NextResponse.json({ error: 'Review ID mismatch' }, { status: 400 });
    }
    
    // Find and update the review
    const reviewIndex = reviews.findIndex(review => review.id === id);
    
    if (reviewIndex === -1) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    
    reviews[reviewIndex] = updatedReview;
    
    return NextResponse.json({ review: updatedReview });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
  }
}

// DELETE a review
export async function DELETE(request, { params }) {
  const { id } = params;
  const reviewIndex = reviews.findIndex(review => review.id === id);
  
  if (reviewIndex === -1) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }
  
  // Remove the review
  const deletedReview = reviews[reviewIndex];
  reviews = reviews.filter(review => review.id !== id);
  
  return NextResponse.json({ review: deletedReview });
}

// Reset all reviews to initial state
export async function POST(request) {
  if (request.url.endsWith('/reset')) {
    reviews = [...movieReviews];
    return NextResponse.json({ message: 'Reviews reset successfully' });
  }
  
  // Handle regular POST requests
  return POST(request);
}