import { NextResponse } from 'next/server';
import { reviewsStore } from '../../../lib/apiStore';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const rating = url.searchParams.get('rating');
    const sort = url.searchParams.get('sort') || 'desc';
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')) : null;
    
    const reviews = reviewsStore.filter({ rating, sort, limit });
    
    return NextResponse.json({ reviews });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const newReview = await request.json();
    
    // Validate review data
    if (!newReview.id || !newReview.movie || !newReview.rating || 
        !newReview.year || !newReview.month || !newReview.day || 
        !newReview.released || !newReview.poster) {
      return NextResponse.json({ error: 'Invalid review data' }, { status: 400 });
    }
    
    try {
      const review = reviewsStore.add(newReview);
      return NextResponse.json({ review }, { status: 201 });
    } catch (storeError) {
      return NextResponse.json({ error: storeError.message }, { status: 409 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
  }
}