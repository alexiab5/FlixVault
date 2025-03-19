import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MovieDiary from "./page";

// Mock Next.js useRouter
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

describe("MovieDiary Page", () => {
  test("Sorts movies in descending order on first click and ascending on second click", () => {
    // Create a mock router
    const mockPush = jest.fn();  // Mocked push function from the router
    const mockRouter = { 
      push: mockPush, 
      query: {}, 
    };

    require("next/router").useRouter.mockReturnValue(mockRouter);

    render(<MovieDiary />);

    const sortButton = screen.getByRole("button", { name: /arrowupdown/i });

    fireEvent.click(sortButton);

    const movieYears = screen.getAllByText(/2024|2025/).map(el => el.textContent);
    expect(movieYears).toEqual(["2025", "2025", "2024", "2024"]); // Descending order

    fireEvent.click(sortButton);
    
    const sortedMovieYears = screen.getAllByText(/2024|2025/).map(el => el.textContent);
    expect(sortedMovieYears).toEqual(["2024", "2024", "2025", "2025"]);
  });

  test("Filters movies to only show ratings 4+ when filter button is clicked", () => {
    const mockPush = jest.fn(); // Mocked push function from the router
    const mockRouter = { 
      push: mockPush, 
      query: {}, 
    };

    require("next/router").useRouter.mockReturnValue(mockRouter);

    render(<MovieDiary />);

    const filterButton = screen.getByRole("button", { name: /filter/i });

    fireEvent.click(filterButton);

    const filteredMovies = screen.getAllByText(/Aftersun|Challengers|Anatomy of a Fall/);
    expect(filteredMovies.length).toBe(3); // Only movies with rating 4

    fireEvent.click(filterButton);

    const allMovies = screen.getAllByText(/Aftersun|Challengers|Anatomy of a Fall|The Holdovers/);
    expect(allMovies.length).toBe(4); 
  });
});
