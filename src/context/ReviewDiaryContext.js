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
  const [isNetworkDown, setIsNetworkDown] = useState(false)
  const [isServerDown, setIsServerDown] = useState(false)

  // Store reviews in localStorage when they change and we're online
  useEffect(() => {
    if (reviews.length > 0 && !isNetworkDown && !isServerDown) {
      localStorage.setItem('cachedReviews', JSON.stringify(reviews));
    }
  }, [reviews, isNetworkDown, isServerDown]);

  // Initialize the app and load initial reviews
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        
        // Check network first
        const networkOnline = navigator.onLine;
        setIsNetworkDown(!networkOnline);
        
        if (!networkOnline) {
          // Load from cache if network is down
          const cached = localStorage.getItem('cachedReviews');
          const cachedReviews = cached ? JSON.parse(cached) : [];
          setReviews(cachedReviews);
          setFilteredReviews(cachedReviews);
          setIsServerDown(false); // Not relevant when network is down
          return;
        }
        
        // Check if server is reachable
        const isServerUp = await reviewApiService.isServerReachable();
        setIsServerDown(!isServerUp);
        
        let fetchedReviews = [];
        
        if (isServerUp) {
          // We're fully online, sync and fetch fresh data
          await reviewApiService.syncPendingReviews();
          fetchedReviews = await reviewApiService.getAllReviews();
          
          // Cache for offline use
          localStorage.setItem('cachedReviews', JSON.stringify(fetchedReviews));
        } else {
          // Server is down, load from cache
          const cached = localStorage.getItem('cachedReviews');
          fetchedReviews = cached ? JSON.parse(cached) : [];
        }
        
        setReviews(fetchedReviews);
        setFilteredReviews(fetchedReviews);
        setError(null);
      } catch (err) {
        console.error("Error initializing app:", err);
        setError("Failed to load reviews");
        
        // Fall back to cached reviews if available
        const cached = localStorage.getItem('cachedReviews');
        if (cached) {
          const cachedReviews = JSON.parse(cached);
          setReviews(cachedReviews);
          setFilteredReviews(cachedReviews);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, []);
  
  // Set up periodic connectivity checks and event listeners
  useEffect(() => {
    const checkServerStatus = async () => {
      // First check if we have network at all
      const hasNetwork = navigator.onLine;
      setIsNetworkDown(!hasNetwork);
      
      // If no network, don't check server status
      if (!hasNetwork) {
        setIsServerDown(false);
        return;
      }
      
      try {
        // Try to ping your server endpoint with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch('/api/ping', { 
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        setIsServerDown(!response.ok);
      } catch (error) {
        // Any error means server is unreachable
        setIsServerDown(true);
      }
    };
    
    // Check immediately
    checkServerStatus();
    
    // Set up recurring checks
    const intervalId = setInterval(checkServerStatus, 10000);
    
    // Listen for network status changes
    window.addEventListener("online", checkServerStatus);
    window.addEventListener("offline", checkServerStatus);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("online", checkServerStatus);
      window.removeEventListener("offline", checkServerStatus);
    };
  }, []);

  // Handle coming back online
  useEffect(() => {
    const handleOnline = async () => {
      setIsNetworkDown(false);
      
      try {
        // Check if server is also up
        const isServerUp = await reviewApiService.isServerReachable();
        setIsServerDown(!isServerUp);
        
        if (isServerUp) {
          // We're fully back online, sync any pending operations
          await reviewApiService.syncPendingReviews();
          
          // Refresh the reviews list
          const freshReviews = await reviewApiService.getAllReviews();
          setReviews(freshReviews);
          setFilteredReviews(freshReviews);
        }
      } catch (err) {
        console.error("Error syncing when back online:", err);
      }
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const addReview = async (newReview) => {
    try {
      setIsLoading(true);
      
      // Generate a temporary ID for offline mode
      const reviewWithTempId = {
        ...newReview,
        id: `temp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        offline: isNetworkDown || isServerDown
      };
      
      let addedReview;
      
      if (isNetworkDown || isServerDown) {
        // Store in local state and queue for sync later
        addedReview = reviewWithTempId;
        
        // Queue the operation for later sync
        reviewApiService.queueOperation({
          url: '/api/movieReviews',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newReview)
        });
      } else {
        // Online mode, use the API
        addedReview = await reviewApiService.addReview(newReview);
      }
      
      // Update local state
      setReviews((prevReviews) => [addedReview, ...prevReviews]);
      
      // Update filtered reviews if necessary
      if (currentFilter === null || currentFilter === addedReview.rating) {
        setFilteredReviews((prevReviews) => [addedReview, ...prevReviews]);
      }
      
      // Persist to local storage
      localStorage.setItem('cachedReviews', JSON.stringify([addedReview, ...reviews]));
      
      setError(null);
      return addedReview;
    } catch (err) {
      console.error("Error adding review:", err);
      setError("Failed to add review");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      setIsLoading(true);
      
      if (isNetworkDown || isServerDown) {
        // Queue the delete operation for later
        reviewApiService.queueOperation({
          url: `/api/movieReviews/${reviewId}`,
          method: 'DELETE',
          headers: {}
        });
        
        // Update local state immediately for better UX
        setReviews((prevReviews) => prevReviews.filter((review) => review.id !== reviewId));
        setFilteredReviews((prevReviews) => prevReviews.filter((review) => review.id !== reviewId));
        
        // Update cached reviews
        const cachedReviews = JSON.parse(localStorage.getItem('cachedReviews') || '[]');
        localStorage.setItem(
          'cachedReviews', 
          JSON.stringify(cachedReviews.filter(review => review.id !== reviewId))
        );
      } else {
        // Online mode, use the API
        await reviewApiService.deleteReview(reviewId);
        
        // Update local state
        setReviews((prevReviews) => prevReviews.filter((review) => review.id !== reviewId));
        setFilteredReviews((prevReviews) => prevReviews.filter((review) => review.id !== reviewId));
      }
      
      setError(null);
    } catch (err) {
      console.error("Error deleting review:", err);
      setError("Failed to delete review");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateReview = async (updatedReview) => {
    try {
      setIsLoading(true);
      
      let result;
      
      if (isNetworkDown || isServerDown) {
        // Queue the update operation for later
        reviewApiService.queueOperation({
          url: `/api/movieReviews/${updatedReview.id}`,
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedReview)
        });
        
        // Use the updated review as is
        result = {
          ...updatedReview,
          offline: true,
          updatedAt: new Date().toISOString()
        };
        
        // Update cached reviews
        const cachedReviews = JSON.parse(localStorage.getItem('cachedReviews') || '[]');
        const updatedCache = cachedReviews.map(review => 
          review.id === updatedReview.id ? result : review
        );
        localStorage.setItem('cachedReviews', JSON.stringify(updatedCache));
      } else {
        // Online mode, use the API
        result = await reviewApiService.updateReview(updatedReview);
      }
      
      // Update local state
      setReviews((prevReviews) => 
        prevReviews.map((review) => (review.id === updatedReview.id ? result : review))
      );
      
      // Update filtered reviews if necessary
      if (currentFilter === null || currentFilter === result.rating) {
        setFilteredReviews((prevReviews) => 
          prevReviews.map((review) => (review.id === updatedReview.id ? result : review))
        );
      } else {
        // If the rating changed and no longer matches filter, remove from filtered list
        setFilteredReviews((prevReviews) => 
          prevReviews.filter((review) => review.id !== updatedReview.id)
        );
      }
      
      setError(null);
      return result;
    } catch (err) {
      console.error("Error updating review:", err);
      setError("Failed to update review");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const filterReviewsByRating = async (rating) => {
    try {
      setIsLoading(true);
      setCurrentFilter(rating);
      
      if (isNetworkDown || isServerDown) {
        // Filter reviews from local state
        const locallyFilteredReviews = rating === null ? 
          reviews : 
          reviews.filter(review => review.rating === rating);
        
        setFilteredReviews(locallyFilteredReviews);
      } else {
        // Online mode, use the API
        const fetchedReviews = await reviewApiService.getAllReviews(rating);
        setFilteredReviews(fetchedReviews);
      }
      
      setError(null);
    } catch (err) {
      console.error("Error filtering reviews:", err);
      setError("Failed to filter reviews");
      
      // Fall back to local filtering
      const locallyFilteredReviews = rating === null ? 
        reviews : 
        reviews.filter(review => review.rating === rating);
      
      setFilteredReviews(locallyFilteredReviews);
    } finally {
      setIsLoading(false);
    }
  };

  const getSortedReviews = async (order = "desc", limit = null) => {
    try {
      setIsLoading(true);
      
      if (isNetworkDown || isServerDown) {
        // Sort reviews locally
        const sortedReviews = [...reviews].sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return order === 'desc' ? dateB - dateA : dateA - dateB;
        });
        
        return limit ? sortedReviews.slice(0, limit) : sortedReviews;
      } else {
        // Online mode, use the API
        const sortedReviews = await reviewApiService.getAllReviews(currentFilter, order, limit);
        return sortedReviews;
      }
    } catch (err) {
      console.error("Error sorting reviews:", err);
      setError("Failed to get sorted reviews");
      
      // Fall back to local sorting
      const sortedReviews = [...reviews].sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return order === 'desc' ? dateB - dateA : dateA - dateB;
      });
      
      return limit ? sortedReviews.slice(0, limit) : sortedReviews;
    } finally {
      setIsLoading(false);
    }
  };

  const sortReviews = async (order) => {
    try {
      setIsLoading(true);
      
      if (isNetworkDown || isServerDown) {
        // Sort reviews locally
        const sortedReviews = [...reviews].sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return order === 'desc' ? dateB - dateA : dateA - dateB;
        });
        
        setReviews(sortedReviews);
        
        const filteredAndSorted = currentFilter === null ?
          sortedReviews :
          sortedReviews.filter(review => review.rating === currentFilter);
        
        setFilteredReviews(filteredAndSorted);
      } else {
        // Online mode, use the API
        const sortedReviews = await reviewApiService.getAllReviews(currentFilter, order);
        setReviews(sortedReviews);
        setFilteredReviews(sortedReviews);
      }
      
      setError(null);
    } catch (err) {
      console.error("Error sorting reviews:", err);
      setError("Failed to sort reviews");
      
      // Fall back to local sorting
      const sortedReviews = [...reviews].sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return order === 'desc' ? dateB - dateA : dateA - dateB;
      });
      
      setReviews(sortedReviews);
      setFilteredReviews(sortedReviews);
    } finally {
      setIsLoading(false);
    }
  };

  const resetReviews = async () => {
    try {
      setIsLoading(true);
      
      if (isNetworkDown || isServerDown) {
        setError("Can't reset reviews while offline");
        return;
      }
      
      await reviewApiService.resetReviews();
      const freshReviews = await reviewApiService.getAllReviews();
      
      setReviews(freshReviews);
      setFilteredReviews(freshReviews);
      setCurrentFilter(null);
      
      // Update cache
      localStorage.setItem('cachedReviews', JSON.stringify(freshReviews));
      
      setError(null);
    } catch (err) {
      console.error("Error resetting reviews:", err);
      setError("Failed to reset reviews");
    } finally {
      setIsLoading(false);
    }
  };

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
        error,
        isNetworkDown,
        isServerDown
      }}
    >
      {children}
    </ReviewDiaryContext.Provider>
  );
}

export function useReviewDiary() {
  return useContext(ReviewDiaryContext);
}