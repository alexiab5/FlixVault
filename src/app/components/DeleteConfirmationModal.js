"use client"

export default function DeleteConfirmationModal({ review, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-lg z-[9999] flex items-center justify-center">
      <div className="bg-pink-200 rounded-3xl p-8 w-full max-w-md relative shadow-2xl border border-pink-300">
        <h2 className="text-2xl font-bold text-pink-800 mb-4 text-center">
          Delete Review
        </h2>
        
        <p className="text-pink-700 mb-6 text-center">
          Are you sure you want to delete your review for <span className="font-semibold">{review.movie?.title || review.movie}</span>?
          This action cannot be undone.
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="bg-pink-300 hover:bg-pink-400 text-pink-800 font-medium py-2 px-6 rounded-full transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-6 rounded-full transition-colors cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
} 