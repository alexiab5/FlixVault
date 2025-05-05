import { NextResponse } from 'next/server';
import { tmdbService } from '../../../../lib/tmdb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const movies = await tmdbService.searchMovies(query);
    return NextResponse.json({ movies });
  } catch (error) {
    console.error('Error searching movies:', error);
    return NextResponse.json({ error: 'Failed to search movies' }, { status: 500 });
  }
} 