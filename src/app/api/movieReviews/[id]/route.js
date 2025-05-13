// This file handles routes for individual reviews: GET, PUT, DELETE

import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { PrismaClient } from '@prisma/client';
import { getUserFromToken } from '../../../../lib/auth';

const prisma = new PrismaClient();

// Get the default user ID
async function getDefaultUserId() {
  const defaultUser = await prisma.user.findUnique({
    where: { email: 'default@example.com' }
  });
  return defaultUser?.id;
}

export async function GET(request, { params }) {
  try {
    const id = params.id;
    const review = await db.getReviewById(id);

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const id = params.id;
    const updatedData = await request.json();
    
    // Validate review data
    if (!updatedData.rating || !updatedData.content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user ID from token
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the existing review to ensure it exists and get movie details
    const existingReview = await prisma.review.findUnique({
      where: { id },
      include: {
        movie: {
          include: {
            genres: {
              include: {
                genre: true
              }
            }
          }
        }
      }
    });

    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Check if the user owns the review
    if (existingReview.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to update this review' }, { status: 403 });
    }

    // Update the review
    const updated = await db.updateReview(id, {
      rating: updatedData.rating,
      content: updatedData.content
    }, user.id, user.role);

    // Format the review with movie details for the UI
    const formattedReview = {
      ...updated,
      movie: existingReview.movie.title,
      released: new Date(existingReview.movie.releaseDate).getFullYear(),
      poster: existingReview.movie.posterPath ? `https://image.tmdb.org/t/p/w500${existingReview.movie.posterPath}` : "/placeholder.svg",
      year: new Date().getFullYear(),
      month: new Date().toLocaleString("default", { month: "short" }).toUpperCase(),
      day: String(new Date().getDate()).padStart(2, "0"),
      genres: existingReview.movie.genres.map(mg => mg.genre.name)
    };

    return NextResponse.json({ review: formattedReview });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = params.id;
    
    // Get user ID from token
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the review to check ownership and get movie details
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        movie: {
          include: {
            genres: {
              include: {
                genre: true
              }
            }
          }
        }
      }
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Check if the user owns the review
    if (review.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this review' }, { status: 403 });
    }

    // Delete the review
    await db.deleteReview(id, user.id, user.role);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}