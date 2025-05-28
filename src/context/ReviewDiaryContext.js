"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import reviewApiService from "../services/reviewApiService"
import { useAuth } from "./AuthContext"

const ReviewDiaryContext = createContext()

export function ReviewDiaryProvider({ children }) {
  const [reviews, setReviews] = useState([])
  const [currentFilter, setCurrentFilter] = useState(null)
  const [filteredReviews, setFilteredReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isNetworkDown, setIsNetworkDown] = useState(false)
  const [isServerDown, setIsServerDown] = useState(false)
  const { user } = useAuth()

  // Store reviews in localStorage when they change and we're online
  useEffect(() => {
    if (reviews.length > 0 && !isNetworkDown && !isServerDown) {
      localStorage.setItem('cachedReviews', JSON.stringify(reviews));
    }
  }, [reviews, isNetworkDown, isServerDown]);

  // Initialize the app and load initial reviews
  useEffect(() => {
    const initializeApp = async () => {
      // Don't fetch reviews if user is not authenticated
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log("Initializing app and loading reviews...");
        
        // Check network first
        const networkOnline = navigator.onLine;
        setIsNetworkDown(!networkOnline);
        console.log("Network status:", networkOnline ? "online" : "offline");
        
        if (!networkOnline) {
          // Load from cache if network is down
          const cached = localStorage.getItem('cachedReviews');
          const cachedReviews = cached ? JSON.parse(cached) : [];
          console.log("Loaded from cache (network down):", cachedReviews.length, "reviews");
          setReviews(cachedReviews);
          setFilteredReviews(cachedReviews);
          setIsServerDown(false); // Not relevant when network is down
          return;
        }
        
        // Check if server is reachable
        const isServerUp = await reviewApiService.isServerReachable();
        setIsServerDown(!isServerUp);
        console.log("Server status:", isServerUp ? "up" : "down");
        
        let fetchedReviews = [];
        
        if (isServerUp) {
          try {
            // We're fully online, sync and fetch fresh data
            await reviewApiService.syncPendingReviews();
            const response = await reviewApiService.getAllReviews();
            fetchedReviews = response?.reviews || [];
            console.log("Fetched from server:", fetchedReviews.length, "reviews");
            
            // Ensure we have valid reviews
            if (Array.isArray(fetchedReviews) && fetchedReviews.length > 0) {
              // Cache for offline use
              localStorage.setItem('cachedReviews', JSON.stringify(fetchedReviews));
              // Update both reviews and filtered reviews
              setReviews(fetchedReviews);
              setFilteredReviews(fetchedReviews);
            } else {
              // If no reviews from server, try to load from cache
              const cached = localStorage.getItem('cachedReviews');
              const cachedReviews = cached ? JSON.parse(cached) : [];
              if (cachedReviews.length > 0) {
                console.log("Using cached reviews:", cachedReviews.length, "reviews");
                setReviews(cachedReviews);
                setFilteredReviews(cachedReviews);
              }
            }
          } catch (fetchError) {
            console.error("Error fetching reviews:", fetchError);
            // Try to load from cache on fetch error
            const cached = localStorage.getItem('cachedReviews');
            const cachedReviews = cached ? JSON.parse(cached) : [];
            if (cachedReviews.length > 0) {
              console.log("Using cached reviews after fetch error:", cachedReviews.length, "reviews");
              setReviews(cachedReviews);
              setFilteredReviews(cachedReviews);
            }
          }
        } else {
          // Server is down, load from cache
          const cached = localStorage.getItem('cachedReviews');
          fetchedReviews = cached ? JSON.parse(cached) : [];
          console.log("Loaded from cache (server down):", fetchedReviews.length, "reviews");
          if (fetchedReviews.length > 0) {
            setReviews(fetchedReviews);
            setFilteredReviews(fetchedReviews);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error("Error initializing app:", err);
        setError("Failed to load reviews");
        
        // Fall back to cached reviews if available
        const cached = localStorage.getItem('cachedReviews');
        if (cached) {
          const cachedReviews = JSON.parse(cached);
          console.log("Loaded from cache (after error):", cachedReviews.length, "reviews");
          if (cachedReviews.length > 0) {
            setReviews(cachedReviews);
            setFilteredReviews(cachedReviews);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, [user]);

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
          
          // Get the current reviews that need to be synced
          const cachedReviews = JSON.parse(localStorage.getItem('cachedReviews') || '[]');
          const pendingReviews = cachedReviews.filter(review => review.pendingSync);
          
          // Update each pending review
          for (const review of pendingReviews) {
            try {
              await reviewApiService.updateReview({
                id: review.id,
                rating: review.rating,
                content: review.content
              });
            } catch (err) {
              console.error(`Failed to sync review ${review.id}:`, err);
            }
          }
          
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

  // WebSocket connection and handlers
  useEffect(() => {
    // Only connect to WebSocket if explicitly enabled
    const enableWebSocket = false; // Set this to true when you want to use WebSockets
    
    if (enableWebSocket && !isNetworkDown && !isServerDown) {
      const unsubscribeNewReview = reviewApiService.onNewReview((newReview) => {
        setReviews(prevReviews => [...prevReviews, newReview]);
      });

      const unsubscribeReviewUpdated = reviewApiService.onReviewUpdated((updatedReview) => {
        setReviews(prevReviews => 
          prevReviews.map(review => 
            review.id === updatedReview.id ? updatedReview : review
          )
        );
      });

      const unsubscribeReviewDeleted = reviewApiService.onReviewDeleted((deletedReviewId) => {
        setReviews(prevReviews => 
          prevReviews.filter(review => review.id !== deletedReviewId)
        );
      });

      return () => {
        unsubscribeNewReview();
        unsubscribeReviewUpdated();
        unsubscribeReviewDeleted();
        reviewApiService.disconnectSocket();
      };
    }
  }, [isNetworkDown, isServerDown]);
    
  const addReview = async (newReview) => {
    try {
      setIsLoading(true);
      
      let addedReview;
      
      if (isNetworkDown || isServerDown) {
        // Store in local state and queue for sync later
        addedReview = {
          ...newReview,
          id: `temp-${Date.now()}`,
          createdAt: new Date().toISOString(),
          offline: true
        };
        
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
      
      // Only update local state after successful API call
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
          body: JSON.stringify({
            rating: updatedReview.rating,
            content: updatedReview.content
          })
        });
        
        // Use the updated review as is, but mark it as pending sync
        result = {
          ...updatedReview,
          offline: true,
          pendingSync: true,
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

  const getReviewById = async (reviewId) => {
    console.log(`Trying to find review with ID: ${reviewId}`);
    
    if (!reviewId) {
      console.error("Invalid review ID provided");
      return null;
    }
    
    // First check if it's in the current state
    const reviewFromState = reviews.find(r => String(r.id) === String(reviewId));
    if (reviewFromState) {
      console.log("Found review in current state:", reviewFromState.movie);
      return reviewFromState;
    }
    console.log("Review not found in current state, checking localStorage...");
    
    // If not in state, try to get from localStorage
    const cachedReviewsStr = localStorage.getItem('cachedReviews');
    if (cachedReviewsStr) {
      try {
        const cachedReviews = JSON.parse(cachedReviewsStr);
        const cachedReview = cachedReviews.find(r => String(r.id) === String(reviewId));
        if (cachedReview) {
          console.log("Found review in localStorage:", cachedReview.movie);
          return cachedReview;
        }
      } catch (err) {
        console.error("Error parsing cached reviews:", err);
      }
    }
    console.log("Review not found in localStorage either");
    
    // If we're online, try to fetch from the server
    if (!isNetworkDown && !isServerDown) {
      console.log("Attempting to fetch review from server...");
      try {
        const fetchedReview = await reviewApiService.getReviewById(reviewId);
        if (fetchedReview) {
          console.log("Fetched review from server:", fetchedReview.movie);
          return fetchedReview;
        }
      } catch (err) {
        console.error("Error fetching review from server:", err);
      }
    }
    
    console.log("Review not found anywhere");
    return null;
  };

  const handleExportReviews = useCallback(() => {
    console.log('Exporting reviews from context:', reviews);
    if (!reviews || reviews.length === 0) {
      alert('No reviews to export');
      return;
    }

    // Format the reviews for CSV export
    const headers = ['Movie Title', 'Release Year', 'Rating', 'Content', 'Created At', 'Updated At'];
    const csvRows = [
      headers.join(','),
      ...reviews.map(review => [
        `"${(review.movie?.title || '').replace(/"/g, '""')}"`,
        new Date(review.movie?.releaseDate).getFullYear(),
        review.rating,
        `"${(review.content || '').replace(/"/g, '""')}"`,
        review.createdAt,
        review.updatedAt
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movie-reviews-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [reviews]);

  const handleImportReviews = async (file) => {
    try {
      // Check file type
      if (!file.name.endsWith('.csv')) {
        alert('Please select a CSV file');
        return;
      }

      const text = await file.text();
      
      // Check if file is empty
      if (!text.trim()) {
        alert('The file is empty');
        return;
      }

      const lines = text.split('\n');
      
      // Check if file has at least a header row
      if (lines.length < 2) {
        alert('The file must contain at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      
      // Validate headers
      const requiredHeaders = ['Movie Title', 'Release Year', 'Rating', 'Content', 'Created At', 'Updated At'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        alert(`Missing required headers: ${missingHeaders.join(', ')}`);
        return;
      }

      // Check for empty or malformed rows
      const dataRows = lines.slice(1).filter(line => line.trim());
      if (dataRows.length === 0) {
        alert('No data rows found in the file');
        return;
      }

      // Validate each row has the correct number of columns
      const invalidRows = dataRows.filter((line, index) => {
        const values = line.split(',').map(v => v.trim());
        return values.length !== headers.length;
      });

      if (invalidRows.length > 0) {
        alert(`Found ${invalidRows.length} row(s) with incorrect number of columns. Each row must have ${headers.length} columns.`);
        return;
      }

      const importedReviews = [];
      const errors = [];

      for (const line of dataRows) {
        try {
          // Handle quoted fields with commas
          const values = [];
          let currentValue = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(currentValue.trim());
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim()); // Add the last value
          
          // Validate number of values matches headers
          if (values.length !== headers.length) {
            errors.push(`Invalid number of columns in row: ${line}`);
            continue;
          }
          
          const review = {};
          let hasError = false;

          headers.forEach((header, index) => {
            let value = values[index] || '';
            // Remove surrounding quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1);
            }
            
            try {
              switch (header) {
                case 'Movie Title':
                  if (!value) {
                    throw new Error('Movie Title cannot be empty');
                  }
                  review.movie = { title: value };
                  break;
                case 'Release Year':
                  const year = parseInt(value);
                  if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 5) {
                    throw new Error(`Invalid release year: ${value}`);
                  }
                  review.movie.year = year;
                  break;
                case 'Rating':
                  const rating = parseInt(value);
                  if (isNaN(rating) || rating < 1 || rating > 5) {
                    throw new Error(`Invalid rating: ${value}. Rating must be between 1 and 5.`);
                  }
                  review.rating = rating;
                  break;
                case 'Content':
                  if (!value) {
                    throw new Error('Review content cannot be empty');
                  }
                  review.content = value;
                  break;
                case 'Created At':
                  const createdAt = new Date(value);
                  if (isNaN(createdAt.getTime())) {
                    throw new Error(`Invalid creation date: ${value}`);
                  }
                  review.createdAt = createdAt.toISOString();
                  break;
                case 'Updated At':
                  const updatedAt = new Date(value);
                  if (isNaN(updatedAt.getTime())) {
                    throw new Error(`Invalid update date: ${value}`);
                  }
                  review.updatedAt = updatedAt.toISOString();
                  break;
              }
            } catch (error) {
              errors.push(`Row "${line}": ${error.message}`);
              hasError = true;
            }
          });

          if (!hasError && review.movie?.title && review.rating && review.content) {
            importedReviews.push(review);
          }
        } catch (error) {
          errors.push(`Error processing row: ${line}`);
        }
      }

      if (importedReviews.length === 0) {
        if (errors.length > 0) {
          alert(`No valid reviews found in the file.\n\nErrors:\n${errors.join('\n')}`);
        } else {
          alert('No valid reviews found in the file');
        }
        return;
      }

      // Save each review to the database
      const savedReviews = [];
      for (const review of importedReviews) {
        try {
          // Check if we're online
          if (!isNetworkDown && !isServerDown) {
            // First, search for the movie in TMDB
            const searchResponse = await fetch(`/api/movies/search?q=${encodeURIComponent(review.movie.title)}`);
            if (!searchResponse.ok) {
              errors.push(`Failed to search for movie: ${review.movie.title}`);
              continue;
            }
            
            const searchData = await searchResponse.json();
            if (!searchData.movies || searchData.movies.length === 0) {
              errors.push(`Movie not found in TMDB: ${review.movie.title}`);
              continue;
            }
            
            // Find the movie that matches both title and year
            const tmdbMovie = searchData.movies.find(movie => {
              const movieYear = new Date(movie.releaseDate).getFullYear();
              return movie.title.toLowerCase() === review.movie.title.toLowerCase() && 
                     movieYear === review.movie.year;
            });
            
            if (!tmdbMovie) {
              // If no exact match, try to find a movie with the same title and closest year
              const possibleMatches = searchData.movies.filter(movie => 
                movie.title.toLowerCase() === review.movie.title.toLowerCase()
              );
              
              if (possibleMatches.length > 0) {
                // Sort by year difference and take the closest match
                possibleMatches.sort((a, b) => {
                  const yearA = new Date(a.releaseDate).getFullYear();
                  const yearB = new Date(b.releaseDate).getFullYear();
                  const diffA = Math.abs(yearA - review.movie.year);
                  const diffB = Math.abs(yearB - review.movie.year);
                  return diffA - diffB;
                });
                
                const closestMatch = possibleMatches[0];
                const closestYear = new Date(closestMatch.releaseDate).getFullYear();
                
                if (Math.abs(closestYear - review.movie.year) <= 1) {
                  // If the year difference is 1 or less, use this match
                  console.log(`Using closest year match for ${review.movie.title}: ${closestYear} (requested ${review.movie.year})`);
                  return closestMatch;
                }
              }
              
              errors.push(`Movie not found in TMDB with matching year: ${review.movie.title} (${review.movie.year})`);
              continue;
            }
            
            // Check if the movie exists in our database
            const movieResponse = await fetch(`/api/movies/${tmdbMovie.id}`);
            let movieId;
            
            if (movieResponse.ok) {
              // Movie exists in our database
              const movieData = await movieResponse.json();
              movieId = movieData.movie.id;
            } else {
              // Movie doesn't exist, create it
              const createMovieResponse = await fetch('/api/movies', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  id: tmdbMovie.id.toString(),
                  tmdbId: tmdbMovie.id,
                  title: tmdbMovie.title,
                  director: tmdbMovie.director || '',
                  releaseDate: tmdbMovie.releaseDate,
                  posterPath: tmdbMovie.posterPath,
                  language: tmdbMovie.language,
                  voteAverage: tmdbMovie.voteAverage,
                  genres: tmdbMovie.genres?.map(g => g.tmdbId.toString()) || []
                }),
              });
              
              if (!createMovieResponse.ok) {
                errors.push(`Failed to create movie: ${review.movie.title}`);
                continue;
              }
              
              const movieData = await createMovieResponse.json();
              movieId = movieData.movie.id;
            }
            
            // Now create the review with the movie ID
            const reviewResponse = await fetch('/api/movieReviews', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                movieId: movieId,
                rating: review.rating,
                content: review.content,
                createdAt: review.createdAt,
                updatedAt: review.updatedAt
              }),
            });

            if (!reviewResponse.ok) {
              errors.push(`Failed to save review for ${review.movie.title}`);
              continue;
            }

            const savedReview = await reviewResponse.json();
            savedReviews.push(savedReview.review);
          } else {
            // Queue for later sync if offline
            reviewApiService.queueOperation({
              url: '/api/movieReviews',
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                movie: review.movie,
                rating: review.rating,
                content: review.content,
                createdAt: review.createdAt,
                updatedAt: review.updatedAt
              })
            });
            savedReviews.push(review);
          }
        } catch (error) {
          errors.push(`Error saving review for ${review.movie.title}: ${error.message}`);
        }
      }

      // Update both reviews and filteredReviews with the saved reviews
      const existingReviews = [...reviews];
      const updatedReviews = [...existingReviews];
      
      savedReviews.forEach(savedReview => {
        const isDuplicate = existingReviews.some(
          existing => 
            existing.movie?.title === savedReview.movie?.title && 
            existing.content === savedReview.content
        );
        
        if (!isDuplicate) {
          updatedReviews.push(savedReview);
        }
      });

      // Use a callback to update state
      const updateState = () => {
        setReviews(updatedReviews);
        setFilteredReviews(updatedReviews);
        localStorage.setItem('cachedReviews', JSON.stringify(updatedReviews));
      };

      // Schedule the state update for the next tick
      setTimeout(updateState, 0);
      
      if (errors.length > 0) {
        alert(`Successfully imported ${savedReviews.length} reviews.\n\nSome errors occurred:\n${errors.join('\n')}`);
      } else {
        alert(`Successfully imported ${savedReviews.length} reviews`);
      }
    } catch (error) {
      console.error('Error importing reviews:', error);
      alert(`Error importing reviews: ${error.message}`);
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
        getReviewById,
        isLoading,
        error,
        isNetworkDown,
        isServerDown,
        setReviews,
        exportReviews: handleExportReviews,
        importReviews: handleImportReviews
      }}
    >
      {children}
    </ReviewDiaryContext.Provider>
  );
}

export function useReviewDiary() {
  return useContext(ReviewDiaryContext);
}