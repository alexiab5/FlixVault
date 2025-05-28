"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useReviewDiary } from "../../context/ReviewDiaryContext"
import { useRouter } from "next/navigation"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"
import clsx from "clsx"

const Card = ({ className, children, ...props }) => {
  return (
    <div className={clsx("bg-white/20 backdrop-blur-sm p-6 rounded-3xl shadow-lg", className)} {...props}>
      {children}
    </div>
  )
}

const buttonVariants = {
  ghost: "bg-transparent hover:bg-white/10 text-white rounded-full p-2 cursor-pointer",
  primary: "bg-white/10 hover:bg-white/20 text-white rounded-lg px-4 py-2 cursor-pointer",
}

const Button = ({ className, variant = "ghost", children, ...props }) => {
  return (
    <button className={clsx(buttonVariants[variant], className)} {...props}>
      {children}
    </button>
  )
}

// Colors for charts
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export default function AnalyticsPage() {
  const { reviews, isLoading: contextLoading, setReviews } = useReviewDiary()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date())

  // Fetch reviews when component mounts or when manually refreshed
  const fetchReviews = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/movieReviews?page=1&limit=1000')
      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }
      const data = await response.json()
      if (data.reviews) {
        setReviews(data.reviews)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setIsLoading(false)
      setLastUpdateTime(new Date())
    }
  }, [setReviews])

  // Initial data fetch
  useEffect(() => {
    if (!contextLoading) {
      fetchReviews()
    }
  }, [fetchReviews, contextLoading])

  // Debug logging for initial load and reviews changes
  useEffect(() => {
    console.log("Statistics page - Reviews state:", {
      reviewCount: reviews.length,
      isLoading: contextLoading,
      timestamp: new Date().toISOString()
    })
  }, [reviews, contextLoading])

  // Function to navigate back to diary
  const handleBackToDiary = () => {
    router.push("/diary")
  }

  // Function to manually refresh data
  const handleRefresh = () => {
    console.log("Statistics page - Manual refresh triggered")
    fetchReviews()
  }

  // Calculate rating distribution data
  const ratingDistributionData = useMemo(() => {
    console.log("Statistics page - Calculating rating distribution")
    const distribution = [
      { name: "5 Stars", count: 0 },
      { name: "4 Stars", count: 0 },
      { name: "3 Stars", count: 0 },
      { name: "2 Stars", count: 0 },
      { name: "1 Star", count: 0 },
    ]

    reviews.forEach((review) => {
      // Make sure rating exists and is valid
      const rating = Math.round(review.rating || 0)
      if (rating >= 1 && rating <= 5) {
        distribution[5 - rating].count += 1
      }
    })

    return distribution
  }, [reviews])

  // Calculate movies watched over time
  const moviesOverTimeData = useMemo(() => {
    const monthlyData = {}

    reviews.forEach((review) => {
      // Get the date from the review's createdAt field
      const reviewDate = new Date(review.createdAt)
      const year = reviewDate.getFullYear()
      const month = reviewDate.toLocaleString('default', { month: 'short' }).toUpperCase()
      const dateKey = `${year}-${month}`

      if (!monthlyData[dateKey]) {
        monthlyData[dateKey] = {
          date: dateKey,
          count: 0,
          avgRating: 0,
          totalRating: 0,
        }
      }
      monthlyData[dateKey].count += 1
      monthlyData[dateKey].totalRating += review.rating || 0
    })

    // Calculate average ratings and sort by date
    return Object.values(monthlyData)
      .map((item) => ({
        ...item,
        avgRating: item.count > 0 ? item.totalRating / item.count : 0,
      }))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
  }, [reviews])

  // Calculate release year distribution
  const releaseYearData = useMemo(() => {
    const yearData = {}

    reviews.forEach((review) => {
      // Get the release year from the movie's releaseDate
      const releaseDate = review.movie?.releaseDate
      const year = releaseDate ? new Date(releaseDate).getFullYear().toString() : "Unknown"
      
      if (!yearData[year]) {
        yearData[year] = {
          name: year,
          count: 0,
        }
      }
      yearData[year].count += 1
    })

    // Sort by year (as number if possible, otherwise as string)
    return Object.values(yearData).sort((a, b) => {
      // Try to convert to numbers for proper year sorting
      const yearA = Number.parseInt(a.name)
      const yearB = Number.parseInt(b.name)

      // If both are valid numbers, compare numerically
      if (!isNaN(yearA) && !isNaN(yearB)) {
        return yearA - yearB
      }

      // Otherwise fall back to string comparison
      return String(a.name).localeCompare(String(b.name))
    })
  }, [reviews])

  // Calculate genre distribution (top 6 + 'Other', strict)
  const genreDistributionData = useMemo(() => {
    const genreData = {}

    reviews.forEach((review) => {
      const genres = review.movie?.genres || []
      genres.forEach(({ genre }) => {
        const genreName = genre.name
        if (!genreData[genreName]) {
          genreData[genreName] = {
            name: genreName,
            count: 0,
          }
        }
        genreData[genreName].count += 1
      })
    })

    // Sort by count (most frequent first)
    const sortedGenres = Object.values(genreData).sort((a, b) => b.count - a.count)
    const TOP_N = 6
    // Only show the first TOP_N genres, all others go into 'Other'
    const topGenres = sortedGenres.slice(0, TOP_N)
    const otherGenres = sortedGenres.slice(TOP_N)
    const otherCount = otherGenres.reduce((sum, g) => sum + g.count, 0)
    const result = [...topGenres]
    if (otherCount > 0) {
      result.push({ name: 'Other', count: otherCount, isOther: true })
    }
    return result
  }, [reviews])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Your Reviews Over Time</h1>
        <div className="flex space-x-4">
          <Button variant="primary" onClick={handleBackToDiary}>
            Back to Diary
          </Button>
        </div>
      </div>

      {reviews.length === 0 ? (
        <Card className="text-center py-12">
          <h2 className="text-xl text-white mb-4">No movie data available</h2>
          <p className="text-white/70 mb-6">Add some movie reviews to see your analytics.</p>
          <Button variant="primary" onClick={() => router.push("/search")}>
            Add Movies
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rating Distribution Chart */}
          <Card className="col-span-1">
            <h2 className="text-xl font-semibold text-white mb-4">Rating Distribution</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingDistributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                    }}
                  />
                  <Legend wrapperStyle={{ color: "white" }} />
                  <Bar dataKey="count" name="Number of Movies" fill="#8884d8" animationDuration={500}>
                    {ratingDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Movies Watched Over Time Chart */}
          <Card className="col-span-1">
            <h2 className="text-xl font-semibold text-white mb-4">Movies Watched Over Time</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moviesOverTimeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                    }}
                  />
                  <Legend wrapperStyle={{ color: "white" }} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Movies Watched"
                    stroke="#82ca9d"
                    activeDot={{ r: 8 }}
                    animationDuration={500}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgRating"
                    name="Average Rating"
                    stroke="#ffc658"
                    animationDuration={500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Release Year Distribution Chart */}
          <Card className="col-span-1">
            <h2 className="text-xl font-semibold text-white mb-4">Movies by Release Year</h2>
            <div className="h-[32rem]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={releaseYearData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    animationDuration={500}
                  >
                    {releaseYearData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                    }}
                    itemStyle={{
                      color: "white",
                    }}
                    formatter={(value, name) => [`${value} movies`, `Year: ${name}`]}
                  />
                  <Legend 
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{
                      color: "white",
                      marginTop: 24,
                      paddingLeft: 24,
                      paddingRight: 24,
                      display: "flex",
                      justifyContent: "center",
                      gap: 32,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Genre Distribution Chart */}
          <Card className="col-span-1">
            <h2 className="text-xl font-semibold text-white mb-4">Movies by Genre</h2>
            <div className="h-[32rem]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 80, left: 60, bottom: 20 }}>
                  <Pie
                    data={genreDistributionData}
                    cx="48%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    animationDuration={500}
                  >
                    {genreDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                    }}
                    itemStyle={{
                      color: "white",
                    }}
                    formatter={(value, name) => [`${value} movies`, `Genre: ${name}`]}
                  />
                  <Legend 
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{
                      color: "white",
                      marginTop: 24,
                      paddingLeft: 24,
                      paddingRight: 24,
                      display: "flex",
                      justifyContent: "center",
                      gap: 32,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Last update indicator */}
          <div className="col-span-1 md:col-span-2 text-center text-white/60 text-sm">
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Last update: {lastUpdateTime.toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

