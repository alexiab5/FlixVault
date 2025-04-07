"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { reviewApiService } from "../services/reviewApiService"

const ReviewDiaryContext = createContext()

export function ReviewDiaryProvider({ children }) {
  const [reviews, setReviews] = useState([])
  const [currentFilter, setCurrentFilter] = useState(null)
  const [filteredReviews, setFilteredReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch reviews when the component mounts
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true)
        const fetchedReviews = await reviewApiService.getAllReviews()
        setReviews(fetchedReviews)
        setFilteredReviews(fetchedReviews)
        setError(null)
      } catch (err) {
        console.error("Error fetching reviews:", err)
        setError("Failed to load reviews")
      } finally {
        setIsLoading(false)
      }
    }

    fetchReviews()
  }, [])

  const addReview = async (newReview) => {
    try {
      setIsLoading(true)
      const addedReview = await reviewApiService.addReview(newReview)
      
      // Update the local state with the new review
      setReviews((prevReviews) => [addedReview, ...prevReviews])
      
      // Update filtered reviews if necessary
      if (currentFilter === null || currentFilter === addedReview.rating) {
        setFilteredReviews((prevReviews) => [addedReview, ...prevReviews])
      }
      
      setError(null)
      return addedReview
    } catch (err) {
      console.error("Error adding review:", err)
      setError("Failed to add review")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteReview = async (reviewId) => {
    try {
      setIsLoading(true)
      await reviewApiService.deleteReview(reviewId)
      
      // Update local state
      setReviews((prevReviews) => prevReviews.filter((review) => review.id !== reviewId))
      setFilteredReviews((prevReviews) => prevReviews.filter((review) => review.id !== reviewId))
      
      setError(null)
    } catch (err) {
      console.error("Error deleting review:", err)
      setError("Failed to delete review")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateReview = async (updatedReview) => {
    try {
      setIsLoading(true)
      const result = await reviewApiService.updateReview(updatedReview)
      
      // Update local state
      setReviews((prevReviews) => 
        prevReviews.map((review) => (review.id === updatedReview.id ? result : review))
      )
      
      // Update filtered reviews if necessary
      if (currentFilter === null || currentFilter === updatedReview.rating) {
        setFilteredReviews((prevReviews) => 
          prevReviews.map((review) => (review.id === updatedReview.id ? result : review))
        )
      } else {
        // If the rating changed and it no longer matches the filter, remove from filtered list
        setFilteredReviews((prevReviews) => 
          prevReviews.filter((review) => review.id !== updatedReview.id)
        )
      }
      
      setError(null)
      return result
    } catch (err) {
      console.error("Error updating review:", err)
      setError("Failed to update review")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const filterReviewsByRating = async (rating) => {
    try {
      setIsLoading(true)
      setCurrentFilter(rating)
      
      const fetchedReviews = await reviewApiService.getAllReviews(rating)
      setFilteredReviews(fetchedReviews)
      
      setError(null)
    } catch (err) {
      console.error("Error filtering reviews:", err)
      setError("Failed to filter reviews")
    } finally {
      setIsLoading(false)
    }
  }

  const getSortedReviews = async (order = "desc", limit = null) => {
    try {
      setIsLoading(true)
      const sortedReviews = await reviewApiService.getAllReviews(currentFilter, order, limit)
      setError(null)
      return sortedReviews
    } catch (err) {
      console.error("Error sorting reviews:", err)
      setError("Failed to get sorted reviews")
      return []
    } finally {
      setIsLoading(false)
    }
  }

  const sortReviews = async (order) => {
    try {
      setIsLoading(true)
      const sortedReviews = await reviewApiService.getAllReviews(currentFilter, order)
      setReviews(sortedReviews)
      setFilteredReviews(sortedReviews)
      setError(null)
    } catch (err) {
      console.error("Error sorting reviews:", err)
      setError("Failed to sort reviews")
    } finally {
      setIsLoading(false)
    }
  }

  const resetReviews = async () => {
    try {
      setIsLoading(true)
      await reviewApiService.resetReviews()
      const freshReviews = await reviewApiService.getAllReviews()
      
      setReviews(freshReviews)
      setFilteredReviews(freshReviews)
      setCurrentFilter(null)
      setError(null)
    } catch (err) {
      console.error("Error resetting reviews:", err)
      setError("Failed to reset reviews")
    } finally {
      setIsLoading(false)
    }
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
        resetReviews,
        isLoading,
        error
      }}
    >
      {children}
    </ReviewDiaryContext.Provider>
  )
}

export function useReviewDiary() {
  return useContext(ReviewDiaryContext)
}