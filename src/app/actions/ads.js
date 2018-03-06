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

export const trackImpression = id => async (dispatch, getState) => {
  const state = getState();
  const post = state.posts[id];

  firePixelsOfType(post.events, AdEvents.Impression);
};

export const trackViewableImpression = id => async (dispatch, getState) => {
  const state = getState();
  const post = state.posts[id];

  firePixelsOfType(post.events, AdEvents.ViewableImpression);
};

// Used by Rendered Ads if they detect that adblock has hidden
// their content node. This only a thunk'd action because
// `logClientAdblock` needs access to state
// placementIndex -- the index in the post list
export const trackAdHidden = placementIndex => async (dispatch, getState) => {
  logClientAdblock('element-hidden', placementIndex, getState());
};
