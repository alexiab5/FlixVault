"use client"

import { useReviewDiary } from '../../context/ReviewDiaryContext';

export default function OfflineStatusBanner() {
  const { isNetworkDown, isServerDown } = useReviewDiary();
  
  if (!isNetworkDown && !isServerDown) return null;
  
  return (
    <div className={`
      fixed top-0 left-0 right-0 p-2 text-center text-white z-50
      ${isNetworkDown ? 'bg-red-600' : 'bg-amber-600'}
    `}>
      {isNetworkDown ? (
        <span>Network connection lost. Working in offline mode.</span>
      ) : (
        <span>Server is unreachable. Working in offline mode.</span>
      )}
    </div>
  );
}