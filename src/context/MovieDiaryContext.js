"use client";

import { createContext, useContext, useState } from "react";

const MovieDiaryContext = createContext();

export function MovieDiaryProvider({ children }) {
  const [movies, setMovies] = useState([]);

  const addMovie = (newMovie) => {
    setMovies((prevMovies) => [newMovie, ...prevMovies]);
  };

  return (
    <MovieDiaryContext.Provider value={{ movies, addMovie }}>
      {children}
    </MovieDiaryContext.Provider>
  );
}

export function useMovieDiary() {
  return useContext(MovieDiaryContext);
}
