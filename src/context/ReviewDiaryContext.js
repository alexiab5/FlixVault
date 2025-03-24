"use client"

import { createContext, useContext, useState, useEffect } from "react"
import movieReviews from "../lib/reviews"

const ReviewDiaryContext = createContext()

const isValidReview = (review) => {
  return (
    review &&
    review.id &&
    review.movie &&
    review.rating &&
    review.year &&
    review.month &&
    review.day &&
    review.released &&
    review.poster
  )
}

export function ReviewDiaryProvider({ children, initialReviews = movieReviews }) {
  const [reviews, setReviews] = useState([])
  const [currentFilter, setCurrentFilter] = useState(null)
  const [filteredReviews, setFilteredReviews] = useState([])

  // Only set initial reviews once when the component mounts
  useEffect(() => {
    if (reviews.length === 0) {
      setReviews(initialReviews)
      setFilteredReviews(initialReviews)
    }
  }, []) // Empty dependency array means this only runs once on mount

  const addReview = (newReview) => {
    if (!isValidReview(newReview)) {
      console.error("Invalid review data:", newReview)
      return
    }
    setReviews((prevReviews) => [newReview, ...prevReviews])
    setFilteredReviews((prevReviews) => [newReview, ...prevReviews])
  }

  const deleteReview = (reviewId) => {
    setReviews((prevReviews) => prevReviews.filter((review) => review.id !== reviewId))
    setFilteredReviews((prevReviews) => prevReviews.filter((review) => review.id !== reviewId))
  }

  const sortReviews = (order) => {
    setReviews((prevReviews) => {
      const sortedReviews = [...prevReviews].sort((a, b) => {
        const dateA = new Date(a.year, new Date(Date.parse(a.month + " 1, 2000")).getMonth(), a.day)
        const dateB = new Date(b.year, new Date(Date.parse(b.month + " 1, 2000")).getMonth(), b.day)
        return order === "desc" ? dateB - dateA : dateA - dateB
      })
      return sortedReviews
    })
  }

  const getSortedReviews = (order = "desc", limit = null) => {
    const sortedReviews = [...reviews].sort((a, b) => {
      const dateA = new Date(a.year, new Date(Date.parse(a.month + " 1, 2000")).getMonth(), a.day)
      const dateB = new Date(b.year, new Date(Date.parse(b.month + " 1, 2000")).getMonth(), b.day)
      return order === "desc" ? dateB - dateA : dateA - dateB
    })

    return limit ? sortedReviews.slice(0, limit) : sortedReviews
  }

  const updateReview = (updatedReview) => {
    if (!isValidReview(updatedReview)) {
      console.error("Invalid review data:", updatedReview)
      return
    }
    setReviews((prevReviews) => prevReviews.map((review) => (review.id === updatedReview.id ? updatedReview : review)))
    setFilteredReviews((prevReviews) => prevReviews.map((review) => (review.id === updatedReview.id ? updatedReview : review)))
  }

  const filterReviewsByRating = (rating) => {
    setCurrentFilter(rating)

    if (rating === null) {
      // If no filter, show all reviews
      setFilteredReviews(reviews)
    } else {
      // Filter reviews by rating
      const filtered = reviews.filter((review) => review.rating === rating)
      setFilteredReviews(filtered)
    }
  }

  const resetReviews = () => {
    setReviews([])
    setFilteredReviews([])
    setCurrentFilter(null)
  }

  return (
    <ReviewDiaryContext.Provider
      value={{
        reviews,
        filteredReviews,
        addReview,
        deleteReview,
        sortReviews,
        getSortedReviews,
        updateReview,
        filterReviewsByRating,
        resetReviews
      }}
    >
      {children}
    </ReviewDiaryContext.Provider>
  )
}

export function useReviewDiary() {
  return useContext(ReviewDiaryContext)
}
