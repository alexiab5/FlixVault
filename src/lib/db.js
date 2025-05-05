import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const db = {
  // Movie operations
  async getAllMovies(options = {}) {
    const { genre, sort = 'desc', limit } = options;
    
    return prisma.movie.findMany({
      where: genre ? {
        genres: {
          some: {
            genre: {
              name: genre
            }
          }
        }
      } : undefined,
      orderBy: {
        releaseDate: sort
      },
      take: limit,
      include: {
        genres: {
          include: {
            genre: true
          }
        }
      }
    });
  },

  async getMovieById(id) {
    return prisma.movie.findUnique({
      where: { id: id.toString() },
      include: {
        genres: {
          include: {
            genre: true
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        }
      }
    });
  },

  async getMovieByTmdbId(tmdbId) {
    return prisma.movie.findUnique({
      where: { tmdbId: parseInt(tmdbId) },
      include: {
        genres: {
          include: {
            genre: true
          }
        }
      }
    });
  },

  async createMovie(data) {
    // First ensure all genres exist
    const genrePromises = data.genres?.map(async (genreId) => {
      // Try to find the genre first
      let genre = await prisma.genre.findUnique({
        where: { tmdbId: parseInt(genreId) }
      });

      // If genre doesn't exist, create it
      if (!genre) {
        // Fetch genre details from TMDB
        const response = await fetch(
          `https://api.themoviedb.org/3/genre/movie/list?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
        );
        const { genres } = await response.json();
        const genreDetails = genres.find(g => g.id.toString() === genreId);
        
        if (genreDetails) {
          genre = await prisma.genre.create({
            data: {
              tmdbId: genreDetails.id,
              name: genreDetails.name
            }
          });
        }
      }

      return genre;
    }) || [];

    const genres = await Promise.all(genrePromises);

    const movieData = {
      ...data,
      id: data.id.toString(),
      tmdbId: parseInt(data.tmdbId),
      genres: {
        create: genres.filter(Boolean).map(genre => ({
          genre: {
            connect: { id: genre.id }
          }
        }))
      }
    };

    return prisma.movie.create({
      data: movieData,
      include: {
        genres: {
          include: {
            genre: true
          }
        }
      }
    });
  },

  async updateMovie(id, data) {
    const updateData = {
      ...data,
      id: data.id?.toString(),
      tmdbId: data.tmdbId?.toString(),
      genres: {
        deleteMany: {},
        create: data.genres?.map(genreId => ({
          genre: {
            connect: { id: genreId.toString() }
          }
        }))
      }
    };

    return prisma.movie.update({
      where: { id: id.toString() },
      data: updateData,
      include: {
        genres: {
          include: {
            genre: true
          }
        }
      }
    });
  },

  async deleteMovie(id) {
    return prisma.movie.delete({
      where: { id: id.toString() }
    });
  },

  // Review operations
  async getAllReviews(options = {}) {
    const { rating, sort = 'desc', limit, movieId, userId } = options;
    
    const where = {
      ...(rating && { rating: parseInt(rating) }),
      ...(movieId && { movieId }),
      ...(userId && { userId })
    };
    
    const query = {
      where,
      orderBy: [
        { createdAt: sort },
        { id: sort } // Secondary sort by ID to ensure stable ordering
      ],
      distinct: ['id'],
      include: {
        movie: {
          include: {
            genres: {
              include: {
                genre: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    };

    // Only add take if limit is defined
    if (limit !== undefined) {
      query.take = limit;
    }
    
    const reviews = await prisma.review.findMany(query);

    // Format reviews for the UI while preserving original data
    return reviews.map(review => ({
      ...review,
      // Add UI-specific fields
      movieTitle: review.movie.title,
      released: new Date(review.movie.releaseDate).getFullYear(),
      poster: review.movie.posterPath ? `https://image.tmdb.org/t/p/w500${review.movie.posterPath}` : "/placeholder.svg",
      year: new Date(review.createdAt).getFullYear(),
      month: new Date(review.createdAt).toLocaleString("default", { month: "short" }).toUpperCase(),
      day: String(new Date(review.createdAt).getDate()).padStart(2, "0"),
      genres: review.movie.genres.map(mg => mg.genre.name)
    }));
  },

  async getReviewById(id) {
    return prisma.review.findUnique({
      where: { id },
      include: {
        movie: true,
        user: true
      }
    });
  },

  async createReview(data) {
    return prisma.review.create({
      data,
      include: {
        movie: true,
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });
  },

  async updateReview(id, data, userId, userRole) {
    const review = await prisma.review.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!review) throw new Error('Review not found');
    if (userRole !== 'ADMIN' && review.userId !== userId) {
      throw new Error('Not authorized to update this review');
    }

    // Update the review while preserving the original creation date
    return prisma.review.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date() // Add updatedAt timestamp
      },
      include: {
        movie: {
          include: {
            genres: {
              include: {
                genre: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });
  },

  async deleteReview(id, userId, userRole) {
    const review = await prisma.review.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!review) throw new Error('Review not found');
    if (userRole !== 'ADMIN' && review.userId !== userId) {
      throw new Error('Not authorized to delete this review');
    }

    return prisma.review.delete({
      where: { id }
    });
  },

  // User operations
  async getAllUsers() {
    return prisma.user.findMany({
      include: {
        reviews: true
      }
    });
  },

  async getUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            movie: true
          }
        }
      }
    });
  },

  async createUser({ name, email, password, role = 'USER' }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role
      }
    });
  },

  async getUserByEmail(email) {
    return prisma.user.findUnique({
      where: { email }
    });
  },

  async verifyUser(email, password) {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;
    
    // Don't return the password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async updateUser(id, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return prisma.user.update({
      where: { id },
      data
    });
  },

  async deleteUser(id) {
    return prisma.user.delete({
      where: { id }
    });
  },

  // Genre operations
  async getAllGenres() {
    return prisma.genre.findMany({
      include: {
        movies: {
          include: {
            movie: true
          }
        }
      }
    });
  },

  async getGenreById(id) {
    return prisma.genre.findUnique({
      where: { id },
      include: {
        movies: {
          include: {
            movie: true
          }
        }
      }
    });
  },

  async createGenre(data) {
    return prisma.genre.create({
      data
    });
  },

  async updateGenre(id, data) {
    return prisma.genre.update({
      where: { id },
      data
    });
  },

  async deleteGenre(id) {
    return prisma.genre.delete({
      where: { id }
    });
  },

  // Watchlist operations
  async addToWatchlist(userId, movieId) {
    return prisma.userWatchlist.create({
      data: {
        user: { connect: { id: userId } },
        movie: { connect: { id: movieId } }
      },
      include: {
        movie: true
      }
    });
  },

  async removeFromWatchlist(userId, movieId) {
    return prisma.userWatchlist.delete({
      where: {
        userId_movieId: {
          userId,
          movieId
        }
      }
    });
  },

  async getWatchlist(userId) {
    return prisma.userWatchlist.findMany({
      where: { userId },
      include: {
        movie: {
          include: {
            genres: {
              include: {
                genre: true
              }
            }
          }
        }
      }
    });
  },

  // Count methods for database testing
  async getMovieCount() {
    return await prisma.movie.count();
  },

  async getReviewCount() {
    return await prisma.review.count();
  },

  async getUserCount() {
    return await prisma.user.count();
  },

  async getGenreCount() {
    return await prisma.genre.count();
  }
}; 