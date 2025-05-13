-- Add compound index for createdAt and id
CREATE INDEX "Review_createdAt_id_idx" ON "Review"("createdAt" DESC, id);

-- Index for filtering reviews by rating
CREATE INDEX "Review_rating_createdAt_idx" ON "Review"(rating, "createdAt" DESC);

-- Index for filtering reviews by user
CREATE INDEX "Review_userId_createdAt_idx" ON "Review"("userId", "createdAt" DESC);

-- Index for filtering reviews by movie and rating
CREATE INDEX "Review_movieId_rating_idx" ON "Review"("movieId", rating); 