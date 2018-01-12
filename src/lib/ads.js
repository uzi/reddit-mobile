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
