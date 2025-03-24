"use client"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { useRouter } from "next/navigation"
import MovieDiary from "../diary/page"
import { useReviewDiary } from "../../context/ReviewDiaryContext"

// Mock the next/navigation router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}))

// Mock the ReviewDiaryContext
jest.mock("../../context/ReviewDiaryContext", () => ({
  useReviewDiary: jest.fn(),
}))

// Mock the Icons component
jest.mock("../components/Icons", () => ({
  __esModule: true,
  default: {
    SquaresPlus: () => <div data-testid="icon-squares-plus">+</div>,
    Pencil: () => <div data-testid="icon-pencil">✏️</div>,
    Trash: () => <div data-testid="icon-trash">🗑️</div>,
    Filter: () => <div data-testid="icon-filter">🔍</div>,
    ArrowUpDown: () => <div data-testid="icon-arrow-updown">↕️</div>,
    ArrowUpRight: () => <div data-testid="icon-arrow-upright">↗️</div>,
    RadioButton: ({ checked }) => <div data-testid="icon-radio-button">{checked ? "●" : "○"}</div>,
  },
}))

// Mock Image from next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => <img {...props} />,
}))

describe("MovieDiary Component", () => {
  // Sample review data for testing
  const mockReviews = [
    {
      id: "1",
      year: "2023",
      month: "Jan",
      day: "15",
      movie: "Test Movie 1",
      poster: "/test-poster-1.jpg",
      released: "2023",
      rating: 5,
    },
    {
      id: "2",
      year: "2023",
      month: "Feb",
      day: "20",
      movie: "Test Movie 2",
      poster: "/test-poster-2.jpg",
      released: "2022",
      rating: 3,
    },
  ]

  // Setup mocks before each test
  beforeEach(() => {
    // Mock router functions
    const mockRouter = {
      push: jest.fn(),
    }
    useRouter.mockReturnValue(mockRouter)

    // Mock ReviewDiary context functions
    const mockReviewDiary = {
      reviews: mockReviews,
      deleteReview: jest.fn(),
      sortReviews: jest.fn(),
    }
    useReviewDiary.mockReturnValue(mockReviewDiary)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // READ TESTS
  describe("Read Functionality", () => {
    test("renders all reviews from context", () => {
      render(<MovieDiary />)

      // Check if both reviews are rendered
      expect(screen.getByText("Test Movie 1")).toBeInTheDocument()
      expect(screen.getByText("Test Movie 2")).toBeInTheDocument()

      // Check if the table headers are rendered
      expect(screen.getByText("Year")).toBeInTheDocument()
      expect(screen.getByText("Month")).toBeInTheDocument()
      expect(screen.getByText("Day")).toBeInTheDocument()
      expect(screen.getByText("Movie")).toBeInTheDocument()
      expect(screen.getByText("Released")).toBeInTheDocument()
      expect(screen.getByText("Rating")).toBeInTheDocument()
      expect(screen.getByText("Review")).toBeInTheDocument()
    })

    test("filters reviews by rating when filter is applied", async () => {
      render(<MovieDiary />)

      // Open filter dropdown
      const filterButton = screen.getByTestId("icon-filter").closest("button")
      fireEvent.click(filterButton)

      // Wait for dropdown to appear
      await waitFor(() => {
        expect(screen.getByText("Filter by...")).toBeInTheDocument()
      })

      // Select 5-star rating filter
      const fiveStarCheckbox = screen.getAllByRole("checkbox")[0]
      fireEvent.click(fiveStarCheckbox)

      // Only the 5-star review should be visible
      const reviewElements = screen.getAllByText(/Test Movie/)
      expect(reviewElements).toHaveLength(1)
      expect(screen.getByText("Test Movie 1")).toBeInTheDocument()
      expect(screen.queryByText("Test Movie 2")).not.toBeInTheDocument()
    })

    test("shows all reviews when filter is cleared", async () => {
      render(<MovieDiary />)

      // Open filter dropdown
      const filterButton = screen.getByTestId("icon-filter").closest("button")
      fireEvent.click(filterButton)

      // Select 5-star rating filter
      const fiveStarCheckbox = screen.getAllByRole("checkbox")[0]
      fireEvent.click(fiveStarCheckbox)

      // Clear the filter
      const clearButton = screen.getByText("Clear Filter")
      fireEvent.click(clearButton)

      // All reviews should be visible again
      expect(screen.getByText("Test Movie 1")).toBeInTheDocument()
      expect(screen.getByText("Test Movie 2")).toBeInTheDocument()
    })
  })

  // DELETE TESTS
  describe("Delete Functionality", () => {
    test("deletes a review when selected and delete button is clicked", () => {
      const { deleteReview } = useReviewDiary()
      render(<MovieDiary />)

      // Select the first review
      const radioButton = screen.getAllByTestId("icon-radio-button")[0].closest("div")
      fireEvent.click(radioButton)

      // Click delete button
      const deleteButton = screen.getByTestId("icon-trash").closest("button")
      fireEvent.click(deleteButton)

      // Check if deleteReview was called with the correct ID
      expect(deleteReview).toHaveBeenCalledWith("1")
    })

    test("does not delete when no review is selected", () => {
      const { deleteReview } = useReviewDiary()
      render(<MovieDiary />)

      // Click delete button without selecting a review
      const deleteButton = screen.getByTestId("icon-trash").closest("button")
      fireEvent.click(deleteButton)

      // deleteReview should not be called
      expect(deleteReview).not.toHaveBeenCalled()
    })
  })

  // UPDATE TESTS
  describe("Update Functionality", () => {
    test("navigates to edit page when edit button is clicked for a selected review", () => {
      const { push } = useRouter()
      render(<MovieDiary />)

      // Select the first review
      const radioButton = screen.getAllByTestId("icon-radio-button")[0].closest("div")
      fireEvent.click(radioButton)

      // Click edit button
      const editButton = screen.getByTestId("icon-pencil").closest("button")
      fireEvent.click(editButton)

      // Check if router.push was called with the correct path
      expect(push).toHaveBeenCalledWith("/edit-review/1")
    })

    test("navigates to edit page when arrow button is clicked for a review", () => {
      const { push } = useRouter()
      render(<MovieDiary />)

      // Click the arrow button on the first review
      const arrowButtons = screen.getAllByTestId("icon-arrow-upright")
      fireEvent.click(arrowButtons[0].closest("button"))

      // Check if router.push was called with the correct path
      expect(push).toHaveBeenCalledWith("/edit-review/1")
    })
  })

  // CREATE TESTS
  describe("Create Functionality", () => {
    test("navigates to search page when add button is clicked", () => {
      const { push } = useRouter()
      render(<MovieDiary />)

      // Click add button
      const addButton = screen.getByTestId("icon-squares-plus").closest("button")
      fireEvent.click(addButton)

      // Check if router.push was called with the correct path
      expect(push).toHaveBeenCalledWith("/search")
    })
  })

  // SORT TESTS
  describe("Sort Functionality", () => {
    test("toggles sort order and calls sortReviews when sort button is clicked", () => {
      const { sortReviews } = useReviewDiary()
      render(<MovieDiary />)

      // Click sort button
      const sortButton = screen.getByTestId("icon-arrow-updown").closest("button")
      fireEvent.click(sortButton)

      // Check if sortReviews was called with 'asc'
      expect(sortReviews).toHaveBeenCalledWith("asc")

      // Click sort button again
      fireEvent.click(sortButton)

      // Check if sortReviews was called with 'desc'
      expect(sortReviews).toHaveBeenCalledWith("desc")
    })
  })

  // FILTER DROPDOWN TESTS
  describe("Filter Dropdown", () => {
    test("opens filter dropdown when filter button is clicked", async () => {
      render(<MovieDiary />)

      // Filter dropdown should not be visible initially
      expect(screen.queryByText("Filter by...")).not.toBeInTheDocument()

      // Click filter button
      const filterButton = screen.getByTestId("icon-filter").closest("button")
      fireEvent.click(filterButton)

      // Filter dropdown should be visible
      await waitFor(() => {
        expect(screen.getByText("Filter by...")).toBeInTheDocument()
      })
    })

    test("closes filter dropdown when clicking outside", async () => {
      render(<MovieDiary />)

      // Open filter dropdown
      const filterButton = screen.getByTestId("icon-filter").closest("button")
      fireEvent.click(filterButton)

      // Filter dropdown should be visible
      await waitFor(() => {
        expect(screen.getByText("Filter by...")).toBeInTheDocument()
      })

      // Click outside the dropdown
      fireEvent.mouseDown(document.body)

      // Filter dropdown should be hidden
      await waitFor(() => {
        expect(screen.queryByText("Filter by...")).not.toBeInTheDocument()
      })
    })

    test("allows multiple rating selections", async () => {
      render(<MovieDiary />)

      // Open filter dropdown
      const filterButton = screen.getByTestId("icon-filter").closest("button")
      fireEvent.click(filterButton)

      // Select 5-star rating
      const fiveStarCheckbox = screen.getAllByRole("checkbox")[0]
      fireEvent.click(fiveStarCheckbox)

      // Select 3-star rating
      const threeStarCheckbox = screen.getAllByRole("checkbox")[2]
      fireEvent.click(threeStarCheckbox)

      // Both reviews should be visible (one is 5-star, one is 3-star)
      expect(screen.getByText("Test Movie 1")).toBeInTheDocument()
      expect(screen.getByText("Test Movie 2")).toBeInTheDocument()
    })
  })
})

