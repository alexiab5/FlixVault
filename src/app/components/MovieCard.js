export default function MovieCard({ movie }) {
    console.log(movie);  // Log the movie prop to ensure it's coming correctly

    return (
      <div className="movie-card">
        <h3>{movie.title}</h3>
        <p>{movie.description}</p>
        <p>Released: {movie.year}</p>
      </div>
    );
  }