import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre');
    const year = searchParams.get('year');
    const minRating = searchParams.get('minRating');

    // Build the where clause
    const where = {};
    if (genre) {
      where.genres = {
        some: {
          genre: {
            name: genre
          }
        }
      };
    }
    if (year) {
      where.releaseDate = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${parseInt(year) + 1}-01-01`)
      };
    }
    if (minRating) {
      where.voteAverage = {
        gte: parseFloat(minRating)
      };
    }

    // Execute optimized query with proper indexing
    const statistics = await prisma.movie.findMany({
      where,
      select: {
        id: true,
        title: true,
        voteAverage: true,
        releaseDate: true,
        _count: {
          select: {
            reviews: true
          }
        },
        reviews: {
          select: {
            rating: true,
            likes: true
          }
        },
        genres: {
          select: {
            genre: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        voteAverage: 'desc'
      },
      take: 100
    });

    // Process and aggregate the results
    const processedStats = statistics.map(movie => ({
      id: movie.id,
      title: movie.title,
      voteAverage: movie.voteAverage,
      releaseDate: movie.releaseDate,
      reviewCount: movie._count.reviews,
      averageRating: movie.reviews.reduce((acc, review) => acc + review.rating, 0) / movie.reviews.length || 0,
      totalLikes: movie.reviews.reduce((acc, review) => acc + review.likes, 0),
      genres: movie.genres.map(g => g.genre.name)
    }));

    return NextResponse.json({
      success: true,
      data: processedStats
    });
  } catch (error) {
    console.error('Error fetching movie statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch movie statistics' },
      { status: 500 }
    );
  }
} 