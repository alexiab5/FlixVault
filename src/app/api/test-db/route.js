import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET() {
  try {
    // Try to get the count of movies
    const movieCount = await db.getMovieCount();
    const reviewCount = await db.getReviewCount();
    const userCount = await db.getUserCount();
    const genreCount = await db.getGenreCount();

    return NextResponse.json({
      status: 'success',
      data: {
        movieCount,
        reviewCount,
        userCount,
        genreCount
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
} 