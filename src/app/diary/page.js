"use client"

import Image from "next/image"
import { useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import clsx from "clsx"
import Icons from "@/components/Icons"
import { useRouter } from "next/navigation"
import { useReviewDiary } from "../../context/ReviewDiaryContext"
import EditReviewModal from "@/components/EditReviewModal"
import AddReviewModal from "@/components/AddReviewModal"
import { getMovieById } from "D:/MPP/flix-vault/src/lib/movie-data.ts";
import { generateReview } from "../../lib/clientReviewGenerator.js";

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
const ITEMS_PER_PAGE = 4

export default function MovieDiary() {
  const { reviews, deleteReview, sortReviews, setReviews, addReview } = useReviewDiary()
  const [sortOrder, setSortOrder] = useState("desc")
  const [checkedReview, setCheckedReview] = useState(null)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [selectedRatings, setSelectedRatings] = useState([])
  const [visibleItems, setVisibleItems] = useState(ITEMS_PER_PAGE)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isGeneratingReviews, setIsGeneratingReviews] = useState(false)
  const [reviewCount, setReviewCount] = useState(0)
  const [showDebugPanel, setShowDebugPanel] = useState(false)

  const [editingReview, setEditingReview] = useState(null)
  const [selectedMovie, setSelectedMovie] = useState(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  // Generate multiple random reviews for testing the sliding window
  const generateMultipleReviews = useCallback(async (count = 50) => {
    if (isGeneratingReviews) return;
    
    setIsGeneratingReviews(true);
    setReviewCount(0);
    
    console.log(`Generating ${count} random reviews for testing...`);
    
    // Track existing IDs to avoid duplicates
    const existingIds = new Set(reviews.map(review => review.id));
    
    for (let i = 0; i < count; i++) {
      const newReview = generateReview();
      
      // Skip if we already have a review with this ID
      if (existingIds.has(newReview.id)) {
        console.log(`Skipping duplicate review with ID: ${newReview.id}`);
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
    console.log(`Generated ${reviewCount} random reviews successfully`);
  }, [isGeneratingReviews, addReview, reviews, reviewCount]);

  // Generate reviews when the page is first loaded
  // useEffect(() => {
  //   // Only generate reviews if there are fewer than 20 reviews
  //   if (reviews.length < 20) {
  //     generateMultipleReviews(50);
  //   }
  // }, [reviews.length, generateMultipleReviews]);

  // Check for a selected movie in the URL parameters when the component mounts
  useEffect(() => {
    const movieParam = searchParams.get("selectedMovie")
    if (movieParam) {
      try {
        // For a string ID
        if (movieParam.startsWith('"') && movieParam.endsWith('"')) {
          // It's just an ID string, we need to fetch the movie data
          const movieId = JSON.parse(movieParam)
          // Fetch the movie data based on ID (simplified example)
          console.log("movie id:", movieId);
          const movie = getMovieById(movieId);
          if (movie) {
            setSelectedMovie(movie)
          }
          console.log("selected movie:", movie.title);
        } 
      } catch (error) {
        console.error("Error parsing movie data:", error)
      }
    }
  }, [searchParams])

  const closeAddModal = () => {
    setSelectedMovie(null)
    // Clear the URL parameter when closing the modal
    router.replace("/diary")
  }

  // Find special reviews for highlighting
  const specialReviews = useMemo(() => {
    if (!reviews.length) return {}

    // Sort by date (assuming year, month, day format)
    const sortedByDate = [...reviews].sort((a, b) => {
      const dateA = new Date(`${a.year}-${a.month}-${a.day}`)
      const dateB = new Date(`${b.year}-${b.month}-${b.day}`)
      return dateB - dateA // Most recent first
    })

    // Get most recent reviews for specific ratings
    const mostRecent5Star = sortedByDate.find(review => review.rating === 5)?.id
    const mostRecent3Star = sortedByDate.find(review => review.rating === 3)?.id
    const mostRecent1Star = sortedByDate.find(review => review.rating === 1)?.id

    // Get most recently released movie
    const mostRecentRelease = [...reviews].sort((a, b) => b.released - a.released)[0]?.id

    // Get oldest movie in the collection
    const oldestMovie = [...reviews].sort((a, b) => a.released - b.released)[0]?.id

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

  // const navigateToEditReview = (e, reviewId) => {
  //   e.preventDefault();
  //   if (reviewId) {
  //     console.log("Navigating to edit page for review:", reviewId);
  //     router.push(`/edit-review/${reviewId}`);
  //   }
  // }

  const handleEditButtonClick = (e) => {
    if (checkedReview !== null) {
      openEditModal(e, checkedReview)
    }
  }

  const openEditModal = (e, reviewId) => {
    e.preventDefault();
    
    // Find the review to edit - use String() to ensure consistent comparison
    const reviewToEdit = reviews.find(r => String(r.id) === String(reviewId));
    if (reviewToEdit) {
      setEditingReview(reviewToEdit);
    } else {
      console.error("Review not found:", reviewId);
    }
  }
  
  const closeEditModal = () => {
    setEditingReview(null)
  }
  
  const handleSaveReview = (updatedReview) => {
    // The updateReview function is called inside the modal component
    // Here we just need to close the modal
    closeEditModal()
  }

  const handleFilterClick = () => {
    setShowFilterDropdown(!showFilterDropdown)
  }

  const handleFilterByRating = (rating) => {
    setSelectedRatings((prevSelectedRatings) => {
      // If rating is already selected, remove it
      if (prevSelectedRatings.includes(rating)) {
        return prevSelectedRatings.filter((r) => r !== rating)
      }
      // Otherwise add it to the selection
      else {
        return [...prevSelectedRatings, rating]
      }
    })

    // Reset to first page when filter changes
    setVisibleItems(ITEMS_PER_PAGE)
  }

  const clearFilter = () => {
    setSelectedRatings([])
    setShowFilterDropdown(false)
    setVisibleItems(ITEMS_PER_PAGE) // Reset to first page
  }

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
    return selectedRatings.length === 0 ? reviews : reviews.filter((review) => selectedRatings.includes(review.rating))
  }, [reviews, selectedRatings])

  // Get visible reviews for the current scroll position
  const visibleReviews = useMemo(() => {
    return filteredReviews.slice(0, visibleItems)
  }, [filteredReviews, visibleItems])

  // Check if there are more reviews to load
  useEffect(() => {
    setHasMore(visibleItems < filteredReviews.length)
  }, [visibleItems, filteredReviews.length])

  // Handle scroll event to load more reviews
  const handleScroll = useCallback(() => {
    if (isLoading || !hasMore) return

    // Get the container element
    const container = document.querySelector('.reviews-container');
    if (!container) return;

    // Check if we're near the bottom of the container
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    if (isNearBottom) {
      setIsLoading(true);
      
      // Load more items immediately without delay
      setVisibleItems(prev => prev + ITEMS_PER_PAGE);
      setIsLoading(false);
    }
  }, [isLoading, hasMore]);

  // Add scroll event listener to the container
  useEffect(() => {
    const container = document.querySelector('.reviews-container');
    if (!container) return;
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Reset visible items when filters change
  useEffect(() => {
    setVisibleItems(ITEMS_PER_PAGE);
  }, [selectedRatings]);

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1">Your Diary</h2>
        
        {/* Add a button to manually generate more reviews */}
        <div className="mb-4">
          <Button 
            onClick={() => generateMultipleReviews(20)} 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg mr-2"
            disabled={isGeneratingReviews}
          >
            {isGeneratingReviews ? `Generating Reviews (${reviewCount})...` : 'Generate More Reviews'}
          </Button>
          
          <Button 
            onClick={() => setShowDebugPanel(!showDebugPanel)} 
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            {showDebugPanel ? 'Hide Debug Panel' : 'Show Debug Panel'}
          </Button>
        </div>
        
        {/* Debug Panel */}
        {showDebugPanel && (
          <div className="mb-4 p-4 bg-gray-800 rounded-lg text-left text-white text-sm">
            <h3 className="font-bold mb-2">Sliding Window Debug Info</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>Total Reviews:</div>
              <div>{filteredReviews.length}</div>
              
              <div>Visible Items:</div>
              <div>{visibleItems}</div>
              
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
                  style={{ width: `${Math.min(100, (visibleItems / filteredReviews.length) * 100)}%` }}
                ></div>
              </div>
              <div className="text-xs mt-1 text-gray-400">
                Showing {visibleItems} of {filteredReviews.length} items
              </div>
            </div>
          </div>
        )}

        <Card>
          <div className="flex justify-end space-x-2 relative">
            <Button onClick={handleSearchPageNavigation} className="text-white">
              <Icons.SquaresPlus />
            </Button>
            <Button className="text-white" onClick={(e) => handleEditButtonClick(e)} aria-label="Edit">
              <Icons.Pencil />
            </Button>
            <Button className="text-white" onClick={handleDelete} aria-label="Delete">
              <Icons.Trash />
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

          <div className="grid grid-cols-7 text-white text-lg font-medium mb-4 border-b border-white/20 pb-2">
            <div className="text-center">Year</div>
            <div className="text-center">Month</div>
            <div className="text-center">Day</div>
            <div className="text-center">Movie</div>
            <div className="text-center">Released</div>
            <div className="text-center">Rating</div>
            <div className="text-center">Review</div>
          </div>

          <div className="max-h-[calc(5*4rem)] overflow-y-auto space-y-8 reviews-container">
            {visibleReviews.length > 0 ? (
              visibleReviews.map((review) => (
                <div
                  key={review.id}
                  className={clsx(
                    "grid grid-cols-7 items-center text-white border-b border-white/10 pb-8 rounded-lg transition-colors",
                    getHighlightClass(review),
                  )}
                >
                  <div className="flex justify-center items-center">
                    <div
                      onClick={() => handleRadioClick(review.id)}
                      className="w-5 h-5 rounded-full border-2 border-white/50 flex items-center justify-center mr-2 cursor-pointer"
                    >
                      <Icons.RadioButton checked={checkedReview === review.id} />
                    </div>
                    <span>{review.year}</span>
                  </div>
                  <div className="text-center">{review.month}</div>
                  <div className="text-center">{review.day}</div>
                  <div className="flex justify-center">
                    <Image
                      src={review.poster || "/placeholder.svg"}
                      alt={review.movie}
                      width={70}
                      height={100}
                      className="rounded-md"
                    />
                  </div>
                  <div className="text-center">{review.released}</div>
                  <div className="text-center flex justify-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < review.rating ? "text-white" : "text-white/30"}>
                        ★
                      </span>
                    ))}
                  </div>
                  <div className="text-center">
                    <Button 
                      className="text-white" 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent event bubbling
                        openEditModal(e, review.id);
                      }}
                    ><Icons.ArrowUpRight />
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
            {!hasMore && visibleReviews.length > 0 && (
              <div className="text-center text-white/50 py-4">
                No more reviews to load
              </div>
            )}
            
            {/* Sliding window indicator */}
            <div className="text-center text-white/70 py-2 text-sm">
              Showing {visibleReviews.length} of {filteredReviews.length} reviews
            </div>
          </div>
        </Card>

        {/* Modal for editing reviews - moved OUTSIDE the Card */}
        {editingReview && <EditReviewModal review={editingReview} onClose={closeEditModal} onSave={handleSaveReview} />}
        {selectedMovie && <AddReviewModal movie={selectedMovie} onClose={closeAddModal} />}
      </div>
    </div>
  )
}

