import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.review.deleteMany();
  await prisma.userWatchlist.deleteMany();
  await prisma.movieGenre.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.user.deleteMany();
  await prisma.genre.deleteMany();

  // Create genres from TMDB's standard list
  const genres = await Promise.all([
    prisma.genre.upsert({ 
      where: { tmdbId: 28 },
      update: {},
      create: { tmdbId: 28, name: 'Action' }
    }),
    prisma.genre.upsert({ 
      where: { tmdbId: 12 },
      update: {},
      create: { tmdbId: 12, name: 'Adventure' }
    }),
    prisma.genre.upsert({ 
      where: { tmdbId: 16 },
      update: {},
      create: { tmdbId: 16, name: 'Animation' }
    }),
    prisma.genre.upsert({ 
      where: { tmdbId: 35 },
      update: {},
      create: { tmdbId: 35, name: 'Comedy' }
    }),
    prisma.genre.upsert({ 
      where: { tmdbId: 80 },
      update: {},
      create: { tmdbId: 80, name: 'Crime' }
    }),
    prisma.genre.upsert({ 
      where: { tmdbId: 99 },
      update: {},
      create: { tmdbId: 99, name: 'Documentary' }
    }),
    prisma.genre.upsert({ 
      where: { tmdbId: 18 },
      update: {},
      create: { tmdbId: 18, name: 'Drama' }
    }),
    prisma.genre.upsert({ 
      where: { tmdbId: 10751 },
      update: {},
      create: { tmdbId: 10751, name: 'Family' }
    }),
    prisma.genre.upsert({ 
      where: { tmdbId: 14 },
      update: {},
      create: { tmdbId: 14, name: 'Fantasy' }
    }),
    prisma.genre.upsert({ 
      where: { tmdbId: 36 },
      update: {},
      create: { tmdbId: 36, name: 'History' }
    }),
    prisma.genre.upsert({ 
      where: { tmdbId: 27 },
      update: {},
      create: { tmdbId: 27, name: 'Horror' }
    }),
    prisma.genre.upsert({ 
      where: { tmdbId: 10402 },
      update: {},
      create: { tmdbId: 10402, name: 'Music' }
    }),
    prisma.genre.upsert({ 
      where: { tmdbId: 9648 },
      update: {},
      create: { tmdbId: 9648, name: 'Mystery' }
    }),
    prisma.genre.upsert({ 
      where: { tmdbId: 10749 },
      update: {},
      create: { tmdbId: 10749, name: 'Romance' }
    }),
    prisma.genre.upsert({ 
      where: { tmdbId: 878 },
      update: {},
      create: { tmdbId: 878, name: 'Science Fiction' }
    }),
    prisma.genre.upsert({ 
      where: { tmdbId: 10770 },
      update: {},
      create: { tmdbId: 10770, name: 'TV Movie' }
    }),
    prisma.genre.upsert({ 
      where: { tmdbId: 53 },
      update: {},
      create: { tmdbId: 53, name: 'Thriller' }
    }),
    prisma.genre.upsert({ 
      where: { tmdbId: 10752 },
      update: {},
      create: { tmdbId: 10752, name: 'War' }
    }),
    prisma.genre.upsert({ 
      where: { tmdbId: 37 },
      update: {},
      create: { tmdbId: 37, name: 'Western' }
    })
  ]);

  // Create users with hashed passwords
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'ADMIN'
      }
    }),
    prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {},
      create: {
        name: 'Regular User',
        email: 'user@example.com',
        password: await bcrypt.hash('user123', 10),
        role: 'USER'
      }
    }),
    prisma.user.upsert({
      where: { email: 'default@example.com' },
      update: {},
      create: {
        email: 'default@example.com',
        name: 'Default User',
        password: 'hashed_password_here', // In a real app, this should be properly hashed
        role: 'USER'
      }
    })
  ]);

  // Create sample movies with genres
  const movies = await Promise.all([
    prisma.movie.upsert({
      where: { id: '1' },
      update: {},
      create: {
        id: '1',
        tmdbId: 278,
        title: 'The Shawshank Redemption',
        director: 'Frank Darabont',
        releaseDate: new Date('1994-09-23'),
        posterPath: '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
        language: 'en',
        voteAverage: 8.7,
        genres: {
          create: [
            { genre: { connect: { tmdbId: 18 } } }, // Drama
            { genre: { connect: { tmdbId: 80 } } }  // Crime
          ]
        }
      }
    }),
    prisma.movie.upsert({
      where: { id: '2' },
      update: {},
      create: {
        id: '2',
        tmdbId: 238,
        title: 'The Godfather',
        director: 'Francis Ford Coppola',
        releaseDate: new Date('1972-03-14'),
        posterPath: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
        language: 'en',
        voteAverage: 8.7,
        genres: {
          create: [
            { genre: { connect: { tmdbId: 18 } } }, // Drama
            { genre: { connect: { tmdbId: 80 } } }  // Crime
          ]
        }
      }
    })
  ]);

  // Create sample reviews
  await Promise.all([
    prisma.review.create({
      data: {
        rating: 5,
        content: 'A masterpiece of cinema. Timeless storytelling at its best.',
        movie: { connect: { id: movies[0].id } },
        user: { connect: { id: users[0].id } }
      }
    }),
    prisma.review.create({
      data: {
        rating: 5,
        content: 'The definitive crime drama. Marlon Brando delivers an iconic performance.',
        movie: { connect: { id: movies[1].id } },
        user: { connect: { id: users[1].id } }
      }
    })
  ]);

  // Add movies to user watchlists
  await Promise.all([
    prisma.userWatchlist.upsert({
      where: {
        userId_movieId: {
          userId: users[0].id,
          movieId: movies[1].id
        }
      },
      update: {},
      create: {
        user: { connect: { id: users[0].id } },
        movie: { connect: { id: movies[1].id } }
      }
    }),
    prisma.userWatchlist.upsert({
      where: {
        userId_movieId: {
          userId: users[1].id,
          movieId: movies[0].id
        }
      },
      update: {},
      create: {
        user: { connect: { id: users[1].id } },
        movie: { connect: { id: movies[0].id } }
      }
    })
  ]);

  console.log({ defaultUser: users[2] });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 