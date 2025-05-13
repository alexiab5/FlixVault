-- CreateIndex
CREATE INDEX "Movie_releaseDate_idx" ON "Movie"("releaseDate");

-- CreateIndex
CREATE INDEX "Movie_voteAverage_idx" ON "Movie"("voteAverage");

-- CreateIndex
CREATE INDEX "Movie_language_idx" ON "Movie"("language");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

-- CreateIndex
CREATE INDEX "Review_likes_idx" ON "Review"("likes");

-- CreateIndex
CREATE INDEX "UserWatchlist_addedAt_idx" ON "UserWatchlist"("addedAt");
