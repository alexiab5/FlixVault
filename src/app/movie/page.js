"use client";

import { useParams } from "next/navigation";
import { getMovieById } from "@/lib/movie-data"; 

export default function MovieDetailPage() {
  const { id } = useParams(); // Get the movie ID from the URL
  const movie = getMovieById(id); // Get movie details from in-memory database

  if (!movie) {
    return <div className="text-white text-center">Movie not found</div>;
  }

  return (
    <div className="text-white text-center p-6">
      <h1 className="text-4xl font-bold">{movie.title}</h1>
      <p className="text-lg">{movie.year} - Directed by {movie.director}</p>
      <img src={movie.posterUrl} alt={movie.title} className="mx-auto mt-4 rounded-lg shadow-lg" />
    </div>
  );
}
