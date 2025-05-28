"use client"

import Image from "next/image"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import clsx from "clsx"
import Icons from "@/components/Icons"
import { useRouter } from "next/navigation"
import { useReviewDiary } from "../../context/ReviewDiaryContext"
import EditReviewModal from "@/components/EditReviewModal"
import AddReviewModal from "@/components/AddReviewModal"
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal"
import { generateReview } from "../../lib/clientReviewGenerator.js"
import { useAuth } from '../../context/AuthContext'
import RegularButton from '../components/RegularButton'

const Card = ({ className, children, ...props }) => {
  return (
    <div className={clsx("bg-white/20 backdrop-blur-sm p-6 rounded-3xl shadow-lg", className)} {...props}>
      {children}
    </div>
  )
}

const buttonVariants = {
  ghost: "bg-transparent hover:bg-white/10 text-white rounded-full p-2 cursor-pointer",
}

const Button = ({ className, variant = "ghost", children, ...props }) => {
  return (
    <button className={clsx(buttonVariants[variant], className)} {...props}>
      {children}
    </button>
  )
}

// Number of reviews to show per page
const ITEMS_PER_PAGE = 20

// Add debounce utility
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Development-only logging utility
const devLog = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

export default function MovieDiary() {
  const { reviews, deleteReview, sortReviews, setReviews, addReview, exportReviews, importReviews } = useReviewDiary()
  const [displayedReviews, setDisplayedReviews] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [sortOrder, setSortOrder] = useState('desc');
  const [hasMore, setHasMore] = useState(true);
  const [isGeneratingReviews, setIsGeneratingReviews] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [importProgress, setImportProgress] = useState({ active: false });
  const [observerTarget, setObserverTarget] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [checkedReview, setCheckedReview] = useState(null);

  const [editingReview, setEditingReview] = useState(null);
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const { user, logout } = useAuth();

  const loadingRef = useRef(false);
  const displayedReviewsRef = useRef([]); // Add this ref to track current displayed reviews

  // Update the ref whenever displayedReviews changes
  useEffect(() => {
    displayedReviewsRef.current = displayedReviews;
  }, [displayedReviews]);

  // Load reviews function - moved to top
  const loadReviews = useCallback(async (page, shouldRefresh = false) => {
    // Skip if already loading and not refreshing
    if (loadingRef.current && !shouldRefresh) {
      devLog('Skipping loadReviews - already loading');
      return;
    }
    
    devLog('Loading reviews for page:', page, 'shouldRefresh:', shouldRefresh);
    loadingRef.current = true;
    setIsLoading(true);
    setError(''); // Clear any previous errors
    try {
      // Build rating filter parameters
      const ratingParams = selectedRatings.length > 0 
        ? selectedRatings.map(rating => `rating=${rating}`).join('&')
        : '';
      
      // Always use page 1 if we're refreshing
      const pageToFetch = shouldRefresh ? 1 : page;
      const url = `/api/movieReviews?page=${pageToFetch}&limit=${ITEMS_PER_PAGE}&sort=${sortOrder}${ratingParams ? `&${ratingParams}` : ''}`;
      devLog('Fetching reviews with URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch reviews');
      }
      
      const data = await response.json();
      devLog('Received data:', {
        page: data.pagination?.page,
        totalPages: data.pagination?.totalPages,
        reviewCount: data.reviews?.length,
        requestedPage: pageToFetch
      });
      
      if (data.reviews) {
        if (pageToFetch === 1 || shouldRefresh) {
          // If it's the first page or we're refreshing, replace all reviews
          devLog('Setting first page reviews:', data.reviews.length);
          setDisplayedReviews(data.reviews);
          setReviews(data.reviews);
        } else {
          // For subsequent pages, append new reviews
          const newReviews = data.reviews.filter(
            newReview => !displayedReviewsRef.current.some(existingReview => existingReview.id === newReview.id)
          );
          devLog('Appending new reviews:', newReviews.length);
          const updatedReviews = [...displayedReviewsRef.current, ...newReviews];
          setDisplayedReviews(updatedReviews);
          setReviews(updatedReviews);
        }
        
        setHasMore(data.pagination.page < data.pagination.totalPages);
      }
    } catch (error) {
      devLog('Error loading reviews:', error);
      setError(error.message || 'An error occurred while loading reviews');
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedRatings, sortOrder, setReviews]);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isRefreshing && !loadingRef.current) {
          loadingRef.current = true;
          setCurrentPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget) {
      observer.observe(observerTarget);
    }

    return () => {
      if (observerTarget) {
        observer.unobserve(observerTarget);
      }
    };
  }, [hasMore, isLoading, observerTarget, isRefreshing]);

  // Load reviews when page changes
  useEffect(() => {
    if (isRefreshing) {
      loadReviews(1, true);
    } else {
      loadReviews(currentPage, false);
    }
    // Reset loading ref after reviews are loaded
    return () => {
      loadingRef.current = false;
    };
  }, [currentPage, loadReviews, isRefreshing]);

  // Generate multiple random reviews for testing the sliding window
  const generateMultipleReviews = useCallback(async (count = 50) => {
    if (isGeneratingReviews) return;
    
    setIsGeneratingReviews(true);
    setReviewCount(0);
    
    devLog(`Generating ${count} random reviews for testing...`);
    
    // Track existing IDs to avoid duplicates
    const existingIds = new Set(reviews.map(review => review.id));
    
    for (let i = 0; i < count; i++) {
      const newReview = generateReview();
      
      // Skip if we already have a review with this ID
      if (existingIds.has(newReview.id)) {
        devLog(`Skipping duplicate review with ID: ${newReview.id}`);
        continue;
      }
      
      // Add to existing IDs set
      existingIds.add(newReview.id);
      
      // Add a small delay to avoid overwhelming the UI
      await new Promise(resolve => setTimeout(resolve, 50));
      await addReview(newReview);
      setReviewCount(prev => prev + 1);
    }
    
    setIsGeneratingReviews(false);
    devLog(`Generated ${reviewCount} random reviews successfully`);
  }, [isGeneratingReviews, addReview, reviews, reviewCount]);

  // Check for a selected movie in the URL parameters when the component mounts
  useEffect(() => {
    const movieId = searchParams.get("selectedMovie")
    if (movieId) {
      setSelectedMovieId(movieId)
    }
  }, [searchParams])

  const closeAddModal = () => {
    setSelectedMovieId(null)
    // Clear the URL parameter when closing the modal
    router.replace("/diary")
  }

  // Find special reviews for highlighting
  const specialReviews = useMemo(() => {
    if (!reviews.length) return {}

    // Sort by date using createdAt
    const sortedByDate = [...reviews].sort((a, b) => {
      const dateA = new Date(a.createdAt)
      const dateB = new Date(b.createdAt)
      return dateB - dateA // Most recent first
    })

    // Get most recent reviews for specific ratings
    const mostRecent5Star = sortedByDate.find(review => review.rating === 5)?.id
    const mostRecent3Star = sortedByDate.find(review => review.rating === 3)?.id
    const mostRecent1Star = sortedByDate.find(review => review.rating === 1)?.id

    // Get most recently released movie
    const mostRecentRelease = [...reviews].sort((a, b) => {
      const dateA = new Date(a.movie?.releaseDate || a.released)
      const dateB = new Date(b.movie?.releaseDate || b.released)
      return dateB - dateA
    })[0]?.id

    // Get oldest movie in the collection
    const oldestMovie = [...reviews].sort((a, b) => {
      const dateA = new Date(a.movie?.releaseDate || a.released)
      const dateB = new Date(b.movie?.releaseDate || b.released)
      return dateA - dateB
    })[0]?.id

    return {
      mostRecent5Star,
      mostRecent3Star,
      mostRecent1Star,
      mostRecentRelease,
      oldestMovie
    }
  }, [reviews])

  const handleRadioClick = (reviewId) => {
    setCheckedReview(checkedReview === reviewId ? null : reviewId)
  }

  const handleSearchPageNavigation = () => {
    router.push("/search")
  }

  const handleSort = () => {
    // Toggle sort order
    const newSortOrder = sortOrder === "desc" ? "asc" : "desc"
    setSortOrder(newSortOrder)

    // Use the context's sortReviews function
    sortReviews(newSortOrder)
  }

  const handleDelete = () => {
    if (checkedReview !== null) {
      deleteReview(checkedReview)
      setCheckedReview(null)
    }
  }

  const handleEditClick = async (e, reviewId) => {
    e.stopPropagation();
    try {
      // Fetch the full review data before opening the modal
      const response = await fetch(`/api/movieReviews/${reviewId}`);
      const data = await response.json();
      
      if (data.review) {
        // Format the review data to match the expected structure
        const formattedReview = {
          ...data.review,
          movie: {
            title: data.review.movie?.title || data.review.movie,
            posterPath: data.review.movie?.posterPath || data.review.poster,
            releaseDate: data.review.movie?.releaseDate || new Date(data.review.released).toISOString()
          }
        };
        setEditingReview(formattedReview);
      } else {
        devLog('Review not found:', reviewId);
      }
    } catch (error) {
      devLog('Error fetching review for edit:', error);
    }
  };

  const handleFilterClick = () => {
    setShowFilterDropdown(!showFilterDropdown)
  }

  const handleFilterByRating = (rating) => {
    setSelectedRatings((prevSelectedRatings) => {
      if (prevSelectedRatings.includes(rating)) {
        return prevSelectedRatings.filter((r) => r !== rating);
      } else {
        return [...prevSelectedRatings, rating];
      }
    });

    // Reset pagination
    setCurrentPage(1);
    setHasMore(true);
  };

  const clearFilter = () => {
    setSelectedRatings([]);
    setShowFilterDropdown(false);
    setCurrentPage(1);
    setHasMore(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilterDropdown && !event.target.closest(".filter-dropdown") && !event.target.closest("button")) {
        setShowFilterDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showFilterDropdown])

  // Filter reviews based on selected ratings
  const filteredReviews = useMemo(() => {
    if (selectedRatings.length === 0) return reviews;
    return reviews.filter((review) => selectedRatings.includes(review.rating));
  }, [reviews, selectedRatings]);

  // Handle review added
  const handleReviewAdded = async (newReview) => {
    devLog('Adding new review to the list');
    
    // Update both displayedReviews and the context's reviews state
    if (sortOrder === 'desc' && selectedRatings.length === 0) {
      setDisplayedReviews(prev => [newReview, ...prev]);
      setReviews(prev => [newReview, ...prev]);
      return;
    }
    
    // Otherwise, we need to refresh to maintain proper sorting/filtering
    devLog('Refreshing list to maintain sort/filter order');
    setIsRefreshing(true);
    setCurrentPage(1);
  };

  // Handle review deleted
  const handleDeleteClick = (e, review) => {
    e.stopPropagation();
    setReviewToDelete(review);
  };

  const handleDeleteConfirm = async () => {
    if (reviewToDelete) {
      try {
        const response = await fetch(`/api/movieReviews/${reviewToDelete.id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete review');
        }
        
        // Remove the deleted review from displayed reviews
        setDisplayedReviews(prev => prev.filter(review => review.id !== reviewToDelete.id));
        setReviewToDelete(null);
        
        // Refresh the list to ensure proper pagination
        await refreshReviews();
      } catch (error) {
        devLog('Error deleting review:', error);
      }
    }
  };

  const handleDeleteCancel = () => {
    setReviewToDelete(null);
  };

  // Handle review updated
  const handleReviewUpdated = async () => {
    await refreshReviews();
  };

  // Function to refresh reviews
  const refreshReviews = async () => {
    setIsRefreshing(true);
    setCurrentPage(1);
    setDisplayedReviews([]);
    setHasMore(true);
  };

  // Get highlight class for a review
  const getHighlightClass = (review) => {
    if (specialReviews.mostRecent5Star === review.id) {
      return "bg-green-500/20" // Most recent 5-star review
    }
    if (specialReviews.mostRecent3Star === review.id) {
      return "bg-yellow-500/20" // Most recent 3-star review
    }
    if (specialReviews.mostRecent1Star === review.id) {
      return "bg-red-500/20" // Most recent 1-star review
    }
    if (specialReviews.mostRecentRelease === review.id) {
      return "bg-blue-500/20" // Most recently released movie
    }
    if (specialReviews.oldestMovie === review.id) {
      return "bg-purple-500/20" // Oldest movie in collection
    }
    return ""
  }

  // Remove the old exportToCsv function and replace with:
  const handleExport = () => {
    devLog('Displayed Reviews:', displayedReviews);
    devLog('Context Reviews:', reviews);
    
    // Use displayedReviews since that's what's shown on the page
    if (!displayedReviews || displayedReviews.length === 0) {
      alert('No reviews to export');
      return;
    }
    
    // Format the reviews for export
    const reviewsToExport = displayedReviews.map(review => ({
      ...review,
      movie: {
        title: review.movie?.title || review.movie,
        posterPath: review.movie?.posterPath || review.poster,
        releaseDate: review.movie?.releaseDate || new Date(review.released).toISOString()
      }
    }));
    
    devLog('Exporting reviews:', reviewsToExport);
    exportReviews(reviewsToExport);
  }

  // Update the file upload handler:
  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      setImportProgress({ active: true })
      await importReviews(file)
      // Refresh the reviews list
      await refreshReviews()
    } catch (error) {
      devLog('Error importing reviews:', error)
      alert('Failed to import reviews: ' + error.message)
    } finally {
      setImportProgress({ active: false })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1">Your Diary</h2>
        
        {/* Add buttons for generating reviews and CSV operations */}
        <div className="mb-4 flex justify-center space-x-2">
          <Button 
            onClick={handleExport} 
            className="bg-transparent hover:bg-white/10 text-white px-4 py-2 rounded-lg"
            disabled={displayedReviews.length === 0}
          >
            Export Reviews
          </Button>
          
          <label className="bg-transparent hover:bg-white/10 text-white px-4 py-2 rounded-lg cursor-pointer">
            Import Reviews
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleFileUpload}
              disabled={importProgress.active}
            />
          </label>

          <button
            onClick={handleSearchPageNavigation}
            className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer"
          >
            <Icons.Plus className="w-4 h-4" />
            Add Review
          </button>
        </div>
        
        {displayedReviews.length === 0 && (
          <p className="text-white/70 text-sm mb-4">
            Click &quot;Add Review&quot; to search for movies and add your first review!
          </p>
        )}
        
        {/* Import Loading Spinner */}
        {importProgress.active && (
          <div className="mb-4 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
          </div>
        )}
        
        {/* Debug Panel - hidden by default */}
        {showDebugPanel && (
          <div className="mb-4 p-4 bg-gray-800 rounded-lg text-left text-white text-sm">
            <h3 className="font-bold mb-2">Sliding Window Debug Info</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>Total Reviews:</div>
              <div>{filteredReviews.length}</div>
              
              <div>Visible Items:</div>
              <div>{ITEMS_PER_PAGE}</div>
              
              <div>Has More:</div>
              <div>{hasMore ? 'Yes' : 'No'}</div>
              
              <div>Is Loading:</div>
              <div>{isLoading ? 'Yes' : 'No'}</div>
              
              <div>Items Per Page:</div>
              <div>{ITEMS_PER_PAGE}</div>
            </div>
            
            <div className="mt-4">
              <h4 className="font-bold mb-1">Sliding Window Visualization:</h4>
              <div className="w-full bg-gray-700 h-6 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full" 
                  style={{ width: `${Math.min(100, (ITEMS_PER_PAGE / filteredReviews.length) * 100)}%` }}
                ></div>
              </div>
              <div className="text-xs mt-1 text-gray-400">
                Showing {ITEMS_PER_PAGE} of {filteredReviews.length} items
              </div>
            </div>
          </div>
        )}

        <Card>
          <div className="flex justify-end space-x-2 relative">
            <Button onClick={handleSearchPageNavigation} className="text-white">
              <Icons.SquaresPlus />
            </Button>
            <Button className="text-white filter-dropdown" onClick={handleFilterClick} aria-label="Filter">
              <Icons.Filter />
            </Button>
            <Button className="text-white" onClick={handleSort}  aria-label="Sort">
              <Icons.ArrowUpDown />
            </Button>

            {showFilterDropdown && (
              <div className="absolute right-12 top-10 w-48 bg-white/50 backdrop-blur-md rounded-xl shadow-lg p-3 z-10 filter-dropdown">
                <div className="text-white text-sm font-medium mb-2">Filter by...</div>
                <div className="space-y-2">
                  <label className="flex items-center text-white cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-2 h-4 w-4"
                      checked={selectedRatings.includes(5)}
                      onChange={() => handleFilterByRating(5)}
                      aria-label="5-star rating"
                    />
                    <span className="flex">★★★★★</span>
                  </label>
                  <label className="flex items-center text-white cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-2 h-4 w-4"
                      checked={selectedRatings.includes(4)}
                      onChange={() => handleFilterByRating(4)}
                      aria-label="4-star rating"
                    />
                    <span className="flex">
                      ★★★★<span className="text-white/30">★</span>
                    </span>
                  </label>
                  <label className="flex items-center text-white cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-2 h-4 w-4"
                      checked={selectedRatings.includes(3)}
                      onChange={() => handleFilterByRating(3)}
                      aria-label="3-star rating"
                    />
                    <span className="flex">
                      ★★★<span className="text-white/30">★★</span>
                    </span>
                  </label>
                  <label className="flex items-center text-white cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-2 h-4 w-4"
                      checked={selectedRatings.includes(2)}
                      onChange={() => handleFilterByRating(2)}
                      aria-label="2-star rating"
                    />
                    <span className="flex">
                      ★★<span className="text-white/30">★★★</span>
                    </span>
                  </label>
                  <label className="flex items-center text-white cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-2 h-4 w-4"
                      checked={selectedRatings.includes(1)}
                      onChange={() => handleFilterByRating(1)}
                      aria-label="1-star rating"
                    />
                    <span className="flex">
                      ★<span className="text-white/30">★★★★</span>
                    </span>
                  </label>
                  <label className="flex items-center text-white cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-2 h-4 w-4"
                      checked={selectedRatings.includes(0)}
                      onChange={() => handleFilterByRating(0)}
                      aria-label="no rating"
                    />
                    <span>Not rated</span>
                  </label>
                  <button
                    onClick={clearFilter}
                    className="w-full mt-2 text-white bg-white/20 hover:bg-white/30 py-1 rounded-lg text-sm"
                  >
                    Clear Filter
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 text-white text-sm md:text-lg font-medium mb-4 border-b border-white/20 pb-2">
            <div className="text-center">Year</div>
            <div className="text-center">Month</div>
            <div className="text-center hidden md:block">Day</div>
            <div className="text-center">Movie</div>
            <div className="text-center hidden lg:block">Released</div>
            <div className="text-center">Rating</div>
            <div className="text-center">Review</div>
          </div>

          <div className="max-h-[calc(5*4rem)] overflow-y-auto space-y-4 md:space-y-8 reviews-container">
            {displayedReviews.length > 0 ? (
              displayedReviews.map((review) => (
                <div
                  key={`${review.id}-${review.createdAt}`}
                  className={clsx(
                    "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 items-center text-white border-b border-white/10 pb-4 md:pb-8 rounded-lg transition-colors text-sm md:text-base",
                    getHighlightClass(review),
                  )}
                >
                  <div className="text-center">
                    <span>{new Date(review.createdAt).getFullYear()}</span>
                  </div>
                  <div className="text-center">{new Date(review.createdAt).toLocaleString("default", { month: "short" }).toUpperCase()}</div>
                  <div className="text-center hidden md:block">{String(new Date(review.createdAt).getDate()).padStart(2, "0")}</div>
                  <div className="flex justify-center">
                    <Image
                      src={review.movie?.posterPath || "/placeholder.svg"}
                      alt={`Poster for ${review.movie?.title || 'Movie'}`}
                      width={70}
                      height={100}
                      className="rounded-md w-12 h-16 md:w-16 md:h-24 lg:w-20 lg:h-28 object-cover"
                    />
                  </div>
                  <div className="text-center hidden lg:block">{new Date(review.movie?.releaseDate).getFullYear()}</div>
                  <div className="text-center flex justify-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < review.rating ? "text-white" : "text-white/30"}>
                        ★
                      </span>
                    ))}
                  </div>
                  <div className="text-center flex justify-center gap-2">
                    <Button 
                      className="text-white" 
                      onClick={(e) => handleEditClick(e, review.id)}
                    >
                      <Icons.ArrowUpRight />
                    </Button>
                    <Button 
                      className="text-red-500 hover:text-red-600" 
                      onClick={(e) => handleDeleteClick(e, review)}
                    >
                      <Icons.Trash />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-white/70 py-8">
                No reviews found. Try clearing your filters or add some reviews!
              </div>
            )}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
              </div>
            )}
            
            {/* End of list indicator */}
            {!hasMore && displayedReviews.length > 0 && (
              <div className="text-center text-white/50 py-4">
                No more reviews to load
              </div>
            )}
            
            {/* Debug info */}
            <div className="text-center text-white/50 py-2 text-sm">
              Showing {displayedReviews.length} reviews (Page {currentPage})
            </div>
            
            {/* Observer target for infinite scrolling */}
            {hasMore && (
              <div
                ref={setObserverTarget}
                className="h-4 w-full"
              />
            )}
          </div>
        </Card>

        {/* Add Review Modal */}
        {selectedMovieId && (
          <AddReviewModal
            movieId={selectedMovieId}
            onClose={closeAddModal}
            onReviewAdded={handleReviewAdded}
          />
        )}

        {/* Edit Review Modal */}
        {editingReview && (
          <EditReviewModal
            review={editingReview}
            onClose={() => setEditingReview(null)}
            onSave={async (updatedReview) => {
              // If we have rating filters active and the rating changed,
              // we need to check if the review should still be displayed
              if (selectedRatings.length > 0 && updatedReview.rating !== editingReview.rating) {
                // If the new rating doesn't match any selected ratings, remove the review
                if (!selectedRatings.includes(updatedReview.rating)) {
                  setDisplayedReviews(prev => 
                    prev.filter(review => review.id !== updatedReview.id)
                  );
                  setReviews(prev => 
                    prev.filter(review => review.id !== updatedReview.id)
                  );
                } else {
                  // If it still matches, update it
                  setDisplayedReviews(prev => 
                    prev.map(review => 
                      review.id === updatedReview.id ? updatedReview : review
                    )
                  );
                  setReviews(prev => 
                    prev.map(review => 
                      review.id === updatedReview.id ? updatedReview : review
                    )
                  );
                }
              } else {
                // No filters active, just update the review
                setDisplayedReviews(prev => 
                  prev.map(review => 
                    review.id === updatedReview.id ? updatedReview : review
                  )
                );
                setReviews(prev => 
                  prev.map(review => 
                    review.id === updatedReview.id ? updatedReview : review
                  )
                );
              }
              setEditingReview(null);
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {reviewToDelete && (
          <DeleteConfirmationModal
            review={reviewToDelete}
            onConfirm={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
          />
        )}
      </div>
    </div>
  )
}

