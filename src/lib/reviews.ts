export interface Review {
    movieId: string;
    rating: number;
    reviewText: string;
  }
  
  // Predefined reviews (will not be modified)
  export const reviews: Review[] = [
    {
      movieId: "glass-onion",
      rating: 5,
      reviewText: "A fun and stylish mystery with a sharp social critique.",
    },
    {
      movieId: "gladiator",
      rating: 4,
      reviewText: "Epic storytelling with powerful performances and stunning visuals.",
    },
    {
      movieId: "gladiator-ii",
      rating: 3,
      reviewText: "A decent follow-up, but lacks the emotional weight of the original.",
    },
    {
      movieId: "glass",
      rating: 4,
      reviewText: "A thrilling conclusion to the Unbreakable trilogy, though not without flaws.",
    },
  ];
  