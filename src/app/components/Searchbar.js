"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const searchMovies = async () => {
      if (query.length >= 2) {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`);
          const data = await response.json();
          setResults(data.movies || []);
          setIsOpen(true);
        } catch (error) {
          console.error('Error searching movies:', error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    };

    const debounceTimer = setTimeout(searchMovies, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSelectMovie = (movieId) => {
    setIsOpen(false);
    router.push(`/diary?selectedMovie=${movieId}`);
  };

  return (
    <div className="w-full max-w-md mx-auto relative" ref={searchRef}>
      <h2 className="text-2xl text-white text-center mb-4">I watched...</h2>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a movie..."
        className="w-full p-3 rounded-md bg-white/20 backdrop-blur-sm text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
      />

      {isLoading && (
        <div className="absolute w-full mt-2 p-3 bg-black/30 backdrop-blur-md rounded-md text-white text-center">
          Searching...
        </div>
      )}

      {isOpen && !isLoading && results.length > 0 && (
        <div className="absolute w-full mt-2 bg-black/30 backdrop-blur-md rounded-md overflow-hidden z-10">
          <div className="max-h-[300px] overflow-y-auto">
            {results.map((movie) => (
              <div
                key={movie.id}
                onClick={() => handleSelectMovie(movie.id)}
                className="p-3 hover:bg-white/10 cursor-pointer text-white border-b border-white/10 last:border-b-0"
              >
                {movie.title} ({new Date(movie.releaseDate).getFullYear()})
                {movie.director && ` - ${movie.director}`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
