import LRUCache from 'lib/LRUCache';

const firedPixels = new LRUCache(1000);

export const AdEvents = {
  Impression: 1,
  Click: 2,
  CommentsView: 3,
  Upvote: 4,
  Downvote: 5,
  CommentSubmitted: 6,
  ViewableImpression: 7,
  CommentUpvote: 8,
  CommentDownvote: 9,
  VideoViewableImpression: 100,
  VideoFullyViewableImpression: 101,
  VideoPlayedWithSound: 102,
  VideoPlayedExpanded: 103,
  VideoWatched25: 104,
  VideoWatched50: 105,
  VideoWatched75: 106,
  VideoWatched95: 107,
  VideoWatched100: 108,
  VideoStarted: 109,
  VideoWatchedSeconds3: 110,
  VideoWatchedSeconds5: 111,
  VideoWatchedSeconds6: 112,
};

export const firePixel = (pixel) => {
  if (firedPixels.get(pixel)) { return; }

  const img = new Image();
  img.src = pixel;
  firedPixels.set(pixel, true);
};

export const firePixelsOfType = (pixels, type) => {
  pixels
    .filter(e => e.type === type)
    .map(e => e.url)
    .forEach(firePixel);
};
