import { logClientAdblock } from 'lib/eventUtils';
import { firePixelsOfType, AdEvents } from 'lib/ads';

export const FETCHING = 'FETCHING_AD';
export const fetching = (adId, postsListId) => ({
  type: FETCHING,
  adId,
  postsListId,
});

export const RECEIVED = 'RECEIVED_AD';
export const received = (adId, model) => ({
  type: RECEIVED,
  adId,
  model,
});

export const NO_AD = 'NO_AD';
export const noAd = adId => ({
  type: NO_AD,
  adId,
});

export const FALLBACK_AD = 'FALLBACK_AD';
export const fallbackAd = adId => ({
  type: FALLBACK_AD,
  adId,
});

export const FAILED = 'FAILED_AD_FETCH';
export const failed = (adId, error) => ({
  type: FAILED,
  adId,
  error,
});

export const TRACKING_AD = 'TRACKING_AD';
export const tracking = adId => ({
  type: TRACKING_AD,
  adId,
});

export const VIDEO_AD_BUFFERING = 'VIDEO_AD_BUFFERING';
export const videoAdBuffering = (postId, hasBuffered) => ({
  type: VIDEO_AD_BUFFERING,
  hasBuffered,
  postId,
});

export const VIDEO_CURRENT_VIEW_STARTED_AT = 'VIDEO_CURRENT_VIEW_STARTED_AT';
export const videoCurrentViewStartedAt = (postId, newTime) => ({
  type: VIDEO_CURRENT_VIEW_STARTED_AT,
  newTime,
  postId,
});

export const trackImpression = id => async (dispatch, getState) => {
  const state = getState();
  const post = state.posts[id];

  firePixelsOfType(post.events, AdEvents.Impression);
};

export const updateBufferedStatus = (postId, hasBuffered) => async dispatch => {
  dispatch(videoAdBuffering(postId, hasBuffered));
};

export const updateVideoSeekedStatus = (postId, newTime) => async dispatch => {
  dispatch(videoCurrentViewStartedAt(postId, newTime));
};

export const trackViewableImpression = id => async (dispatch, getState) => {
  const state = getState();
  const post = state.posts[id];
  firePixelsOfType(post.events, AdEvents.ViewableImpression);
};

export const trackVideoViewableImpression = id => async (dispatch, getState) => {
  const state = getState();
  const post = state.posts[id];
  firePixelsOfType(post.events, AdEvents.VideoViewableImpression);
};

export const trackVideoFullyViewableImpression = id => async (dispatch, getState) => {
  const state = getState();
  const post = state.posts[id];
  firePixelsOfType(post.events, AdEvents.VideoFullyViewableImpression);
};

export const trackVideoPlayedWithSound = id => async (dispatch, getState) => {
  const state = getState();
  const post = state.posts[id];
  // According to specs, all viewable events also fire when a video ad
  // is played with sound
  firePixelsOfType(post.events, AdEvents.VideoViewableImpression);
  firePixelsOfType(post.events, AdEvents.VideoFullyViewableImpression);
  firePixelsOfType(post.events, AdEvents.VideoPlayedWithSound);
};

export const trackVideoPlayedExpanded = id => async (dispatch, getState) => {
  const state = getState();
  const post = state.posts[id];
  // According to specs, all viewable events also fire when a video ad
  // is played in full screen
  firePixelsOfType(post.events, AdEvents.VideoViewableImpression);
  firePixelsOfType(post.events, AdEvents.VideoFullyViewableImpression);
  firePixelsOfType(post.events, AdEvents.VideoPlayedExpanded);
};

export const trackVideoWatchedPercent = (id, percent) => async (dispatch, getState) => {
  const state = getState();
  const post = state.posts[id];
  const adEvent = percent === 25 ? AdEvents.VideoWatched25 :
                  percent === 50 ? AdEvents.VideoWatched50 :
                  percent === 75 ? AdEvents.VideoWatched75 :
                  percent === 95 ? AdEvents.VideoWatched95 :
                  AdEvents.VideoWatched100;
  firePixelsOfType(post.events, adEvent);
};

// Used by Rendered Ads if they detect that adblock has hidden
// their content node. This only a thunk'd action because
// `logClientAdblock` needs access to state
// placementIndex -- the index in the post list
export const trackAdHidden = placementIndex => async (dispatch, getState) => {
  logClientAdblock('element-hidden', placementIndex, getState());
};
