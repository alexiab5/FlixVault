import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const BATCH_SIZE = 1000; // Process in batches of 1000

async function main() {
  console.log('Starting data generation...');

  // Create the default user first
  console.log('Creating default user...');
  const defaultUser = await prisma.user.upsert({
      where: { email: 'default@example.com' },
      update: {},
      create: {
      name: 'Default User',
        email: 'default@example.com',
      password: bcrypt.hashSync('password123', 10),
      role: 'USER',
    },
  });

  console.log('Default user created with ID:', defaultUser.id);

  // Generate additional users in batches
  console.log('Generating additional users...');
  const users = [defaultUser];
  for (let i = 0; i < 999; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, 999 - i);
    const userBatch = Array(batchSize).fill().map(() => ({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: bcrypt.hashSync('password123', 10),
      role: faker.helpers.arrayElement(['USER', 'ADMIN']),
    }));
    
    // Create users and fetch them back to get their IDs
    await prisma.user.createMany({
      data: userBatch,
      skipDuplicates: true,
    });
    
    // Fetch the created users to get their IDs
    const createdUsers = await prisma.user.findMany({
      where: {
        email: {
          in: userBatch.map(user => user.email)
        }
      }
    });
    
    users.push(...createdUsers);
  }

  // Generate Genres
  console.log('Generating genres...');
  const genreNames = [
    'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance',
    'Thriller', 'Documentary', 'Animation', 'Fantasy'
  ];
  
  const genreBatch = genreNames.map((name, index) => ({
    tmdbId: index + 1,
    name,
  }));
  
  await prisma.genre.createMany({
    data: genreBatch,
    skipDuplicates: true,
  });
  
  // Fetch all genres from the database (with their IDs)
  const dbGenres = await prisma.genre.findMany();

  // Generate Movies in batches
  console.log('Generating movies...');
  const movies = [];
  for (let i = 0; i < 10000; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, 10000 - i);
    const movieBatch = Array(batchSize).fill().map(() => ({
      id: faker.string.uuid(),
      tmdbId: i + 1,
      title: faker.lorem.words(3),
      director: faker.person.fullName(),
      releaseDate: faker.date.past(),
      posterPath: faker.image.url(),
      language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de', 'it']),
      voteAverage: faker.number.float({ min: 0, max: 10, precision: 0.1 }),
    }));
    
    await prisma.movie.createMany({
      data: movieBatch,
      skipDuplicates: true,
    });
    movies.push(...movieBatch);
  }

  // Fetch all movies from the database to ensure we have their IDs
  const dbMovies = await prisma.movie.findMany();

  // Generate movie-genre relationships in batches
  console.log('Generating movie-genre relationships...');
  for (let i = 0; i < dbMovies.length; i += BATCH_SIZE) {
    const batchMovies = dbMovies.slice(i, i + BATCH_SIZE);
    const movieGenreBatch = [];
    for (const movie of batchMovies) {
      const movieGenres = faker.helpers.arrayElements(dbGenres, { min: 2, max: 4 });
      for (const genre of movieGenres) {
        movieGenreBatch.push({
          movieId: movie.id,
          genreId: genre.id,
        });
      }
    }
    
    await prisma.movieGenre.createMany({
      data: movieGenreBatch,
      skipDuplicates: true,
    });
  }

  // Generate reviews for the default user first
  console.log('Generating reviews for default user...');
  const defaultUserReviews = [];
  for (let i = 0; i < 100; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, 100 - i);
    const reviewBatch = Array(batchSize).fill().map(() => {
      const movie = faker.helpers.arrayElement(dbMovies);
      return {
        rating: faker.number.int({ min: 1, max: 5 }),
        content: faker.lorem.paragraphs(1),
        movieId: movie.id,
        userId: defaultUser.id,
        likes: faker.number.int({ min: 0, max: 100 }),
        isPublic: faker.datatype.boolean(),
      };
    });
    
    await prisma.review.createMany({
      data: reviewBatch,
      skipDuplicates: true,
    });
    defaultUserReviews.push(...reviewBatch);
  }

  // Generate Reviews for other users in batches
  console.log('Generating reviews for other users...');
  for (let i = 0; i < 900; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, 900 - i);
    const reviewBatch = Array(batchSize).fill().map(() => {
      const user = faker.helpers.arrayElement(users.slice(1)); // Skip default user
      const movie = faker.helpers.arrayElement(dbMovies);
      return {
        rating: faker.number.int({ min: 1, max: 5 }),
        content: faker.lorem.paragraphs(1),
        movieId: movie.id,
        userId: user.id,
        likes: faker.number.int({ min: 0, max: 100 }),
        isPublic: faker.datatype.boolean(),
      };
    });
    
    await prisma.review.createMany({
      data: reviewBatch,
      skipDuplicates: true,
    });
  }

  // Generate Watchlist entries in batches
  console.log('Generating watchlist entries...');
  for (let i = 0; i < 50000; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, 50000 - i);
    const watchlistBatch = Array(batchSize).fill().map(() => {
      const user = faker.helpers.arrayElement(users);
      const movie = faker.helpers.arrayElement(dbMovies);
      return {
        userId: user.id,
        movieId: movie.id,
        addedAt: faker.date.past(),
      };
    });
    
    await prisma.userWatchlist.createMany({
      data: watchlistBatch,
      skipDuplicates: true,
    });
  }

  console.log('Data generation completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 