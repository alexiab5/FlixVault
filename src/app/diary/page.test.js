import React from "react"; // Ensure React is imported
import { render, screen, fireEvent } from "@testing-library/react";
import MovieDiary from "./page";

// Mock Next.js useRouter before the tests
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

describe("MovieDiary Page", () => {
  test("Sorts movies in descending order on first click and ascending on second click", () => {
    // Create a mock router
    const mockPush = jest.fn();  // Mocked push function from the router
    const mockRouter = { 
      push: mockPush, 
      query: {}, // Optionally add query parameters to the mock if needed
    };

    // Mock the useRouter hook with the mockRouter object
    require("next/router").useRouter.mockReturnValue(mockRouter);

    // Now render the component after mocking the router
    render(<MovieDiary />);

    const sortButton = screen.getByRole("button", { name: /arrowupdown/i });

    // Click to sort descending
    fireEvent.click(sortButton);

    const movieYears = screen.getAllByText(/2024|2025/).map(el => el.textContent);
    expect(movieYears).toEqual(["2025", "2025", "2024", "2024"]); // Descending order

    // Click again to sort ascending
    fireEvent.click(sortButton);
    
    const sortedMovieYears = screen.getAllByText(/2024|2025/).map(el => el.textContent);
    expect(sortedMovieYears).toEqual(["2024", "2024", "2025", "2025"]); // Ascending order
  });

  test("Filters movies to only show ratings 4+ when filter button is clicked", () => {
    const mockPush = jest.fn(); // Mocked push function from the router
    const mockRouter = { 
      push: mockPush, 
      query: {}, // Optionally add query parameters to the mock if needed
    };

    // Mock the router
    require("next/router").useRouter.mockReturnValue(mockRouter);

    render(<MovieDiary />);

    const filterButton = screen.getByRole("button", { name: /filter/i });

    // Click to filter
    fireEvent.click(filterButton);

    const filteredMovies = screen.getAllByText(/Aftersun|Challengers|Anatomy of a Fall/);
    expect(filteredMovies.length).toBe(3); // Only movies with rating 4+

    // Click again to reset filter
    fireEvent.click(filterButton);

    const allMovies = screen.getAllByText(/Aftersun|Challengers|Anatomy of a Fall|The Holdovers/);
    expect(allMovies.length).toBe(4); // All movies back
  });
});
