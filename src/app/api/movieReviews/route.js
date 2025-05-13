import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { PrismaClient } from '@prisma/client';
import { getUserFromToken } from '../../../lib/auth';

const prisma = new PrismaClient();

// Get the default user ID
async function getDefaultUserId() {
  const defaultUser = await prisma.user.findUnique({
    where: { email: 'default@example.com' }
  });
  if (!defaultUser) {
    throw new Error('Default user not found. Please run the database seed.');
  }
  return defaultUser.id;
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const ratingParam = url.searchParams.get('rating');
    const ratings = ratingParam ? ratingParam.split(',').map(r => parseInt(r)).filter(r => !isNaN(r)) : [];
    const sort = url.searchParams.get('sort') || 'desc';
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;
    
    console.log(`API: Fetching reviews - page: ${page}, limit: ${limit}, skip: ${skip}, sort: ${sort}, ratings: ${ratings}`);
    
    // Get user ID from token
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Get total count for pagination
    const totalCount = await prisma.review.count({
      where: {
        userId: user.id,
        ...(ratings.length > 0 ? { rating: { in: ratings } } : {})
      }
    });
    
    console.log(`API: Total reviews count: ${totalCount}`);
    
    const reviews = await prisma.review.findMany({ 
      where: {
        userId: user.id,
        ...(ratings.length > 0 ? { rating: { in: ratings } } : {})
      },
      orderBy: {
        createdAt: sort === 'desc' ? 'desc' : 'asc'
      },
      skip,
      take: limit,
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            posterPath: true,
            releaseDate: true,
            genres: {
              include: {
                genre: true
              }
            }
          }
        }
      }
    });

    console.log(`API: Fetched ${reviews.length} reviews for page ${page}`);

    // Format the reviews to include proper poster URLs
    const formattedReviews = reviews.map(review => ({
      ...review,
      movie: {
        ...review.movie,
        posterPath: review.movie.posterPath 
          ? (review.movie.posterPath.startsWith('http') 
              ? review.movie.posterPath 
              : `https://image.tmdb.org/t/p/w500${review.movie.posterPath}`)
          : "/placeholder.svg"
      }
    }));

    const response = {
      reviews: formattedReviews,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    };

    console.log('API: Pagination info:', response.pagination);

    return NextResponse.json(response);
  } catch (error) {
    console.error('API Error fetching reviews:', error);
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

    // Get user ID from token
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
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
      userId: user.id
    });

    // Fetch the complete review with movie details
    const completeReview = await prisma.review.findUnique({
      where: { id: newReview.id },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            posterPath: true,
            releaseDate: true,
            genres: {
              include: {
                genre: true
              }
            }
          }
        }
      }
    });

    // Format the review to include proper poster URL
    const formattedReview = {
      ...completeReview,
      movie: {
        ...completeReview.movie,
        posterPath: completeReview.movie.posterPath 
          ? (completeReview.movie.posterPath.startsWith('http') 
              ? completeReview.movie.posterPath 
              : `https://image.tmdb.org/t/p/w500${completeReview.movie.posterPath}`)
          : "/placeholder.svg"
      }
    };

    return NextResponse.json({ review: formattedReview }, { status: 201 });
  } catch (error) {
    console.error('API Error creating review:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}