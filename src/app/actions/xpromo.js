import { XPROMO_MODAL_LISTING_CLICK_NAME } from 'app/constants';

import {
  getXPromoListingClickLink,
  markBannerClosed,
  markListingClickTimestampLocalStorage,
  setModalDismissCountLocalStorage,
  shouldNotShowBanner,
  listingClickInitialState as getListingClickInitialState,
  isXPromoPersistentEnabled,
} from 'lib/xpromoState';

import {
  XPROMO_APP_STORE_VISIT,
  XPROMO_DISMISS,
  XPROMO_VIEW,
} from 'lib/eventUtils';

import * as scaledInferenceActions from './scaledInference';

import { SCALED_INFERENCE } from 'app/constants';

export const SHOW = 'XPROMO__SHOW';
export const show = () => ({ type: SHOW });

export const HIDE = 'XPROMO__HIDE';
export const hide = () => ({ type: HIDE });

export const PROMO_CLICKED = 'XPROMO__PROMO_CLICKED';
export const promoClicked = () => ({ type: PROMO_CLICKED });

export const PROMO_SCROLLSTART = 'XPROMO__SCROLLSTART';
export const promoScrollStart = () => ({ type: PROMO_SCROLLSTART });
export const PROMO_SCROLLPAST = 'XPROMO__SCROLLPAST';
export const promoScrollPast = () => ({ type: PROMO_SCROLLPAST });
export const PROMO_SCROLLUP = 'XPROMO__SCROLLUP';
export const promoScrollUp = () => ({ type: PROMO_SCROLLUP });

export const XPROMO_DISMISS_CLICKED = 'XPROMO__DISMISS_CLICKED';
export const promoDismissed = (interstitialType) => async (dispatch) => {
  dispatch({ type: XPROMO_DISMISS_CLICKED });
  if (interstitialType) {
    dispatch(trackXPromoEvent(XPROMO_DISMISS, { interstitial_type: interstitialType }));
  }
};

export const LISTING_CLICK_INITIAL_STATE = 'XPROMO__LISTING_CLICK_INITIAL_STATE';
export const listingClickInitialState = (
  { ineligibilityReason='', lastModalClick=0, modalDismissCount=0 }
) => ({
  type: LISTING_CLICK_INITIAL_STATE,
  payload: {
    ineligibilityReason,
    lastModalClick,
    modalDismissCount,
  },
});

export const MARK_MODAL_LISTING_CLICK_TIMESTAMP = 'XPROMO__MARK_MODAL_LISTING_CLICK_TIMESTAMP';
export const markModalListingClickTimestamp = () => async (dispatch) => {
  const dateTime = new Date();
  dispatch({
    type: MARK_MODAL_LISTING_CLICK_TIMESTAMP,
    clickTime: dateTime.getTime(),
  });
  markListingClickTimestampLocalStorage(dateTime);
};

export const SET_LISTING_CLICK_TARGET = 'XPROMO__SET_LISTING_CLICK_TARGET';
export const setListingClickTarget = target => ({
  type: SET_LISTING_CLICK_TARGET,
  payload: { target },
});

export const SET_MODAL_DISMISS_COUNT = 'XPROMO__INCREMENT_MODAL_DISMISS_COUNT';
export const incrementModalDismissCount = () => async (dispatch, getState) => {
  const state = getState();
  const modalDismissCount = state.xpromo.listingClick.modalDismissCount || 0;
  dispatch({
    type: SET_MODAL_DISMISS_COUNT,
    modalDismissCount: modalDismissCount + 1,
  });
  setModalDismissCountLocalStorage(modalDismissCount + 1);
};

export const LISTING_CLICK_MODAL_ACTIVATED = 'XPROMO__LISTING_CLICK_MODAL_ACTIVATED';
export const xpromoListingClickModalActivated = ({ postId='', listingClickType='' }) => ({
  type: LISTING_CLICK_MODAL_ACTIVATED,
  payload: {
    postId,
    listingClickType,
  },
});

export const LISTING_CLICK_RETURNER_MODAL_ACTIVATED =
  'XPROMO__LISTING_CLICK_RETURNER_MODAL_ACTIVATED';

export const xpromoListingClickReturnerModalActivated = () => ({
  type: LISTING_CLICK_RETURNER_MODAL_ACTIVATED,
});

export const LISTING_CLICK_MODAL_HIDDEN = 'XPROMO__LISTING_CLICK_MODAL_HIDDEN';
export const listingClickModalHidden = () => ({ type: LISTING_CLICK_MODAL_HIDDEN });

export const TRACK_XPROMO_EVENT = 'XPROMO__TRACK_EVENT';
export const trackXPromoEvent = (eventType, data) => ({
  type: TRACK_XPROMO_EVENT,
  eventType,
  data,
});

export const LOGIN_REQUIRED = 'XPROMO__LOGIN_REQUIRED';
export const loginRequired = () => ({ type: LOGIN_REQUIRED });

export const XPROMO_ADD_BUCKET_EVENT = 'XPROMO__ADD_BUCKET_EVENT';
export const xpromoAddBucketingEvent = (bucketEventName='') => async (dispatch) => {
  dispatch({type: XPROMO_ADD_BUCKET_EVENT, payload: { bucketEventName }});
};

export const checkAndSet = () => async (dispatch, getState) => {
  const state = getState();

  if (!shouldNotShowBanner(state)) {
    dispatch(show());
  }

  dispatch(listingClickInitialState(getListingClickInitialState()));
};

export const performListingClick = (postId, listingClickType) => async (dispatch, getState) => {
  const state = getState();

  if (state.xpromo.listingClick.active) {
    return;
  }

  dispatch(xpromoListingClickModalActivated({ postId, listingClickType }));
  dispatch(trackXPromoEvent(XPROMO_VIEW));
  dispatch(markModalListingClickTimestamp());
  dispatch(incrementModalDismissCount());
};

export const listingClickModalDismissClicked = () => async (dispatch, getState) => {
  // guard against duplicate clicks
  const state = getState();

  if (!state.xpromo.listingClick.active) {
    return;
  }

  const { target } = state.xpromo.listingClick;

  dispatch(trackXPromoEvent(XPROMO_DISMISS, {
    dismiss_type: XPROMO_MODAL_LISTING_CLICK_NAME,
  }));

  dispatch(listingClickModalHidden());

  // follow through with the original click if the original click target is non-null
  // the listingClickModalHidden action will clear the target when handled by the reducer

  if (target) { target.click(); }
};
