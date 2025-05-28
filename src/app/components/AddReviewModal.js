"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useReviewDiary } from "../../context/ReviewDiaryContext"
import devLog from '../../lib/devLog'

export default function AddReviewModal({ movieId, onClose, onReviewAdded }) {
  const [movie, setMovie] = useState(null)
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const { addReview } = useReviewDiary()

  // Fetch movie details when component mounts
  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/movies/${movieId}`);
        if (!response.ok) throw new Error('Failed to fetch movie details');
        const data = await response.json();
        
        // Ensure we have valid data before proceeding
        if (!data.movie) {
          throw new Error('Movie data is missing');
        }

        // Only cache essential review data
        const reviewsToCache = data.movie.reviews?.map(review => ({
          id: review.id,
          rating: review.rating,
          content: review.content,
          createdAt: review.createdAt
        })) || [];
        
        setMovie({
          ...data.movie,
          reviews: data.movie.reviews || []
        });
        
        // Cache only essential review data
        try {
          const cachedReviews = JSON.parse(localStorage.getItem('cachedReviews') || '{}');
          // Keep only the last 5 movies' reviews
          const keys = Object.keys(cachedReviews);
          if (keys.length > 5) {
            // Remove oldest entries
            const oldestKeys = keys.slice(0, keys.length - 5);
            oldestKeys.forEach(key => delete cachedReviews[key]);
          }
          cachedReviews[movieId] = reviewsToCache;
          localStorage.setItem('cachedReviews', JSON.stringify(cachedReviews));
        } catch (e) {
          devLog.warn('Failed to cache reviews:', e);
          // If caching fails, clear the cache and try again with just the current movie
          try {
            localStorage.setItem('cachedReviews', JSON.stringify({
              [movieId]: reviewsToCache
            }));
          } catch (e2) {
            devLog.warn('Failed to cache reviews even after clearing:', e2);
          }
        }
      } catch (error) {
        devLog.error('Error fetching movie details:', error);
        setError("Failed to load movie details. Please try again.")
      } finally {
        setIsLoading(false);
      }
    }

    if (movieId) {
      fetchMovieDetails()
    }
  }, [movieId])

  // Close modal if Escape key is pressed
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleEscKey)
    return () => window.removeEventListener("keydown", handleEscKey)
  }, [onClose])

  const handleRatingChange = (newRating) => {
    setRating(newRating)
    setError("")
  }

  const validateReview = () => {
    if (!reviewText.trim()) {
      setError("Please write your review")
      return false
    }
    if (rating === 0) {
      setError("Please select a rating")
      return false
    }
    if (reviewText.length > 1000) {
      setError("Review must not exceed 1000 characters")
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateReview()) return;

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/movieReviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          movieId: movie.id,
          rating,
          content: reviewText.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add review");
      }

      const data = await response.json();
      
      if (data.review) {
        // Format the review data to match the expected structure
        const formattedReview = {
          ...data.review,
          movie: {
            title: movie.title,
            posterPath: movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : "/placeholder.svg",
            releaseDate: movie.releaseDate,
            genres: movie.genres || []
          },
          createdAt: new Date().toISOString()
        };
        
        // Call onReviewAdded with the formatted review data
        if (onReviewAdded) {
          await onReviewAdded(formattedReview);
        }
      } else {
        throw new Error("Invalid review data received from server");
      }
      
      onClose();
    } catch (error) {
      devLog.error("Error adding review:", error);
      setError("Failed to add review. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-lg z-[9999] flex items-center justify-center p-4">
        <div className="bg-pink-200 rounded-3xl p-8 w-full max-w-5xl relative shadow-2xl border border-pink-300">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-pink-800">Loading movie details...</h2>
          </div>
        </div>
      </div>
    )
  }

  if (!movie) return null

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-lg z-[9999] flex items-center justify-center p-4">
      <div className="bg-pink-200 rounded-3xl p-4 md:p-8 w-full max-w-5xl relative shadow-2xl border border-pink-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 bg-pink-300 hover:bg-pink-400 text-pink-800 rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center transition-colors cursor-pointer"
        >
          ✕
        </button>

        {/* Movie title and details */}
        <div className="text-center mb-4 md:mb-6">
          <h3 className="text-xl md:text-2xl font-bold text-pink-800 mb-2">
            {movie.title} ({new Date(movie.releaseDate).getFullYear()})
          </h3>
          {movie.director && (
            <p className="text-xs md:text-sm text-pink-700 mb-1">
              Directed by {movie.director}
            </p>
          )}
          {movie.genres && movie.genres.length > 0 && (
            <p className="text-xs md:text-sm text-pink-700">
              {movie.genres.map(g => g.genre?.name || g.name).join(', ')}
            </p>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
          {/* Movie poster and rating */}
          <div className="w-full md:w-1/3 flex flex-col items-center">
            <div className="w-32 h-48 md:w-48 md:h-72 overflow-hidden rounded-xl shadow-lg border-2 border-pink-300">
              <Image
                src={movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : "/placeholder.svg"}
                alt={movie.title}
                width={192}
                height={288}
                className="object-cover w-full h-full"
              />
            </div>

            {/* Rating */}
            <div className="mt-4 md:mt-6 flex flex-col items-center">
              <span className="text-pink-800 text-base md:text-lg font-medium mb-2">Rating</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatingChange(star)}
                    className="text-3xl md:text-4xl focus:outline-none cursor-pointer px-1"
                  >
                    <span
                      className={star <= rating ? "text-pink-500" : "text-pink-300"}
                      style={{ fontSize: "1.5rem" }}
                    >
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Review text */}
          <div className="w-full md:w-2/3">
            <textarea
              value={reviewText}
              onChange={(e) => {
                setReviewText(e.target.value)
                setError("")
              }}
              className="w-full h-48 md:h-72 p-4 rounded-xl bg-pink-100 text-pink-900 placeholder-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-400 border border-pink-300 shadow-inner text-sm md:text-base"
              placeholder="Write your review here..."
            />
            {error && (
              <p className="text-red-600 text-xs md:text-sm mt-2">{error}</p>
            )}
            <p className="text-pink-700 text-xs md:text-sm mt-2">
              {reviewText.length}/1000 characters
            </p>
          </div>
        </div>

        {/* Add entry button */}
        <div className="mt-6 md:mt-8 flex justify-center">
          <button
            onClick={handleSubmit}
            className="bg-pink-500 hover:bg-pink-600 text-white text-base md:text-lg font-medium py-2 md:py-2.5 px-8 md:px-14 rounded-full shadow-lg transition-colors duration-300 cursor-pointer"
          >
            Add to Diary
          </button>
        </div>
      </div>
    </div>
  )
}
