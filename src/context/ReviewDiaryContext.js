"use client"

import { createContext, useContext, useState, useEffect } from "react"
import movieReviews from "../lib/reviews"

const ReviewDiaryContext = createContext()

const isValidReview = (review) => {
  return (
    review &&
    typeof review.id === "number" &&
    typeof review.movie === "string" &&
    typeof review.rating === "number" &&
    typeof review.year === "number" &&
    typeof review.month === "string" &&
    typeof review.day === "number" &&
    typeof review.released === "number" &&
    typeof review.poster === "string"
  )
}

export function ReviewDiaryProvider({ children, initialReviews = movieReviews }) {
  const [reviews, setReviews] = useState([])
  const [currentFilter, setCurrentFilter] = useState(null)
  const [filteredReviews, setFilteredReviews] = useState([])

  // Load reviews from localStorage on mount
  useEffect(() => {
    const storedReviews = localStorage.getItem("reviews")
    if (storedReviews) {
      try {
        const parsedReviews = JSON.parse(storedReviews)
        if (Array.isArray(parsedReviews)) {
          setReviews(parsedReviews)
          setFilteredReviews(parsedReviews)
        }
      } catch (error) {
        console.error("Error loading reviews from localStorage:", error)
      }
    } else {
      setReviews(initialReviews)
      setFilteredReviews(initialReviews)
    }
  }, [initialReviews])

  // Save reviews to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("reviews", JSON.stringify(reviews))
  }, [reviews])

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
    localStorage.removeItem("reviews")
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
