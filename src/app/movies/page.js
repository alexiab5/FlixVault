"use client";

import { useEffect, useState } from 'react';
import MovieCard from '../components/MovieCard';

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);

  // Fetch movies from the API route
  useEffect(() => {
    async function fetchMovies() {
      const response = await fetch('/api/movies');
      if (response.ok) {
        const data = await response.json();
        console.log(data);  // Log the fetched data to check what you’re getting
        setMovies(data);
      } else {
        console.error('Failed to fetch movies');
      }
    }
    fetchMovies();
  }, []);

  return (
    <div>
      <h1>All Movies</h1>
      <div className="movies-list">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}
