"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

// In-memory movie database
const movies = [
  {
    id: "glass-onion",
    title: "Glass Onion",
    year: 2022,
    director: "Rian Johnson",
    posterUrl: "/placeholder.svg?height=400&width=300",
  },
  {
    id: "gladiator",
    title: "Gladiator",
    year: 2000,
    director: "Ridley Scott",
    posterUrl: "/placeholder.svg?height=400&width=300",
  },
  {
    id: "gladiator-ii",
    title: "Gladiator II",
    year: 2024,
    director: "Ridley Scott",
    posterUrl: "/placeholder.svg?height=400&width=300",
  },
  {
    id: "glass",
    title: "Glass",
    year: 2019,
    director: "M. Night Shyamalan",
    posterUrl: "/placeholder.svg?height=400&width=300",
  },
];

function searchMovies(query) {
  if (!query) return [];

  const lowercaseQuery = query.toLowerCase();
  return movies.filter(
    (movie) =>
      movie.title.toLowerCase().includes(lowercaseQuery) ||
      movie.director.toLowerCase().includes(lowercaseQuery)
  );
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
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
    if (query.length >= 2) {
      const filteredMovies = searchMovies(query);
      setResults(filteredMovies);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);

  const handleSelectMovie = (movieId) => {
    setIsOpen(false);
    router.push(`/movie/${movieId}`);
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

      {isOpen && results.length > 0 && (
        <div className="absolute w-full mt-2 bg-black/30 backdrop-blur-md rounded-md overflow-hidden z-10">
          {results.map((movie) => (
            <div
              key={movie.id}
              onClick={() => handleSelectMovie(movie.id)}
              className="p-3 hover:bg-white/10 cursor-pointer text-white"
            >
              {movie.title} ({movie.year}) - {movie.director}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
