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

export function exportReviews(reviews) {
  const exportData = reviews.map(review => ({
    id: review.id,
    movie: review.movie,
    released: review.released,
    poster: review.poster,
    genres: review.genres || [],
    rating: review.rating,
    content: review.content,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt
  }))

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `movie-reviews-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importReviews(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const reviews = JSON.parse(e.target.result)
        // Validate the imported data
        if (!Array.isArray(reviews)) {
          throw new Error('Invalid import format: expected an array of reviews')
        }

        const validatedReviews = reviews.map(review => {
          // Ensure all required fields are present
          if (!review.movie || !review.released || !review.rating || !review.content) {
            throw new Error('Invalid review: missing required fields')
          }

          return {
            movie: review.movie,
            released: review.released,
            poster: review.poster || null,
            genres: Array.isArray(review.genres) ? review.genres : [],
            rating: Number(review.rating),
            content: review.content,
            createdAt: review.createdAt || new Date().toISOString(),
            updatedAt: review.updatedAt || new Date().toISOString()
          }
        })

        resolve(validatedReviews)
      } catch (error) {
        reject(new Error(`Failed to import reviews: ${error.message}`))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
