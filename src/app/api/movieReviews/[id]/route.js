// This file handles routes for individual reviews: GET, PUT, DELETE

import { NextResponse } from 'next/server';
import { reviewsStore } from '../../../../lib/apiStore';
import { reviewApiService } from '../../../../services/reviewApiService';

export async function GET(request, { params }) {
  const { id } = params;
  const review = reviewsStore.getById(id);

  if (!review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  return NextResponse.json({ review });
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const updatedReview = await request.json();
    
    // Validate review data
    if (!updatedReview.id || !updatedReview.movie || !updatedReview.rating || 
        !updatedReview.year || !updatedReview.month || !updatedReview.day || 
        !updatedReview.released || !updatedReview.poster) {
      return NextResponse.json({ error: 'Invalid review data' }, { status: 400 });
    }
    const updated = reviewsStore.update(id, updatedReview);
    return NextResponse.json({ review: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  
  try {
    const deletedReview = reviewsStore.delete(id);
    return NextResponse.json({ review: deletedReview });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}