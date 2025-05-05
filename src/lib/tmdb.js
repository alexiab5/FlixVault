const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export const tmdbService = {
  async searchMovies(query) {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      return data.results.map(movie => ({
        id: movie.id.toString(),
        tmdbId: movie.id,
        title: movie.title,
        director: '', // We'll need a separate call to get director
        releaseDate: movie.release_date,
        posterPath: movie.poster_path,
        language: movie.original_language,
        voteAverage: movie.vote_average,
        overview: movie.overview
      }));
    } catch (error) {
      console.error('Error searching movies:', error);
      return [];
    }
  },

  async getMovieDetails(tmdbId) {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits`
      );
      const data = await response.json();
      
      // Find the director from credits
      const director = data.credits.crew.find(person => person.job === 'Director')?.name || '';

      return {
        id: data.id.toString(),
        tmdbId: data.id,
        title: data.title,
        director,
        releaseDate: data.release_date,
        posterPath: data.poster_path,
        language: data.original_language,
        voteAverage: data.vote_average,
        overview: data.overview,
        genres: data.genres.map(genre => ({
          tmdbId: genre.id,
          name: genre.name
        }))
      };
    } catch (error) {
      console.error('Error fetching movie details:', error);
      return null;
    }
  }
}; 