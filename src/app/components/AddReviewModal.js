"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useReviewDiary } from "../../context/ReviewDiaryContext"

export default function AddReviewModal({ movieId, onClose }) {
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
        const response = await fetch(`/api/movies/${movieId}`)
        const data = await response.json()
        if (data.movie) {
          setMovie(data.movie)
        }
      } catch (error) {
        console.error('Error fetching movie details:', error)
        setError("Failed to load movie details. Please try again.")
      } finally {
        setIsLoading(false)
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

  const handleAddEntry = async () => {
    if (!movie) return
    setError("")
    if (!validateReview()) return

    try {
      const reviewData = {
        rating: rating,
        content: reviewText,
        movieId: movie.id,
        userId: "DEFAULT_USER_ID" // You should replace this with the actual user ID from your auth system
      }

      await addReview(reviewData)
      onClose()
    } catch (error) {
      setError("Failed to create review. Please try again.")
      console.error('Error creating review:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[9999] flex items-center justify-center">
        <div className="bg-pink-200 rounded-3xl p-8 w-full max-w-3xl max-h-[85vh] overflow-auto relative shadow-2xl border border-pink-300 mx-auto my-auto">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-pink-800">Loading movie details...</h2>
          </div>
        </div>
      </div>
    )
  }

  if (!movie) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[9999] flex items-center justify-center">
      <div className="bg-pink-200 rounded-3xl p-8 w-full max-w-3xl max-h-[85vh] overflow-auto relative shadow-2xl border border-pink-300 mx-auto my-auto">
        {/* Modal header with title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-pink-800">Add Review</h2>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 bg-pink-300 hover:bg-pink-400 text-pink-800 rounded-full w-10 h-10 flex items-center justify-center transition-colors cursor-pointer"
        >
          ✕
        </button>

        {/* Movie title */}
        <h3 className="text-2xl font-bold text-pink-800 mb-2 text-center">
          {movie.title}
        </h3>

        {/* Movie details */}
        <div className="text-center mb-6 text-pink-700">
          <p className="text-lg">
            {new Date(movie.releaseDate).getFullYear()}
            {movie.director && ` • Directed by ${movie.director}`}
          </p>
          {movie.genres && movie.genres.length > 0 && (
            <p className="text-sm mt-1">
              {movie.genres.map(g => g.name).join(', ')}
            </p>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Movie poster */}
          <div className="w-full md:w-1/3 flex flex-col items-center">
            <div className="w-44 h-64 overflow-hidden rounded-xl shadow-lg border-2 border-pink-300">
              <Image
                src={movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : "/placeholder.svg"}
                alt={movie.title}
                width={176}
                height={256}
                className="object-cover w-full h-full"
              />
            </div>

            {/* Rating */}
            <div className="mt-4 flex flex-col items-center">
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
              className="w-full h-60 p-4 rounded-xl bg-pink-100 text-pink-900 placeholder-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-400 border border-pink-300 shadow-inner"
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

        {/* Add entry button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleAddEntry}
            className="bg-pink-500 hover:bg-pink-600 text-white text-lg font-medium py-2.5 px-14 rounded-full shadow-lg transition-colors duration-300 cursor-pointer"
          >
            Add to Diary
          </button>
        </div>
      </div>
    </div>
  )
}
