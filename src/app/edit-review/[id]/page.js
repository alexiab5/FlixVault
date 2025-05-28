"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import { useReviewDiary } from "../../../context/ReviewDiaryContext"
import devLog from '../../../lib/devLog'

export default function EditReview() {
  const { id } = useParams()
  const { getReviewById, updateReview, isLoading: contextLoading } = useReviewDiary()
  const [review, setReview] = useState(null)
  const [reviewText, setReviewText] = useState("")
  const [rating, setRating] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    devLog.log(`Edit page loaded for review ID: ${id}`);
    
    const loadReview = async () => {
      try {
        setIsLoading(true);
        devLog.log("Attempting to load review data...");
        
        // Wait for the context to be ready
        if (contextLoading) {
          devLog.log("Context is still loading, waiting...");
          return; // Wait for next render cycle when contextLoading changes
        }
        
        const foundReview = await getReviewById(id);
        devLog.log("getReviewById result:", foundReview);
        
        if (foundReview) {
          setReview(foundReview);
          setReviewText(foundReview.review || "");
          setRating(foundReview.rating || 0);
          setError(null);
        } else {
          devLog.error("Review not found");
          setError("Review not found");
          // Wait a bit before redirecting to show the error
          setTimeout(() => router.push("/diary"), 2000);
        }
      } catch (err) {
        devLog.error("Error loading review:", err);
        setError(`Error loading review: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadReview();
  }, [id, getReviewById, contextLoading, router]);

  const handleSave = async () => {
    try {
      devLog.log("Saving updated review...");
      if (review) {
        const updatedReview = {
          ...review,
          review: reviewText,
          rating,
        };
        
        devLog.log("Calling updateReview with:", updatedReview);
        await updateReview(updatedReview);
        devLog.log("Review updated successfully");
        
        // Navigate back to the diary page
        router.push("/diary");
      } else {
        devLog.error("Cannot save: review is null");
      }
    } catch (err) {
      devLog.error("Error saving review:", err);
      setError(`Failed to save: ${err.message}`);
    }
  };

  const handleClose = () => {
    router.push("/diary");
  };

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  if (isLoading || contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading review data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl bg-red-500/30 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">
          Review not found. Redirecting to diary...
        </div>
      </div>
    );
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
  );
}