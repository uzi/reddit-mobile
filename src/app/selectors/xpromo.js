import { find, some } from 'lodash';
import isEmpty from 'lodash/isEmpty';

import {
  EVERY_DAY,
  EVERY_TWO_WEEKS,
  EVERY_TWELVE_WEEKS,
  flags as flagConstants,
  COLOR_SCHEME,
  XPROMO_AD_FEED_TYPES,
  XPROMO_DISPLAY_THEMES,
  XPROMO_MODAL_LISTING_CLICK_NAME,
  OPT_OUT_XPROMO_INTERSTITIAL_MENU,
  OPT_OUT_XPROMO_INTERSTITIAL,
} from 'app/constants';

import features, { isNSFWPage } from 'app/featureFlags';
import getRouteMetaFromState from 'lib/getRouteMetaFromState';
import { getExperimentData, getExperimentVariant } from 'lib/experiments';
import { getDevice, IPHONE, ANDROID } from 'lib/getDeviceFromState';
import { isInterstitialDimissed } from 'lib/xpromoState';
import { trackXPromoIneligibleEvent } from 'lib/eventUtils';
import { isCommentsPage } from 'platform/pageUtils';
import { POST_TYPE } from 'apiClient/models/thingTypes';
import { isScaledInferenceActive, getMetadata } from '../actions/scaledInference';
import { SCALED_INFERENCE } from 'app/constants';

const { DAYMODE } = COLOR_SCHEME;
const { USUAL, MINIMAL, PERSIST } = XPROMO_DISPLAY_THEMES;

const {
  XPROMOBANNER,

  // XPromo Login Required
  VARIANT_XPROMO_LOGIN_REQUIRED_IOS,
  VARIANT_XPROMO_LOGIN_REQUIRED_ANDROID,
  VARIANT_XPROMO_LOGIN_REQUIRED_IOS_CONTROL,
  VARIANT_XPROMO_LOGIN_REQUIRED_ANDROID_CONTROL,

  // XPromo Comments Interstitial
  VARIANT_XPROMO_INTERSTITIAL_COMMENTS_IOS,
  VARIANT_XPROMO_INTERSTITIAL_COMMENTS_ANDROID,

  // XPromo Modal Listing Click
  XPROMO_MODAL_LISTING_CLICK_DAILY_DISMISSIBLE_IOS,
  XPROMO_MODAL_LISTING_CLICK_DAILY_DISMISSIBLE_ANDROID,
  XPROMO_MODAL_LISTING_CLICK_DAILY_DISMISSIBLE_THROTTLE,

  // XPromo Interstitial Frequrency
  VARIANT_XPROMO_INTERSTITIAL_FREQUENCY_IOS,
  VARIANT_XPROMO_INTERSTITIAL_FREQUENCY_ANDROID,

  // XPromo Persistent Banner
  VARIANT_XPROMO_PERSISTENT_IOS,
  VARIANT_XPROMO_PERSISTENT_ANDROID,

  // XPromo Ad loading (preloader and Mobile App redirect button)
  VARIANT_XPROMO_AD_LOADING_IOS,
  VARIANT_XPROMO_AD_LOADING_ANDROID,

  // XPromo Ad Feed inside the Listing pages
  VARIANT_XPROMO_AD_FEED_IOS,
  VARIANT_XPROMO_AD_FEED_ANDROID,

  // Mobile Sharing
  VARIANT_MOBILE_SHARING_WEB_SHARE_API,
  VARIANT_MOBILE_SHARING_CLIPBOARD,

  // Porn Pill
  VARIANT_NSFW_XPROMO,

  // iOS link out
  VARIANT_IOS_LINK_TAB,

  // xpromo revamp
  VARIANT_XPROMO_REVAMP,

} = flagConstants;

const EXPERIMENT_FULL = [
  VARIANT_XPROMO_AD_LOADING_IOS,      // should be on top
  VARIANT_XPROMO_AD_LOADING_ANDROID,  // should be on top

  VARIANT_XPROMO_AD_FEED_IOS,
  VARIANT_XPROMO_AD_FEED_ANDROID,
  VARIANT_XPROMO_LOGIN_REQUIRED_IOS,
  VARIANT_XPROMO_LOGIN_REQUIRED_ANDROID,
  VARIANT_XPROMO_LOGIN_REQUIRED_IOS_CONTROL,
  VARIANT_XPROMO_LOGIN_REQUIRED_ANDROID_CONTROL,
  VARIANT_XPROMO_INTERSTITIAL_FREQUENCY_IOS,
  VARIANT_XPROMO_INTERSTITIAL_FREQUENCY_ANDROID,
];

const LOGIN_REQUIRED_FLAGS = [
  VARIANT_XPROMO_LOGIN_REQUIRED_IOS,
  VARIANT_XPROMO_LOGIN_REQUIRED_ANDROID,
];

const COMMENTS_PAGE_BANNER_FLAGS = [
  VARIANT_XPROMO_INTERSTITIAL_COMMENTS_IOS,
  VARIANT_XPROMO_INTERSTITIAL_COMMENTS_ANDROID,
];

const MODAL_LISTING_CLICK_FLAGS = [
  XPROMO_MODAL_LISTING_CLICK_DAILY_DISMISSIBLE_IOS,
  XPROMO_MODAL_LISTING_CLICK_DAILY_DISMISSIBLE_ANDROID,
];

const INTERSTITIAL_FREQUENCY_FLAGS = [
  VARIANT_XPROMO_INTERSTITIAL_FREQUENCY_IOS,
  VARIANT_XPROMO_INTERSTITIAL_FREQUENCY_ANDROID,
];

const XPROMO_PERSISTENT_FLAGS = [
  VARIANT_XPROMO_PERSISTENT_IOS,
  VARIANT_XPROMO_PERSISTENT_ANDROID,
];

const XPROMO_AD_LOADING_FLAGS = [
  VARIANT_XPROMO_AD_LOADING_IOS,
  VARIANT_XPROMO_AD_LOADING_ANDROID,
];

const XPROMO_AD_FEED_FLAGS = [
  VARIANT_XPROMO_AD_FEED_IOS,
  VARIANT_XPROMO_AD_FEED_ANDROID,
];

export const EXPERIMENT_NAMES = {
  [VARIANT_MOBILE_SHARING_WEB_SHARE_API]: 'mweb_sharing_web_share_api',
  [VARIANT_MOBILE_SHARING_CLIPBOARD]: 'mweb_sharing_clipboard',
  [VARIANT_XPROMO_LOGIN_REQUIRED_IOS]: 'mweb_xpromo_require_login_ios',
  [VARIANT_XPROMO_LOGIN_REQUIRED_ANDROID]: 'mweb_xpromo_require_login_android',
  [VARIANT_XPROMO_LOGIN_REQUIRED_IOS_CONTROL]: 'mweb_xpromo_require_login_ios',
  [VARIANT_XPROMO_LOGIN_REQUIRED_ANDROID_CONTROL]: 'mweb_xpromo_require_login_android',
  [VARIANT_XPROMO_INTERSTITIAL_COMMENTS_IOS]: 'mweb_xpromo_interstitial_comments_ios',
  [VARIANT_XPROMO_INTERSTITIAL_COMMENTS_ANDROID]: 'mweb_xpromo_interstitial_comments_android',
  [XPROMO_MODAL_LISTING_CLICK_DAILY_DISMISSIBLE_IOS]: 'mweb_xpromo_modal_listing_click_daily_dismissible_ios',
  [XPROMO_MODAL_LISTING_CLICK_DAILY_DISMISSIBLE_ANDROID]: 'mweb_xpromo_modal_listing_click_daily_dismissible_android',
  [XPROMO_MODAL_LISTING_CLICK_DAILY_DISMISSIBLE_THROTTLE]: 'mweb_xpromo_modal_listing_click_daily_dismissible_throttle',
  [VARIANT_XPROMO_INTERSTITIAL_FREQUENCY_IOS]: 'mweb_xpromo_interstitial_frequency_ios',
  [VARIANT_XPROMO_INTERSTITIAL_FREQUENCY_ANDROID]: 'mweb_xpromo_interstitial_frequency_android',
  [VARIANT_XPROMO_PERSISTENT_IOS]: 'mweb_xpromo_persistent_ios',
  [VARIANT_XPROMO_PERSISTENT_ANDROID]: 'mweb_xpromo_persistent_android',
  [VARIANT_XPROMO_AD_LOADING_IOS]: 'mweb_xpromo_ad_loading_ios',
  [VARIANT_XPROMO_AD_LOADING_ANDROID]: 'mweb_xpromo_ad_loading_android',
  [VARIANT_XPROMO_AD_FEED_IOS]: 'mweb_xpromo_ad_feed_ios',
  [VARIANT_XPROMO_AD_FEED_ANDROID]: 'mweb_xpromo_ad_feed_android',
  [VARIANT_NSFW_XPROMO]: 'mweb_nsfw_xpromo',
  [VARIANT_IOS_LINK_TAB]: 'mweb_link_tab',
  [VARIANT_XPROMO_REVAMP]: 'mweb_xpromo_revamp',
};

export function isOptOut(state) {
  return state.optOuts[OPT_OUT_XPROMO_INTERSTITIAL_MENU.STORE_KEY] ||
         state.optOuts[OPT_OUT_XPROMO_INTERSTITIAL.STORE_KEY];
}

export function getRouteActionName(state) {
  const routeMeta = getRouteMetaFromState(state);
  const actionName = routeMeta && routeMeta.name;
  return actionName;
}

function isDayMode(state) {
  return DAYMODE === state.theme;
}

function activeXPromoExperimentName(state, flags=EXPERIMENT_FULL) {
  const featureContext = features.withContext({ state });
  const featureFlag = find(flags, feature => {
    return featureContext.enabled(feature);
  });
  return featureFlag ? EXPERIMENT_NAMES[featureFlag] : null;
}

export function showXPromoOptOutMenuLink(state) {
  return !state.optOuts[OPT_OUT_XPROMO_INTERSTITIAL_MENU.STORE_KEY];
}

export function xpromoTheme(state) {
  if (isXPromoPersistent(state)) {
    return PERSIST;
  }
  switch (getRouteActionName(state)) {
    case 'comments':
      return MINIMAL;
    default:
      return USUAL;
  }
}

export function xpromoThemeIsUsual(state) {
  return xpromoTheme(state) === USUAL;
}
export function isXPromoFixedBottom(state) {
  const theme = xpromoTheme(state);
  return (theme === PERSIST || theme === MINIMAL);
}

function xpromoIsConfiguredOnPage(state) {
  const actionName = getRouteActionName(state);
  return actionName === 'index' || actionName === 'listing' || actionName === 'comments';
}

export function isXPromoEnabledOnPages(state) {
  return isEligibleListingPage(state) || isEligibleCommentsPage(state);
}

export function isEligibleListingPage(state) {
  const actionName = getRouteActionName(state);
  return actionName === 'index'
    || (actionName === 'listing' && !isNSFWPage(state));
}

function isVideoCommentsPage(state) {
  const currentPage = state.platform.currentPage;
  const currentPostId = `${ POST_TYPE }_${ currentPage.urlParams.postId }`;
  const currentPost = state.posts[currentPostId];

  if (isCommentsPage(currentPage) && currentPost && currentPost.media && currentPost.media.reddit_video) {
    return true;
  }
  return false;
}

export function isEligibleCommentsPage(state) {
  const actionName = getRouteActionName(state);
  return actionName === 'comments' && isDayMode(state) && !isNSFWPage(state);
}

function isXPromoEnabledOnDevice(state) {
  const device = getDevice(state);
  // If we don't know what device we're on, then
  // we should not match any list
  // of allowed devices.
  return (!!device) && [ANDROID, IPHONE].includes(device);
}

function anyFlagEnabled(state, flags) {
  const featureContext = features.withContext({ state });
  return some(flags, feature => {
    return featureContext.enabled(feature);
  });
}

export function loginRequiredEnabled(state) {
  return shouldShowXPromo(state) && anyFlagEnabled(state, LOGIN_REQUIRED_FLAGS);
}

export function commentsInterstitialEnabled(state) {
  //Don't show the comments interstitial for native reddit video posts to prevent dialog for sharing on third party apps
  return shouldShowXPromo(state) && anyFlagEnabled(state, COMMENTS_PAGE_BANNER_FLAGS) && !isVideoCommentsPage(state);
}

/**
 * @param {object} state - redux state
 * @param {string} postId - id of the post that was clicked on
 * @return {boolean} is this listing click eligible to be intercepted,
 * and redirected to the app store page for the reddit app
 */

export function listingClickEnabled(state, postId) {
  if (isScaledInferenceActive(state)) {
    const si = getMetadata(state);
    return si.variants.xpromo_click === 'D' &&
           !si.listingClickDismissed;
  }

  const variants = getXPromoVariants(state);

  if (!variants[SCALED_INFERENCE.CLICK]) {
    return false;
  }

  if (!isEligibleListingPage(state) || !isXPromoEnabledOnDevice(state)) {
    return false;
  }

  if (!state.user.loggedOut) {
    const userAccount = state.accounts[state.user.name];
    if (userAccount && (userAccount.isMod || userAccount.isGold)) {
      return false;
    }
  }

  const eventData = {
    interstitial_type: XPROMO_MODAL_LISTING_CLICK_NAME,
  };

  if (state.xpromo.listingClick.ineligibilityReason) {
    trackXPromoIneligibleEvent(state, eventData, state.xpromo.listingClick.ineligibilityReason);
    return;
  }

  if (!anyFlagEnabled(state, MODAL_LISTING_CLICK_FLAGS)) {
    return false;
  }

  if (!eligibleTimeForModalListingClick(state)) {
    trackXPromoIneligibleEvent(state, eventData, 'dismissed_previously');
    return false;
  }

  const post = state.posts[postId];
  if (post.promoted) {
    trackXPromoIneligibleEvent(state, eventData, 'promoted_post');
    return false;
  }

  return true;
}

/**
 * @func getExperimentDataByFlags
 *
 * Note: This should only be called when we know the user is eligible and buckted
 * for a listing click experiment group. Used to let `getXPromoExperimentPayload`
 * properly attribute experiment data
 *
 * @param {object} state - our applications redux state.
 * @param {array} FLAGS - list of experiments.
 *
 * Note: If FLAGS-param is empty -> current experiment data will be returned.
 *
 * @return {object}
 */
export function getExperimentDataByFlags(state, FLAGS) {
  const experimentName = activeXPromoExperimentName(state, FLAGS);
  return getExperimentData(state, experimentName);
}
export function xpromoAdFeedIsVariantEnabled(state, checkableVariant) {
  const experimentVariant = xpromoAdFeedVariant(state);
  if (Array.isArray(checkableVariant)) {
    return checkableVariant.some((variant) => (variant === experimentVariant));
  }
  return (experimentVariant === checkableVariant);
}
export function xpromoAdFeedVariant(state) {
  const experiment = getExperimentDataByFlags(state, XPROMO_AD_FEED_FLAGS);
  return experiment ? experiment.variant : undefined;
}
export function isXPromoInFeedEnabled(state) {
  const { LISTING_BIG, LISTING_SMALL } = XPROMO_AD_FEED_TYPES;
  return xpromoAdFeedIsVariantEnabled(state, [LISTING_BIG, LISTING_SMALL]);
}

/**
 * @func eligibleTimeForModalListingClick
 * @param {object} state - our applications redux state. Depends
 *  - state.xpromo.listingClick.modalDimissCount
 *  - state.xpromo.listingClick.lastModalClick
 *  - state.accounts
 *
 * Note: This function is time senstiive, it's result will vary based on the
 * current time.
 *
 * @return {bool} Based only on time based eligibility, can we bucket the
 *   current user into one of the xpromo modal listing click experiments
 */
function eligibleTimeForModalListingClick(state) {
  const { lastModalClick, modalDismissCount } = state.xpromo.listingClick;

  if (lastModalClick === 0) {
    return true;
  }

  let interval = EVERY_DAY;

  const variant = getExperimentVariant(state, EXPERIMENT_NAMES[XPROMO_MODAL_LISTING_CLICK_DAILY_DISMISSIBLE_THROTTLE]);

  if (variant === 'treatment') {
    interval = modalDismissCount >= 3 ? EVERY_TWELVE_WEEKS : EVERY_TWO_WEEKS;
  }

  /*
  GROW-1397 modal_listing_click_daily_dismissible_throttling
  control and base experience should continue to see the modal every day
  treatment group should see the modal once every two weeks, and once every 12 weeks after dismissing it 3 times
  */

  const ineligibleLimit = lastModalClick + interval;
  return Date.now() > ineligibleLimit;
}

export function getExperimentRange(state) {
  // For frequency experiment
  const experimentName = activeXPromoExperimentName(state, INTERSTITIAL_FREQUENCY_FLAGS);
  const experimentData = getExperimentData(state, experimentName);
  if (experimentData) {
    return experimentData.variant;
  }
}

function populateExperimentPayload(experimentData) {
  let experimentPayload = {};
  if (experimentData) {
    const {experiment_name, variant } = experimentData;
    experimentPayload = { experiment_name, experiment_variant: variant };
  }
  return experimentPayload;
}

export function getXPromoExperimentPayload(state) {
  let experimentPayload = {};

  // If we're showing a listing_click, then we should using.
  if (state.xpromo.listingClick.active) {
    const experimentData = getExperimentDataByFlags(state, MODAL_LISTING_CLICK_FLAGS);
    experimentPayload = populateExperimentPayload(experimentData);
  } else if (isXPromoPersistent(state)) {
    // For persistent_banner interstitial we should exclude PERSISTENT FLAGS from
    // "Common rules" to DO NOT fire bucketing event right after the page has been
    // loaded (be cause this should happen after dismiss click by link).
    const experimentData = getExperimentDataByFlags(state, XPROMO_PERSISTENT_FLAGS);
    experimentPayload = populateExperimentPayload(experimentData);
  }
  // Common rules
  if (isPartOfXPromoExperiment(state) && getExperimentDataByFlags(state)) {
    const experimentData = getExperimentDataByFlags(state);
    experimentPayload = populateExperimentPayload(experimentData);
  }
  return experimentPayload;
}

export function scrollPastState(state) {
  return state.xpromo.interstitials.scrolledPast;
}
export function scrollStartState(state) {
  return state.xpromo.interstitials.scrolledStart;
}

export function dismissedState(state) {
  return state.xpromo.persistent.dismissed;
}
export function isXPromoPersistentActive(state) {
  return state.xpromo.persistent.active;
}
export function isXPromoPersistent(state) {
  return isInterstitialDimissed(state) &&
    anyFlagEnabled(state, XPROMO_PERSISTENT_FLAGS);
}
export function isXPromoBannerEnabled(state) {
  return anyFlagEnabled(state, [XPROMOBANNER]);
}
export function isXPromoAdLoadingEnabled(state) {
  return anyFlagEnabled(state, XPROMO_AD_LOADING_FLAGS);
}

function shouldShowXPromo(state) {
  return state.xpromo.interstitials.showBanner && isXPromoBannerEnabled(state);
}
function isPartOfXPromoExperiment(state) {
  return shouldShowXPromo(state) && anyFlagEnabled(state, EXPERIMENT_FULL);
}
function isContentLoaded(state) {
  const actionName = getRouteActionName(state);
  if ((actionName === 'index' || actionName === 'listing') && isEmpty(state.posts)) {
    return false;
  }
  return true;
}
export function XPromoIsActive(state) {
  return isContentLoaded(state) && xpromoIsConfiguredOnPage(state) && state.xpromo.interstitials.showBanner;
}

const { CLICK, LISTING, POST } = SCALED_INFERENCE;
const { D, TA, BB, BLB, P } = SCALED_INFERENCE;

// D is the listing click modal
// TA, BB are the original xpromo banners
// BLB is the you tube style "snackbar"
// P is the persistent blue pill

const REVAMP_VARIANTS = {
  DEFAULT: {
    [CLICK]: D,
    [LISTING]: TA,
    [POST]: BB,
  },

  treatment_1: {
    [CLICK]: null,
    [LISTING]: P,
    [POST]: P,
  },

  treatment_2: {
    [CLICK]: null,
    [LISTING]: BLB,
    [POST]: BLB,
  },

  treatment_3: {
    [CLICK]: null,
    [LISTING]: P,
    [POST]: BB,
  },

  treatment_4: {
    [CLICK]: null,
    [LISTING]: BLB,
    [POST]: BB,
  },
};

export function getScaledInferenceVariant(state) {
  return getExperimentVariant(state, SCALED_INFERENCE.EXPERIMENT);
}

export function getRevampVariant(state) {
  return getExperimentVariant(state, EXPERIMENT_NAMES[VARIANT_XPROMO_REVAMP]);
}

export function getXPromoVariants(state) {
  const scaledInferenceVariant = getScaledInferenceVariant(state);

  if (scaledInferenceVariant) {
    return scaledInferenceVariant;
  }

  const revampVariant = getRevampVariant(state);

  return REVAMP_VARIANTS[revampVariant] || REVAMP_VARIANTS.DEFAULT;
}
