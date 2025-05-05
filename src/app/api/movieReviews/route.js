import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// For now, we'll use a default user ID until authentication is implemented
const DEFAULT_USER_ID = '1'; // This should match one of the user IDs from your seed data

// Get the default user ID
async function getDefaultUserId() {
  const defaultUser = await prisma.user.findUnique({
    where: { email: 'default@example.com' }
  });
  return defaultUser?.id;
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const rating = url.searchParams.get('rating');
    const sort = url.searchParams.get('sort') || 'desc';
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')) : undefined;
    
    const reviews = await db.getAllReviews({ rating, sort, limit });
    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const reviewData = await request.json();
    
    // Validate review data
    if (!reviewData.movieId || !reviewData.rating || !reviewData.content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the default user ID
    const defaultUserId = await getDefaultUserId();
    if (!defaultUserId) {
      return NextResponse.json({ error: 'Default user not found. Please run the database seed.' }, { status: 500 });
    }

    // Get movie details
    const movie = await prisma.movie.findUnique({
      where: { id: reviewData.movieId },
      include: { genres: { include: { genre: true } } }
    });

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    // Create the review in the database
    const newReview = await db.createReview({
      rating: reviewData.rating,
      content: reviewData.content,
      movieId: reviewData.movieId,
      userId: defaultUserId
    });

    // Format the review with movie details for the UI
    const formattedReview = {
      ...newReview,
      movie: movie.title,
      released: new Date(movie.releaseDate).getFullYear(),
      poster: movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : "/placeholder.svg",
      year: new Date().getFullYear(),
      month: new Date().toLocaleString("default", { month: "short" }).toUpperCase(),
      day: String(new Date().getDate()).padStart(2, "0"),
      genres: movie.genres.map(mg => mg.genre.name)
    };

    return NextResponse.json({ review: formattedReview }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}