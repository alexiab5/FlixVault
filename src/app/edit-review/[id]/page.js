"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"  // Import useParams from next/navigation
import Image from "next/image"
import { useReviewDiary } from "../../../context/ReviewDiaryContext"

export default function EditReview() {
  const { id } = useParams()  // Use useParams to get the review ID from the URL
  const { reviews, updateReview } = useReviewDiary()
  const [review, setReview] = useState(null)
  const [reviewText, setReviewText] = useState("")
  const [rating, setRating] = useState(0)
  const router = useRouter()

  useEffect(() => {
    // Find the review with the matching ID
    const foundReview = reviews.find((r) => r.id == id)
    if (foundReview) {
      setReview(foundReview)
      setReviewText(foundReview.review || "")
      setRating(foundReview.rating || 0)
    } else {
      // If no review is found, redirect back to the diary
      router.push("/diary")
    }
  }, [id, reviews, router])

  const handleSave = () => {
    if (review) {
      const updatedReview = {
        ...review,
        review: reviewText,
        rating,
      }

      // Call the updateReview function from context
      updateReview(updatedReview)

      // Navigate back to the diary page
      router.push("/diary")
    }
  }

  const handleClose = () => {
    router.push("/diary")
  }

  const handleRatingChange = (newRating) => {
    setRating(newRating)
  }

  if (!review) {
    return (
      <div className="min-h-screen">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 text-center">
        <div className="max-w-3xl mx-auto bg-white/20 backdrop-blur-sm rounded-3xl p-8 relative">

          {/* Movie title */}
          <h2 className="text-3xl font-bold text-white mb-6">
            {review.movie} ({review.released})
          </h2>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Movie poster */}
            <div className="w-full md:w-1/3 flex justify-center">
              <div className="w-48 h-72 overflow-hidden rounded-md shadow-lg">
                <Image
                  src={review.poster || "/placeholder.svg"}
                  alt={review.movie}
                  width={192}
                  height={288}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>

            {/* Review text */}
            <div className="w-full md:w-2/3">
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full h-64 p-4 rounded-md bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="Write your review here..."
              />
            </div>
          </div>

          {/* Rating */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <span className="text-white text-xl mr-2">Rating</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => handleRatingChange(star)} className="text-3xl focus:outline-none cursor-pointer">
                  <span className={star <= rating ? "text-white" : "text-white/30"}>★</span>
                </button>
              ))}
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            className="mt-8 bg-pink-500 hover:bg-pink-600 text-white text-xl font-medium py-3 px-12 rounded-full shadow-lg transition-colors duration-300 cursor-pointer"
          >
            Save
          </button>
        </div>
      </main>
    </div>
  )
}
