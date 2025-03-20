/**
 * @typedef {Object} MovieReview
 * @property {number} id
 * @property {number} year
 * @property {string} month
 * @property {string} day
 * @property {string} movie
 * @property {string} poster
 * @property {number} released
 * @property {number} rating
 * @property {string} review
 */

/** @type {MovieReview[]} */
const movieReviews = [
  {
    id: 1,
    year: 2025,
    month: 'MAR',
    day: '01',
    movie: 'Aftersun',
    poster: '/images/movies/Aftersun.jpg',
    released: 2022,
    rating: 5,
    review: "A deeply moving and beautifully shot film. The performances are subtle yet powerful, and the storytelling is masterful."
  },
  {
    id: 2,
    year: 2025,
    month: 'FEBR',
    day: '13',
    movie: 'Challengers',
    poster: '/images/movies/Challengers.jpg',
    released: 2024,
    rating: 4,
    review: "An intense and thrilling drama with strong performances. The cinematography and direction make it an engaging watch."
  },
  {
    id: 3,
    year: 2024,
    month: 'DEC',
    day: '20',
    movie: 'Anatomy of a Fall',
    poster: '/images/movies/Anatomy-of-a-Fall.jpg',
    released: 2023,
    rating: 4,
    review: "A gripping courtroom drama with layers of complexity. The script and acting are top-notch, making it a thought-provoking film."
  },
  {
    id: 4,
    year: 2024,
    month: 'DEC',
    day: '18',
    movie: 'The Holdovers',
    poster: '/images/movies/Holdovers.jpg',
    released: 2023,
    rating: 3,
    review: "A nostalgic and heartwarming film, though it drags at times. The characters are well-developed, making it a worthwhile watch."
  }
];

export default movieReviews;
