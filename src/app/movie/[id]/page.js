"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getMovieById } from "D:/MPP/flix-vault/src/lib/movie-data.ts";
import { useReviewDiary } from "../../../context/ReviewDiaryContext";

export default function MovieDetail() {
  const { addReview } = useReviewDiary(); // Get addReview function from context
  const params = useParams();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const movieId = params.id;

  const movie = getMovieById(movieId);

  useEffect(() => {
    if (!movie) {
      router.push("/");
    }
  }, [movie, router]);

  if (!movie) return null;

  const handleClose = () => {
    router.push("/");
  };

  const handleAddEntry = () => {
    const newEntry = {
      id: Date.now(),
      year: new Date().getFullYear(),
      month: new Date().toLocaleString("default", { month: "short" }).toUpperCase(),
      day: String(new Date().getDate()).padStart(2, "0"),
      movie: movie.title,
      poster: movie.posterUrl || "/placeholder.svg",
      released: movie.year,
      rating,
      review,
    };

    addReview(newEntry); // Add to in-memory state
    router.push("/diary"); // Navigate to diary page
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <h2 className="text-2xl text-white text-center mb-8">I watched...</h2>

      <div className="relative bg-black/30 backdrop-blur-md rounded-lg p-6 w-full max-w-2xl">
        <button onClick={handleClose} className="absolute top-2 right-2 text-white hover:bg-white/10 rounded-full p-1">
          {/* Close button */}
        </button>

        <h2 className="text-2xl text-white text-center mb-6">
          {movie.title} ({movie.year})
        </h2>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <img src={movie.posterUrl || "/placeholder.svg"} alt={movie.title} className="w-32 h-48 object-cover rounded-md mx-auto" />

            <div className="flex justify-center mt-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="text-2xl cursor-pointer">
                  {star <= rating ? "★" : "☆"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-grow">
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Write a review..."
              className="w-full h-65 p-3 rounded-md bg-white/10 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
            />

            <button onClick={handleAddEntry} className="mt-4 px-6 py-2 bg-pink-500 hover:bg-pink-600 cursor-pointer text-white rounded-full float-right">
              Add entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
