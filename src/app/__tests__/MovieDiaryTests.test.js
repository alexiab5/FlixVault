import { render, screen, fireEvent } from "@testing-library/react";
import { useReviewDiary } from "../../context/ReviewDiaryContext";
import MovieDiary from "@/diary/page";

// Mock the context
jest.mock("../../context/ReviewDiaryContext", () => ({
  useReviewDiary: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("MovieDiary Component", () => {
  let mockContext;

  beforeEach(() => {
    mockContext = {
      reviews: [
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
      ],
      deleteReview: jest.fn(),
      sortReviews: jest.fn(),
    };

    useReviewDiary.mockReturnValue(mockContext);
  });

  test("renders movie diary with reviews", () => {
    render(<MovieDiary />);

    screen.debug();
    
    expect(screen.getByText("Your Diary")).toBeInTheDocument();
    expect(screen.getByText(/Inception/i, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/Interstellar/i, { exact: false })).toBeInTheDocument();
  });

  test("deletes a selected review", () => {
    render(<MovieDiary />);
    
    // Select the first review (Inception)
    fireEvent.click(screen.getByText("2024")); // Clicks radio button

    // Click the delete button
    fireEvent.click(screen.getByRole("button", { name: /trash/i }));

    expect(mockContext.deleteReview).toHaveBeenCalledWith(1); // Check if deleteReview was called with the correct ID
  });

  test("navigates to edit-review page", () => {
    const { container } = render(<MovieDiary />);
    
    // Select a review
    fireEvent.click(screen.getByText("2024")); 

    // Click edit button
    const editButton = container.querySelector("button:nth-child(2)");
    fireEvent.click(editButton);

    expect(mockContext.deleteReview).not.toHaveBeenCalled(); // Ensure it didn't delete
  });

  test("sorts reviews when sort button is clicked", () => {
    render(<MovieDiary />);

    fireEvent.click(screen.getByRole("button", { name: /arrowupdown/i }));

    expect(mockContext.sortReviews).toHaveBeenCalled();
  });

  test("filters reviews by rating", () => {
    render(<MovieDiary />);

    // Open filter dropdown
    fireEvent.click(screen.getByRole("button", { name: /filter/i }));

    // Select a rating (4 stars)
    fireEvent.click(screen.getByLabelText("4-star rating"));

    // The 5-star movie should be hidden
    expect(screen.queryByText("Inception")).not.toBeInTheDocument();

    // The 4-star movie should be visible
    expect(screen.getByText(/Interstellar/i, { exact: false })).toBeInTheDocument();
  });

  test("clears filters", () => {
    render(<MovieDiary />);

    // Open filter dropdown and select a rating
    fireEvent.click(screen.getByRole("button", { name: /filter/i }));
    fireEvent.click(screen.getByLabelText("4-star rating"));

    // Clear filters
    fireEvent.click(screen.getByRole("button", { name: /clear filter/i }));

    // Both movies should be visible again
    expect(screen.getByText(/Inception/i, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/Interstellar/i, { exact: false })).toBeInTheDocument();
  });
});
