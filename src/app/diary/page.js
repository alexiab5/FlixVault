'use client';

import Image from 'next/image';
import { useState } from 'react';
import clsx from 'clsx';
import Icons from "@/components/Icons";

// Custom Card Component
const Card = ({ className, children, ...props }) => {
  return (
    <div className={clsx('bg-white/20 backdrop-blur-sm p-6 rounded-3xl shadow-lg', className)} {...props}>
      {children}
    </div>
  );
};

// Custom Button Component
const buttonVariants = {
  ghost: 'bg-transparent hover:bg-white/10 text-white rounded-full p-2',
};

const Button = ({ className, variant = 'ghost', size = 'icon', children, ...props }) => {
  return (
    <button className={clsx(buttonVariants[variant], className)} {...props}>
      {children}
    </button>
  );
};

// Sample movie data
const movieData = [
  {
    id: 1,
    year: 2025,
    month: 'MAR',
    day: '01',
    movie: 'Aftersun',
    poster: '/images/movies/Aftersun.jpg?height=100&width=70',
    released: 2022,
    rating: 5,
  },
  {
    id: 2,
    year: 2025,
    month: 'FEBR',
    day: '13',
    movie: 'Challengers',
    poster: '/images/movies/Challengers.jpg?height=100&width=70',
    released: 2024,
    rating: 4,
  },
  {
    id: 3,
    year: 2024,
    month: 'DEC',
    day: '20',
    movie: 'Anatomy of a Fall',
    poster: '/images/movies/Anatomy-of-a-Fall.jpg?height=100&width=70',
    released: 2023,
    rating: 4,
  },
  {
    id: 4,
    year: 2024,
    month: 'DEC',
    day: '18',
    movie: 'The Holdovers',
    poster: '/images/movies/Holdovers.jpg?height=100&width=70',
    released: 2023,
    rating: 3,
  },
];

export default function MovieDiary() {
  const [movies] = useState(movieData);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation */}
      <nav className="flex justify-center space-x-8 text-white text-xl mb-12">
        <a href="#" className="hover:opacity-80 transition-opacity">Log In</a>
        <a href="#" className="hover:opacity-80 transition-opacity">Home</a>
        <a href="#" className="hover:opacity-80 transition-opacity">Diary</a>
        <a href="#" className="hover:opacity-80 transition-opacity">Lists</a>
        <a href="#" className="hover:opacity-80 transition-opacity">Recommendations</a>
      </nav>

      {/* Main Content */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-white mb-8">Your Diary</h1>

        <Card>
          {/* Action Buttons */}
          <div className="flex justify-end mb-4 space-x-2">
            <Button variant="ghost" size="icon" className="text-white">
              <Icons.Pencil />
            </Button>
            <Button variant="ghost" size="icon" className="text-white">
              <Icons.Trash />
            </Button>
            <Button variant="ghost" size="icon" className="text-white">
              <Icons.Filter />
            </Button>
            <Button variant="ghost" size="icon" className="text-white">
              <Icons.ArrowUpDown />
            </Button>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-7 text-white text-lg font-medium mb-4 border-b border-white/20 pb-2">
            <div className="text-center">Year</div>
            <div className="text-center">Month</div>
            <div className="text-center">Day</div>
            <div className="text-center">Movie</div>
            <div className="text-center">Released</div>
            <div className="text-center">Rating</div>
            <div className="text-center">Review</div>
          </div>

          {/* Movie Entries */}
          <div className="space-y-8">
            {movies.map((movie) => (
              <div key={movie.id} className="grid grid-cols-7 items-center text-white border-b border-white/10 pb-8">
                <div className="flex justify-center items-center">
                  <div className="w-6 h-6 rounded-full border border-white/50 flex items-center justify-center mr-2"></div>
                  <span>{movie.year}</span>
                </div>
                <div className="text-center">{movie.month}</div>
                <div className="text-center">{movie.day}</div>
                <div className="flex justify-center">
                  <Image src={movie.poster || '/placeholder.svg'} alt={movie.movie} width={70} height={100} className="rounded-md" />
                </div>
                <div className="text-center">{movie.released}</div>
                <div className="text-center">
                  <div className="flex justify-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < movie.rating ? 'text-white' : 'text-white/30'}>★</span>
                    ))}
                  </div>
                </div>
                <div className="text-center">
                <Button variant="ghost" size="icon" className="text-white">
                  <Icons.ArrowUpRight />
                </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}