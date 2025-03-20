'use client';

import Image from 'next/image';
import { useState } from 'react';
import clsx from 'clsx';
import Icons from "@/components/Icons";
import { useRouter } from 'next/navigation';
import { useReviewDiary } from '../../context/ReviewDiaryContext';

const Card = ({ className, children, ...props }) => {
  return (
    <div className={clsx('bg-white/20 backdrop-blur-sm p-6 rounded-3xl shadow-lg', className)} {...props}>
      {children}
    </div>
  );
};

const buttonVariants = {
  ghost: 'bg-transparent hover:bg-white/10 text-white rounded-full p-2 cursor-pointer',
};

const Button = ({ className, variant = 'ghost', children, ...props }) => {
  return (
    <button className={clsx(buttonVariants[variant], className)} {...props}>
      {children}
    </button>
  );
};

export default function MovieDiary() {
  const { reviews } = useReviewDiary(); // Use global state

  const [sortOrder, setSortOrder] = useState('desc');
  const [checkedReview, setCheckedReview] = useState(null);
  const [filtered, setFiltered] = useState(false);
  const router = useRouter();

  const handleRadioClick = (reviewId) => {
    setCheckedReview(checkedReview === reviewId ? null : reviewId);
  };

  const handleSearchPageNavigation = () => {
    router.push('/search');
  };

  const handleSort = () => {
    const sortedReviews = [...reviews].sort((a, b) => {
      const dateA = new Date(a.year, new Date(Date.parse(a.month + " 1, 2000")).getMonth(), a.day);
      const dateB = new Date(b.year, new Date(Date.parse(b.month + " 1, 2000")).getMonth(), b.day);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const handleFilter = () => {
    setFiltered(!filtered);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-3">
        <h2 className="text-2xl font-bold text-white mb-1">Your Diary</h2>
        <Card>
          <div className="flex justify-end mb-4 space-x-2">
            <Button onClick={handleSearchPageNavigation} className="text-white"><Icons.SquaresPlus /></Button>
            <Button className="text-white"><Icons.Pencil /></Button>
            <Button className="text-white"><Icons.Trash /></Button>
            <Button className="text-white" onClick={handleFilter}><Icons.Filter /></Button>
            <Button className="text-white" onClick={handleSort}><Icons.ArrowUpDown /></Button>
          </div>

          <div className="grid grid-cols-7 text-white text-lg font-medium mb-4 border-b border-white/20 pb-2">
            <div className="text-center">Year</div>
            <div className="text-center">Month</div>
            <div className="text-center">Day</div>
            <div className="text-center">Movie</div>
            <div className="text-center">Released</div>
            <div className="text-center">Rating</div>
            <div className="text-center">Review</div>
          </div>

          <div className="max-h-[calc(7*4rem)] overflow-y-auto space-y-8">
            {reviews.map((review) => (
              <div key={review.id} className="grid grid-cols-7 items-center text-white border-b border-white/10 pb-8">
                <div className="flex justify-center items-center">
                  <div onClick={() => handleRadioClick(review.id)} className="w-5 h-5 rounded-full border-2 border-white/50 flex items-center justify-center mr-2 cursor-pointer">
                    <Icons.RadioButton checked={checkedReview === review.id} />
                  </div>
                  <span>{review.year}</span>
                </div>
                <div className="text-center">{review.month}</div>
                <div className="text-center">{review.day}</div>
                <div className="flex justify-center">
                  <Image src={review.poster} alt={review.movie} width={70} height={100} className="rounded-md" />
                </div>
                <div className="text-center">{review.released}</div>
                <div className="text-center flex justify-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < review.rating ? 'text-white' : 'text-white/30'}>★</span>
                  ))}
                </div>
                <div className="text-center">
                  <Button className="text-white"><Icons.ArrowUpRight /></Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
