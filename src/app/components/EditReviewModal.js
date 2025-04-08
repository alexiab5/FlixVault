"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useReviewDiary } from "../../context/ReviewDiaryContext"

export default function EditReviewModal({ review, onClose, onSave }) {
  const [reviewText, setReviewText] = useState(review?.review || "")
  const [rating, setRating] = useState(review?.rating || 0)
  const { updateReview } = useReviewDiary()

  useEffect(() => {
    // Update state when review prop changes
    if (review) {
      setReviewText(review.review || "")
      setRating(review.rating || 0)
    }
  }, [review])

  const handleSave = async () => {
    try {
      if (review) {
        const updatedReview = {
          ...review,
          review: reviewText,
          rating,
        }

        await updateReview(updatedReview)
        onSave(updatedReview)
      }
    } catch (err) {
      console.error("Error saving review:", err)
    }
  }

  const handleRatingChange = (newRating) => {
    setRating(newRating)
  }

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

  if (!review) return null

  return (
    <div className="fixed inset-0 backdrop-blur-lg z-50 flex items-center justify-center p-0">
      <div className="bg-pink-200 rounded-3xl p-8 w-full max-w-3xl max-h-[85vh] overflow-auto relative shadow-2xl border border-pink-300">
        {/* Modal header with title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-pink-800">Edit Review</h2>
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
          {review.movie} ({review.released})
        </h3>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Movie poster */}
          <div className="w-full md:w-1/3 flex justify-center">
            <div className="w-44 h-64 overflow-hidden rounded-xl shadow-lg border-2 border-pink-300">
              <Image
                src={review.poster || "/placeholder.svg"}
                alt={review.movie}
                width={176}
                height={256}
                className="object-cover w-full h-full"
              />
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

        {/* Rating */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <span className="text-pink-800 text-lg mr-2 font-medium">Rating</span>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRatingChange(star)}
                className="text-4xl focus:outline-none cursor-pointer px-1"
              >
                <span className={star <= rating ? "text-pink-500" : "text-pink-300"} style={{ fontSize: "1.75rem" }}>
                  ★
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Save button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSave}
            className="bg-pink-500 hover:bg-pink-600 text-white text-lg font-medium py-2.5 px-14 rounded-full shadow-lg transition-colors duration-300 cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}