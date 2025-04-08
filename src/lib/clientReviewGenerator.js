// Client-side review generator
// This is a simplified version that doesn't depend on server-side modules

// Sample movie database
const movieDatabase = [
  { title: 'Aftersun', poster: '/images/movies/Aftersun.jpg', released: 2022 },
  { title: 'Challengers', poster: '/images/movies/Challengers.jpg', released: 2024 },
  { title: 'Anatomy of a Fall', poster: '/images/movies/Anatomy-of-a-Fall.jpg', released: 2023 },
  { title: 'The Holdovers', poster: '/images/movies/Holdovers.jpg', released: 2023 },
  { title: 'A Complete Unkown', poster: '/images/movies/A-Complete-Unkown.jpg', released: 2025 },
  { title: 'Frances Ha', poster: '/images/movies/FrancesHa.jpg', released: 2012 },
  { title: 'Gladiator II', poster: '/images/movies/GladiatorII.jpg', released: 2024 },
  { title: 'Gladiator', poster: '/images/movies/Gladiator.jpg', released: 2000 },
  { title: 'Glass Onion', poster: '/images/movies/GlassOnion.jpg', released: 2022 },
  { title: 'La Chimera', poster: '/images/movies/La-Chimera.jpg', released: 2023 },
  { title: 'La la land', poster: '/images/movies/Lalaland.jpg', released: 2016 },
  { title: 'Taxi Driver', poster: '/images/movies/Taxi-Driver.jpg', released: 1976 },
  { title: 'The-Brutalist', poster: '/images/movies/The-Brutalist.jpg', released: 2024 },
  { title: 'The Worst Person in the World', poster: '/images/movies/The-Worst-Person.jpg', released: 2021 },
  { title: 'Portrait of a lady on fire', poster: '/images/movies/Portrait-of-a-Lady.jpg', released: 2019 },
  { title: 'In Bruges', poster: '/images/movies/In-Bruges.jpg', released: 2008 },
];

// Sample review templates
const reviewTemplates = [
  "A {adjective} film with {adjective} performances. The {element} really stands out.",
  "This {adjective} movie offers a {adjective} take on its genre. {element} is particularly noteworthy.",
  "{adjective} and {adjective}. The {element} makes this film worth watching.",
  "A {adjective} addition to the director's filmography. The {element} is {adjective}.",
  "Not without flaws, but the {adjective} {element} compensates for its shortcomings."
];

const adjectives = [
  'compelling', 'powerful', 'moving', 'stunning', 'thought-provoking', 
  'beautiful', 'intense', 'captivating', 'refreshing', 'impressive',
  'underwhelming', 'riveting', 'emotional', 'profound', 'inventive'
];

const elements = [
  'cinematography', 'screenplay', 'direction', 'acting', 'score', 
  'visual effects', 'character development', 'storytelling', 'editing', 'production design'
];

// Counter for generating unique IDs
let idCounter = 0;

// Generate random review
export function generateReview() {
  const movie = movieDatabase[Math.floor(Math.random() * movieDatabase.length)];
  const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
  
  // Format the review text by replacing placeholders
  let reviewText = template
    .replace('{adjective}', adjectives[Math.floor(Math.random() * adjectives.length)])
    .replace('{adjective}', adjectives[Math.floor(Math.random() * adjectives.length)])
    .replace('{element}', elements[Math.floor(Math.random() * elements.length)]);
  
  // Generate date
  const now = new Date();
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  
  // Create a truly unique ID using multiple components
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  idCounter++;
  const uniqueId = `${timestamp}-${random}-${idCounter}`;
  
  // Create review object
  const review = {
    id: uniqueId,
    year: now.getFullYear(),
    month: months[now.getMonth()],
    day: String(now.getDate()).padStart(2, '0'),
    movie: movie.title,
    poster: movie.poster,
    released: movie.released,
    rating: Math.floor(Math.random() * 5) + 1, // 1-5 rating
    review: reviewText
  };
  
  return review;
} 