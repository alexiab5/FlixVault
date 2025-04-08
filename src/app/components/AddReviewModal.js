"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useReviewDiary } from "../../context/ReviewDiaryContext"

export default function AddReviewModal({ movie, onClose }) {
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const { addReview } = useReviewDiary()

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
  }

  const handleAddEntry = () => {
    if (!movie) return

    const newEntry = {
      id: Date.now(),
      year: new Date().getFullYear(),
      month: new Date().toLocaleString("default", { month: "short" }).toUpperCase(),
      day: String(new Date().getDate()).padStart(2, "0"),
      movie: movie.title,
      poster: movie.posterUrl || "/placeholder.svg",
      released: movie.year,
      rating,
      review: reviewText,
    }

    addReview(newEntry)
    onClose()
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
        <h3 className="text-2xl font-bold text-pink-800 mb-6 text-center">
          {movie.title} ({movie.year})
        </h3>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Movie poster */}
          <div className="w-full md:w-1/3 flex flex-col items-center">
            <div className="w-44 h-64 overflow-hidden rounded-xl shadow-lg border-2 border-pink-300">
              {/* Use next/image for better image handling */}
              <Image
                src={movie.posterUrl || "/placeholder.svg?height=400&width=300"}
                alt={movie.title}
                width={176}
                height={256}
                className="object-cover w-full h-full"
                unoptimized={movie.posterUrl?.startsWith("./")} // For local images
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
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full h-60 p-4 rounded-xl bg-pink-100 text-pink-900 placeholder-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-400 border border-pink-300 shadow-inner"
              placeholder="Write your review here..."
            />
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
  )}
