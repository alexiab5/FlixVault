import { renderHook, act } from "@testing-library/react";
import { ReviewDiaryProvider, useReviewDiary } from "../../context/ReviewDiaryContext";

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key) => {
      delete store[key];
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe("ReviewDiaryContext", () => {
  const mockReviews = [
    {
      id: 1,
      year: 2024,
      month: "March",
      day: 15,
      movie: "Inception",
      released: 2010,
      rating: 5,
      poster: "/inception.jpg",
    },
    {
      id: 2,
      year: 2023,
      month: "July",
      day: 8,
      movie: "Interstellar",
      released: 2014,
      rating: 4,
      poster: "/interstellar.jpg",
    },
  ];

  const wrapper = ({ children }) => <ReviewDiaryProvider initialReviews={[]}>{children}</ReviewDiaryProvider>;

  // Clean up localStorage and reset context before each test
  beforeEach(() => {
    localStorage.clear();
    // Reset the context state before each test
    const { result } = renderHook(() => useReviewDiary(), { wrapper });
    act(() => {
      result.current.resetReviews();
    });
  });

  test("should initialize with empty reviews", () => {
    const { result } = renderHook(() => useReviewDiary(), { wrapper });
    expect(result.current.reviews).toEqual([]);
  });

  test("should add a new review", () => {
    const { result } = renderHook(() => useReviewDiary(), { wrapper });
    const newReview = {
      id: 1,
      movie: "Inception",
      rating: 5,
      year: 2024,
      month: "March",
      day: 15,
      released: 2010,
      poster: "/inception.jpg",
    };

    act(() => {
      result.current.addReview(newReview);
    });

    expect(result.current.reviews).toHaveLength(1);
    expect(result.current.reviews[0]).toEqual(newReview);
  });

  test("should delete a review", () => {
    const { result } = renderHook(() => useReviewDiary(), { wrapper });
    const review = {
      id: 1,
      movie: "Inception",
      rating: 5,
      year: 2024,
      month: "March",
      day: 15,
      released: 2010,
      poster: "/inception.jpg",
    };

    act(() => {
      result.current.addReview(review);
    });

    act(() => {
      result.current.deleteReview(1);
    });

    expect(result.current.reviews).toHaveLength(0);
  });

  test("should edit a review", () => {
    const { result } = renderHook(() => useReviewDiary(), { wrapper });
    const review = {
      id: 1,
      movie: "Inception",
      rating: 5,
      year: 2024,
      month: "March",
      day: 15,
      released: 2010,
      poster: "/inception.jpg",
    };

    act(() => {
      result.current.addReview(review);
    });

    const updatedReview = {
      ...review,
      rating: 4,
    };

    act(() => {
      result.current.updateReview(updatedReview);
    });

    expect(result.current.reviews).toHaveLength(1);
    expect(result.current.reviews[0].rating).toBe(4);
  });

  test("should sort reviews by date", () => {
    const { result } = renderHook(() => useReviewDiary(), { wrapper });
    const reviews = [
      {
        id: 1,
        movie: "Inception",
        rating: 5,
        year: 2024,
        month: "March",
        day: 15,
        released: 2010,
        poster: "/inception.jpg",
      },
      {
        id: 2,
        movie: "Interstellar",
        rating: 4,
        year: 2023,
        month: "July",
        day: 8,
        released: 2014,
        poster: "/interstellar.jpg",
      },
    ];

    act(() => {
      reviews.forEach((review) => result.current.addReview(review));
    });

    act(() => {
      result.current.sortReviews("desc");
    });

    expect(result.current.reviews[0].year).toBe(2024); // Inception (newer)
    expect(result.current.reviews[1].year).toBe(2023); // Interstellar (older)

    // Sort in ascending order (oldest first)
    act(() => {
      result.current.sortReviews("asc");
    });

    expect(result.current.reviews[0].year).toBe(2023); // Interstellar (older)
    expect(result.current.reviews[1].year).toBe(2024); // Inception (newer)
  });

  test("should filter reviews by rating", () => {
    const { result } = renderHook(() => useReviewDiary(), { wrapper });
    const reviews = [
      {
        id: 1,
        movie: "Inception",
        rating: 5,
        year: 2024,
        month: "March",
        day: 15,
        released: 2010,
        poster: "/inception.jpg",
      },
      {
        id: 2,
        movie: "Interstellar",
        rating: 4,
        year: 2023,
        month: "July",
        day: 8,
        released: 2014,
        poster: "/interstellar.jpg",
      },
    ];

    act(() => {
      reviews.forEach((review) => result.current.addReview(review));
    });

    // Filter for 5-star reviews
    act(() => {
      result.current.filterReviewsByRating(5);
    });

    expect(result.current.filteredReviews).toHaveLength(1);
    expect(result.current.filteredReviews[0].rating).toBe(5);

    // Clear filter
    act(() => {
      result.current.filterReviewsByRating(null);
    });

    expect(result.current.filteredReviews).toHaveLength(2);
  });

  test("should handle multiple filters", () => {
    const { result } = renderHook(() => useReviewDiary(), { wrapper });
    const reviews = [
      {
        id: 1,
        movie: "Inception",
        rating: 5,
        year: 2024,
        month: "March",
        day: 15,
        released: 2010,
        poster: "/inception.jpg",
      },
      {
        id: 2,
        movie: "Interstellar",
        rating: 4,
        year: 2023,
        month: "July",
        day: 8,
        released: 2014,
        poster: "/interstellar.jpg",
      },
      {
        id: 3,
        movie: "The Dark Knight",
        rating: 3,
        year: 2022,
        month: "January",
        day: 1,
        released: 2008,
        poster: "/dark-knight.jpg",
      },
    ];

    act(() => {
      reviews.forEach((review) => result.current.addReview(review));
    });

    // Filter for both 4 and 5 star reviews
    act(() => {
      result.current.filterReviewsByRating(4);
    });

    expect(result.current.filteredReviews).toHaveLength(1);
    expect(result.current.filteredReviews[0].rating).toBe(4);

    // Clear filter
    act(() => {
      result.current.filterReviewsByRating(null);
    });

    expect(result.current.filteredReviews).toHaveLength(3);
  });

  test("should persist reviews in localStorage", () => {
    const { result } = renderHook(() => useReviewDiary(), { wrapper });
    const mockReviews = [
      {
        id: 1,
        movie: "Inception",
        rating: 5,
        year: 2024,
        month: "March",
        day: 15,
        released: 2010,
        poster: "/inception.jpg",
      },
    ];

    act(() => {
      mockReviews.forEach((review) => result.current.addReview(review));
    });

    // Check localStorage
    const storedReviews = JSON.parse(localStorage.getItem("reviews"));
    expect(storedReviews).toHaveLength(1);
    expect(storedReviews[0]).toEqual(mockReviews[0]);
  });

  test("should load reviews from localStorage on initialization", () => {
    const mockReviews = [
      {
        id: 1,
        movie: "Inception",
        rating: 5,
        year: 2024,
        month: "March",
        day: 15,
        released: 2010,
        poster: "/inception.jpg",
      },
      {
        id: 2,
        movie: "Interstellar",
        rating: 4,
        year: 2023,
        month: "July",
        day: 8,
        released: 2014,
        poster: "/interstellar.jpg",
      },
    ];

    localStorage.setItem("reviews", JSON.stringify(mockReviews));
    const { result } = renderHook(() => useReviewDiary(), { wrapper });

    expect(result.current.reviews).toEqual(mockReviews);
  });

  test("should handle invalid review data", () => {
    const { result } = renderHook(() => useReviewDiary(), { wrapper });
    const invalidReview = {
      id: 1,
      movie: "Inception",
    };

    act(() => {
      result.current.addReview(invalidReview);
    });

    expect(result.current.reviews).toHaveLength(0);
  });

  test("should handle non-existent review deletion", () => {
    const { result } = renderHook(() => useReviewDiary(), { wrapper });
    const review = {
      id: 1,
      movie: "Inception",
      rating: 5,
      year: 2024,
      month: "March",
      day: 15,
      released: 2010,
      poster: "/inception.jpg",
    };

    act(() => {
      result.current.addReview(review);
    });

    act(() => {
      result.current.deleteReview(999); // Non-existent ID
    });

    expect(result.current.reviews).toHaveLength(1);
    expect(result.current.reviews[0]).toEqual(review);
  });
}); 