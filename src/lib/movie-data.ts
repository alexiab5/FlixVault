export interface Movie {
    id: string
    title: string
    year: number
    director: string
    posterUrl: string
  }
  
  // In-memory movie database
  export const movies: Movie[] = [
  {
    id: "glass-onion",
    title: "Glass Onion",
    year: 2022,
    director: "Rian Johnson",
    posterUrl: "/images/movies/GlassOnion.jpg",
  },
  {
    id: "gladiator",
    title: "Gladiator",
    year: 2000,
    director: "Ridley Scott",
    posterUrl: "/images/movies/Gladiator.jpg",
  },
  {
    id: "gladiator-ii",
    title: "Gladiator II",
    year: 2024,
    director: "Ridley Scott",
    posterUrl: "/images/movies/GladiatorII.jpg",
  },
  {
    id: "glass",
    title: "Glass",
    year: 2019,
    director: "M. Night Shyamalan",
    posterUrl: "/placeholder.svg",
  },
  ]
  
  // Function to search movies by query
  export function searchMovies(query: string): Movie[] {
    if (!query) return []
  
    const lowercaseQuery = query.toLowerCase()
    return movies.filter(
      (movie) =>
        movie.title.toLowerCase().includes(lowercaseQuery) || movie.director.toLowerCase().includes(lowercaseQuery),
    )
  }
  
  // Function to get a movie by ID
  export function getMovieById(id: string): Movie | undefined {
    return movies.find((movie) => movie.id === id)
  }