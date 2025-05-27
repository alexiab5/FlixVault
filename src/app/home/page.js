"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useReviewDiary } from "../../context/ReviewDiaryContext"

export default function Home() {
  const { reviews, getSortedReviews } = useReviewDiary()
  const [recentReviews, setRecentReviews] = useState([])
  const router = useRouter()

  useEffect(() => {
    // Use the context's getSortedReviews function to get the 4 most recent reviews
    setRecentReviews(getSortedReviews("desc", 4))
  }, [reviews, getSortedReviews]) // Re-run when reviews change

  const handleCreateNewEntry = () => {
    router.push("/search")
  }

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <main className="container mx-auto px-4 pt-16 flex-1 flex flex-col items-center justify-between">
        <h1 className="text-6xl font-bold text-white mb-10 mt-10">Welcome back, Alexia!</h1>

        <h2 className="text-2xl text-white mb-16">Here&apos;s what you&apos;ve been up to lately...</h2>

        {/* Recent Movies Grid */}
        <div className="flex justify-center gap-6 mb-10 flex-wrap">
          {recentReviews.map((review) => (
            <div key={review.id} className="flex flex-col items-center">
              <div className="w-40 h-60 mb-2 overflow-hidden rounded-md shadow-lg">
                <Image
                  src={review.poster || "/placeholder.svg"}
                  alt={review.movie}
                  width={192}
                  height={288}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="text-2xl">
                    {i < review.rating ? "★" : "☆"}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Create New Entry Button */}
        <button
          onClick={handleCreateNewEntry}
          className="bg-pink-500 hover:bg-pink-600 text-white text-xl font-medium py-4 px-8 rounded-full shadow-lg cursor-pointer transition-colors duration-300 "
        >
          Create a new entry
        </button>
      </main>
    </div>
  )
}

