"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useReviewDiary } from "../../context/ReviewDiaryContext"

export default function EditReviewModal({ review, onClose, onSave }) {
  const [reviewText, setReviewText] = useState(review?.content || "")
  const [rating, setRating] = useState(review?.rating || 0)
  const [error, setError] = useState("")
  const { updateReview } = useReviewDiary()

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

  const handleSave = async () => {
    setError("")
    if (!validateReview()) return

    try {
      const response = await fetch(`/api/movieReviews/${review.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          content: reviewText.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update review")
      }

      const data = await response.json()
      
      if (data.review) {
        // Get the poster path from the original review
        const originalPosterPath = review.movie?.posterPath || review.poster;
        // Format the poster path with TMDB base URL if it's not already formatted
        const formattedPosterPath = originalPosterPath?.startsWith('http') 
          ? originalPosterPath 
          : originalPosterPath 
            ? `https://image.tmdb.org/t/p/w500${originalPosterPath}`
            : "/placeholder.svg";

        // Preserve the original movie data structure
        const formattedReview = {
          ...data.review,
          movie: {
            ...review.movie,
            title: review.movie?.title || review.movie,
            posterPath: formattedPosterPath,
            releaseDate: review.movie?.releaseDate || new Date(review.released).toISOString(),
            genres: review.movie?.genres || review.genres || []
          }
        }
        
        // Call onSave with the formatted review data
        if (onSave) {
          await onSave(formattedReview)
        }
      } else {
        throw new Error("Invalid review data received from server")
      }
    } catch (error) {
      console.error("Error updating review:", error)
      setError(error.message || "Failed to update review")
    }
  }

  if (!review) return null

  // Extract movie details from the nested object
  const movieTitle = review.movie?.title || review.movie
  const releaseYear = review.movie?.releaseDate ? new Date(review.movie.releaseDate).getFullYear() : review.released
  const director = review.movie?.director || review.director
  const genres = review.movie?.genres?.map(g => g.genre?.name || g.name) || review.genres || []
  const posterPath = review.movie?.posterPath ? `https://image.tmdb.org/t/p/w500${review.movie.posterPath}` : review.poster

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-lg z-[9999] flex items-center justify-center p-4">
      <div className="bg-pink-200 rounded-3xl p-8 w-full max-w-5xl relative shadow-2xl border border-pink-300">
        {/* Modal header with title */}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 bg-pink-300 hover:bg-pink-400 text-pink-800 rounded-full w-10 h-10 flex items-center justify-center transition-colors cursor-pointer"
        >
          ✕
        </button>

        {/* Movie title and details */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-pink-800 mb-2">
            {movieTitle} ({releaseYear})
          </h3>
          {director && (
            <p className="text-sm text-pink-700 mb-1">
              Directed by {director}
            </p>
          )}
          {genres && genres.length > 0 && (
            <p className="text-sm text-pink-700">
              {genres.join(', ')}
            </p>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Movie poster and rating */}
          <div className="w-full md:w-1/3 flex flex-col items-center">
            <div className="w-48 h-72 overflow-hidden rounded-xl shadow-lg border-2 border-pink-300">
              <Image
                src={posterPath || "/placeholder.svg"}
                alt={movieTitle}
                width={192}
                height={288}
                className="object-cover w-full h-full"
              />
            </div>

            {/* Rating */}
            <div className="mt-6 flex flex-col items-center">
              <span className="text-pink-800 text-lg font-medium mb-2">Rating</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatingChange(star)}
                    className="text-4xl focus:outline-none cursor-pointer px-1"
                  >
                    <span
                      className={star <= rating ? "text-pink-500" : "text-pink-300"}
                      style={{ fontSize: "1.75rem" }}
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
              className="w-full h-72 p-4 rounded-xl bg-pink-100 text-pink-900 placeholder-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-400 border border-pink-300 shadow-inner"
              placeholder="Write your review here..."
            />
            {error && (
              <p className="text-red-600 text-sm mt-2">{error}</p>
            )}
            <p className="text-pink-700 text-sm mt-2">
              {reviewText.length}/1000 characters
            </p>
          </div>
        </div>

        {/* Save button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSave}
            className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-6 rounded-full transition-colors cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}