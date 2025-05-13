import { NextResponse } from 'next/server';
import movieReviews from '../lib/reviews';
import { withAuditLog } from '../../../middleware/auditLogMiddleware';

// In-memory data store
let reviews = [...movieReviews];

// GET handler for both all reviews and single review
export const GET = withAuditLog(
  async (request, context) => {
    // If we have params, it's a single review request
    if (context?.params?.id) {
      const { id } = context.params;
      const review = reviews.find(review => review.id === id);
      
      if (!review) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 });
      }
      
      return NextResponse.json({ review });
    }
    
    // Otherwise, it's a list request
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
  },
  'Review',
  (request, context) => context?.params?.id || 'all'
);

// POST handler for both new reviews and reset
export const POST = withAuditLog(
  async (request) => {
    if (request.url.endsWith('/reset')) {
      reviews = [...movieReviews];
      return NextResponse.json({ message: 'Reviews reset successfully' });
    }
    
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
  },
  'Review',
  async (request) => {
    if (request.url.endsWith('/reset')) {
      return 'reset';
    }
    const review = await request.json();
    return review.id;
  }
);

// PUT (update) an existing review
export const PUT = withAuditLog(
  async (request, { params }) => {
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
  },
  'Review',
  (request, { params }) => params.id
);

// DELETE a review
export const DELETE = withAuditLog(
  async (request, { params }) => {
    const { id } = params;
    const reviewIndex = reviews.findIndex(review => review.id === id);
    
    if (reviewIndex === -1) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    
    // Remove the review
    const deletedReview = reviews[reviewIndex];
    reviews = reviews.filter(review => review.id !== id);
    
    return NextResponse.json({ review: deletedReview });
  },
  'Review',
  (request, { params }) => params.id
);