import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { tmdbService } from '../../../../lib/tmdb';
import { getUserFromToken } from '../../../../lib/auth';

export async function GET(request, context) {
  try {
    const { id } = await context.params;
    const token = request.cookies.get('token')?.value;
    let userId = null;

    if (token) {
      const user = await getUserFromToken(token);
      if (user) {
        userId = user.id;
      }
    }
    
    // First try to get the movie from our database with all related data in a single query
    let movie = await db.getMovieByTmdbId(id, userId);
    
    // If not found, fetch from TMDB and save to our database
    if (!movie) {
      const tmdbMovie = await tmdbService.getMovieDetails(parseInt(id));
      if (!tmdbMovie) {
        return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
      }

      // Save the movie to our database
      movie = await db.createMovie({
        id: tmdbMovie.id.toString(),
        tmdbId: tmdbMovie.id,
        title: tmdbMovie.title,
        director: tmdbMovie.director,
        releaseDate: new Date(tmdbMovie.releaseDate),
        posterPath: tmdbMovie.posterPath,
        language: tmdbMovie.language,
        voteAverage: tmdbMovie.voteAverage,
        genres: tmdbMovie.genres.map(g => g.tmdbId.toString())
      });
    }

    // Get reviews for this movie with user details in a single query
    const reviews = await db.getAllReviews({ 
      movieId: movie.id,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json({ movie, reviews });
  } catch (error) {
    console.error('Error fetching movie:', error);
    return NextResponse.json({ error: 'Failed to fetch movie' }, { status: 500 });
  }
} 