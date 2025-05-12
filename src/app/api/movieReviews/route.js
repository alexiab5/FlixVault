import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { PrismaClient } from '@prisma/client';

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
    const ratings = url.searchParams.getAll('rating').map(r => parseInt(r));
    const sort = url.searchParams.get('sort') || 'desc';
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;
    
    console.log(`API: Fetching reviews - page: ${page}, limit: ${limit}, skip: ${skip}, sort: ${sort}, ratings: ${ratings}`);
    
    // Get the default user ID
    const defaultUserId = await getDefaultUserId();
    
    // Get total count for pagination, only for default user
    const totalCount = await prisma.review.count({
      where: {
        userId: defaultUserId,
        ...(ratings.length > 0 ? { rating: { in: ratings } } : {})
      }
    });
    
    console.log(`API: Total reviews count: ${totalCount}`);
    
    const reviews = await prisma.review.findMany({ 
      where: {
        userId: defaultUserId,
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

    // Get the default user ID
    const defaultUserId = await getDefaultUserId();

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