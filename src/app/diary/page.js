"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import clsx from "clsx"
import Icons from "@/components/Icons"
import { useRouter } from "next/navigation"
import { useReviewDiary } from "../../context/ReviewDiaryContext"

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

export default function MovieDiary() {
  const { reviews, deleteReview, sortReviews } = useReviewDiary()
  const [sortOrder, setSortOrder] = useState("desc")
  const [checkedReview, setCheckedReview] = useState(null)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [selectedRatings, setSelectedRatings] = useState([]) // Array of selected ratings
  const router = useRouter()

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

  const navigateToEditReview = (reviewId) => {
    if (reviewId) {
      router.push(`/edit-review/${reviewId}`)
    }
  }

  const handleEditButtonClick = () => {
    if (checkedReview !== null) {
      navigateToEditReview(checkedReview)
    }
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
  }

  const clearFilter = () => {
    setSelectedRatings([])
    setShowFilterDropdown(false)
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
  const filteredReviews =
    selectedRatings.length === 0 ? reviews : reviews.filter((review) => selectedRatings.includes(review.rating))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-3">
        <h2 className="text-2xl font-bold text-white mb-1">Your Diary</h2>
        <Card>
          <div className="flex justify-end mb-4 space-x-2 relative">
            <Button onClick={handleSearchPageNavigation} className="text-white">
              <Icons.SquaresPlus />
            </Button>
            <Button className="text-white" onClick={handleEditButtonClick}>
              <Icons.Pencil />
            </Button>
            <Button className="text-white" onClick={handleDelete}>
              <Icons.Trash />
            </Button>
            <Button className="text-white filter-dropdown" onClick={handleFilterClick}>
              <Icons.Filter />
            </Button>
            <Button className="text-white" onClick={handleSort}>
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
                    />
                    <span className="flex">★★★★★</span>
                  </label>
                  <label className="flex items-center text-white cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-2 h-4 w-4"
                      checked={selectedRatings.includes(4)}
                      onChange={() => handleFilterByRating(4)}
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

          <div className="max-h-[calc(7*4rem)] overflow-y-auto space-y-8">
            {filteredReviews.map((review) => (
              <div key={review.id} className="grid grid-cols-7 items-center text-white border-b border-white/10 pb-8">
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
                  <Button className="text-white" onClick={() => navigateToEditReview(review.id)}>
                    <Icons.ArrowUpRight />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

