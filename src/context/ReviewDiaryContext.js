"use client";

import { createContext, useContext, useState, useEffect } from "react";
import movieReviews from "../lib/reviews";

const ReviewDiaryContext = createContext();

export function ReviewDiaryProvider({ children }) {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    setReviews(movieReviews); // Populate with initial data on mount
  }, []);

  const addReview = (newReview) => {
    setReviews((prevReviews) => [newReview, ...prevReviews]);
  };

  return (
    <ReviewDiaryContext.Provider value={{ reviews, addReview }}>
      {children}
    </ReviewDiaryContext.Provider>
  );
}

export function useReviewDiary() {
  return useContext(ReviewDiaryContext);
}
