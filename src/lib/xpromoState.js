import url from 'url';
import get from 'lodash/get';
import cookies from 'js-cookie';
import config from 'config';
import localStorageAvailable from './localStorageAvailable';

import {
  getBasePayload,
  buildSubredditData,
  xPromoExtraScreenViewData,
} from 'lib/eventUtils';

import {
  isEligibleCommentsPage,
  isEligibleListingPage,
  loginRequiredEnabled,
  getExperimentRange,
  isXPromoPersistent,
} from 'app/selectors/xpromo';

import {
  LISTING_CLICK_TYPES,
  EXPERIMENT_FREQUENCY_VARIANTS as FREQUENCIES,
  EVERY_TWO_WEEKS,
  LOCAL_STORAGE_KEYS,
  XPROMO_MODAL_LISTING_CLICK_NAME,
  XPROMO_DISPLAY_THEMES,
} from 'app/constants';

import extractTaglist from 'lib/extractTagList';
import { getExperimentVariant } from './experiments';
import { SCALED_INFERENCE_BRANCH_PARAMS, SCALED_INFERENCE } from '../app/constants';

const {
  USUAL,
  LOGIN,
  MINIMAL,
  PERSIST,
} = XPROMO_DISPLAY_THEMES;

const {
  BANNER_LAST_CLOSED,
  XPROMO_LAST_MODAL_CLICK,
  XPROMO_MODAL_DISMISS_COUNT,
} = LOCAL_STORAGE_KEYS;

// Get loid values either from the account state or the cookies.
function getLoidValues(accounts) {
  if (accounts.me) {
    return {
      loid: accounts.me.loid,
      loidCreated: accounts.me.loidCreated,
    };
  }

  const loid = cookies.get('loid');
  const loidCreated = cookies.get('loidcreated');

  return {
    loid,
    loidCreated,
  };
}

export function isXPromoPersistentEnabled(state) {
  return isXPromoPersistent(state);
}

export function getXPromoLinkforCurrentPage(state, interstitial_type) {
  const variant = getExperimentVariant(state, SCALED_INFERENCE.EXPERIMENT);

  const params = {
    interstitial_type,
    tags: [interstitial_type],
    ...SCALED_INFERENCE_BRANCH_PARAMS,
    keyword: variant,
    utm_term: variant,
  };
  const path = state.platform.currentPage.url;
  // utm_content (3 arg) and interstitial_type (4 arg) are
  // should be the same inside the url link (as payload also).
  return getXPromoLink(state, path, interstitial_type, params);
}

export function getXPromoListingClickLink(state, postId, listingClickType) {
  const post = state.posts[postId];
  if (!post) {
    throw new Error(`XPromoListingClickLink called with invalid postId: ${postId}`);
  }

  const path = getXPromoListingClickPath(state, post, listingClickType);

  const scaledInferenceVariant = getExperimentVariant(state, SCALED_INFERENCE.EXPERIMENT);

  return getXPromoLink(state, path, XPROMO_MODAL_LISTING_CLICK_NAME, {
    listing_click_type: listingClickType,
    keyword: scaledInferenceVariant,
    utm_term: scaledInferenceVariant,
    utm_content: SCALED_INFERENCE.MODAL_LISTING_CLICK,
    tags: [SCALED_INFERENCE.MODAL_LISTING_CLICK],
  });
}

// https://www.reddit.com/?campaign=scaled_inference&utm_name=scaled_inference&channel=xpromo&utm_source=xpromo&feature=mweb&utm_medium=mweb&%24og_redirect=https%3A%2F%2Fwww.reddit.com%2Fr%2Fnottheonion%2Fcomments%2F8zb638%2Fus_republicans_endorse_arming_toddlers_on_sacha%2F&%24deeplink_path=%2Fr%2Fnottheonion%2Fcomments%2F8zb638%2Fus_republicans_endorse_arming_toddlers_on_sacha%2F&%24android_deeplink_path=reddit%2Fr%2Fnottheonion%2Fcomments%2F8zb638%2Fus_republicans_endorse_arming_toddlers_on_sacha%2F&mweb_loid=00000000001se15pox&mweb_loid_created=1531760367214&mweb_user_id36=&mweb_user_name=&domain=localhost%3A4444&geoip_country=US&user_agent=Mozilla%2F5.0%20%28iPhone%3B%20CPU%20iPhone%20OS%2011_0%20like%20Mac%20OS%20X%29%20AppleWebKit%2F604.1.38%20%28KHTML%2C%20like%20Gecko%29%20Version%2F11.0%20Mobile%2F15A372%20Safari%2F604.1&base_url=%2F&referrer_domain=&referrer_url=&language=&dnt=false&compact_view=true&adblock=false&session_id=ju6YYRHxYIIzV6scSd&loid=00000000001se15pox&loid_created=1531760367214&reddaid=&utm_content=modal_listing_click&interstitial_type=modal_listing_click&listing_click_type=comments_link&keyword=treatment_1&utm_term=treatment_1&tags=modal_listing_click&listing_name=frontpage&target_type=listing&target_sort=hot&target_count=25&_branch_match_id=544983095369148572
// https://www.reddit.com/?campaign=scaled_inference&utm_name=scaled_inference&channel=xpromo&utm_source=xpromo&feature=mweb&utm_medium=mweb&%24og_redirect=https%3A%2F%2Fwww.reddit.com%2Fr%2Fvideos%2Fcomments%2F8zahhk%2Fthe_theme_to_mib_the_animated_show_had_no_right%2F&%24deeplink_path=%2Fr%2Fvideos%2Fcomments%2F8zahhk%2Fthe_theme_to_mib_the_animated_show_had_no_right%2F&%24android_deeplink_path=reddit%2Fr%2Fvideos%2Fcomments%2F8zahhk%2Fthe_theme_to_mib_the_animated_show_had_no_right%2F&mweb_loid=00000000001se15pox&mweb_loid_created=1531760367214&mweb_user_id36=&mweb_user_name=&domain=localhost%3A4444&geoip_country=US&user_agent=Mozilla%2F5.0%20%28iPhone%3B%20CPU%20iPhone%20OS%2011_0%20like%20Mac%20OS%20X%29%20AppleWebKit%2F604.1.38%20%28KHTML%2C%20like%20Gecko%29%20Version%2F11.0%20Mobile%2F15A372%20Safari%2F604.1&base_url=%2F&referrer_domain=&referrer_url=&language=&dnt=false&compact_view=true&adblock=false&session_id=ju6YYRHxYIIzV6scSd&loid=00000000001se15pox&loid_created=1531760367214&reddaid=&utm_content=modal_listing_click&interstitial_type=modal_listing_click&listing_click_type=comments_link&keyword=treatment_2&utm_term=treatment_2&tags=modal_listing_click&listing_name=frontpage&target_type=listing&target_sort=hot&target_count=25&_branch_match_id=544983095369148572

function getXPromoListingClickPath(state, post, listingClickType) {
  switch (listingClickType) {
    case LISTING_CLICK_TYPES.AUTHOR: {
      const { author } = post;
      // note: android has problems with /user/, so keep this as /u/
      return `/u/${author}`;
    }

    case LISTING_CLICK_TYPES.SUBREDDIT: {
      const { subreddit } = post;
      return `/r/${subreddit}`;
    }

    default: {
      // promoted posts don't have subreddits.....
      // and there permalink format isn't supported by the android app
      // instead of deep linking, we can just send them to the current listing page
      if (post.promoted) {
        const { subredditName } = state.platform.currentPage.urlParams;
        if (subredditName) {
          return `/r/${subredditName}`;
        }
        return '/';
      }
      return post.cleanPermalink;
    }
  }
}

function getXPromoLink(state, path, linkType, additionalData={}) {
  let payload = {
    utm_source: 'xpromo',
    utm_content: linkType,
    ...interstitialData(state, additionalData),
    ...additionalData,
  };

  payload = {
    ...payload,
    ...xPromoExtraScreenViewData(state),
  };

  return getBranchLink(state, path, payload);
}

function getXpromoClosingTime(state, localStorageKey=BANNER_LAST_CLOSED) {
  if (localStorageAvailable()) {
    const lastClosedStr = localStorage.getItem(localStorageKey);
    return (lastClosedStr ? new Date(lastClosedStr).getTime() : 0);
  }
  return Infinity;
}

function getXpromoClosingRange(state, presetRange) {
  return FREQUENCIES[(presetRange || getExperimentRange(state) || EVERY_TWO_WEEKS)];
}

function getXpromoClosingLimit(state) {
  return getXpromoClosingTime(state)+getXpromoClosingRange(state);
}

export function isInterstitialDimissed(state) {
  const defaultRange = getXpromoClosingTime(state)+getXpromoClosingRange(state, EVERY_TWO_WEEKS);
  return (defaultRange > Date.now());
}

export function getBranchLink(state, path, payload={}) {
  const { user, accounts } = state;

  const extractedXPromoTags = extractTaglist(state);

  const { loid, loidCreated } = getLoidValues(accounts);

  let userName;
  let userId;

  const userAccount = user.loggedOut ? null : accounts[user.name];
  if (userAccount) {
    userName = userAccount.name;
    userId = userAccount.id;
  }

  const basePayload = {
    ...SCALED_INFERENCE_BRANCH_PARAMS,
    // We can use this space to fill "tags" which will populate on the
    // branch dashboard and allow you sort/parse data. Optional/not required.
    // tags: [ 'tag1', 'tag2' ],
    // Pass in data you want to appear and pipe in the app,
    // including user token or anything else!
    // android deep links expect reddit/ prefixed urls
    '$og_redirect': `${config.reddit}${path}`,
    '$deeplink_path': path,
    '$android_deeplink_path': `reddit${path}`,
    mweb_loid: loid,
    mweb_loid_created: loidCreated,
    mweb_user_id36: userId,
    mweb_user_name: userName,
    ...getBasePayload(state),
    ...buildSubredditData(state),
  };

  const payloadTags = payload.tags || [];
  const basePayloadTags = basePayload.tags || [];
  const finalTags = [...extractedXPromoTags, ...payloadTags, ...basePayloadTags];
  const query = { ...basePayload, ...payload, tags: finalTags };

  /*
  The utm_content query parameter overwrites the tags parameter in the long form branch links.
  If you happen to be wondering why it stopped appearing somewhere, look no further.
  */

  const link = url.format({
    protocol: 'https',
    host: 'reddit.app.link',
    pathname: '/',
    query,
  });

  return link;
}

/**
 * @TODO: These functions should refactored:
 * - shouldNotShowBanner
 * - shouldNotListingClick
 */
export function shouldNotShowBanner(state) {
  // Do not show the banner:
  // If localStorage is not available
  if (!localStorageAvailable()) {
    return 'local_storage_unavailable';
  }
  // Do not show the banner:
  // If closing date is in limit range still
  if (getXpromoClosingLimit(state) > Date.now()) {
    return 'dismissed_previously';
  }
  // Show the banner
  return false;
}

export function listingClickInitialState() {
  // Check if there's been a listing click in the last two weeks
  const modalDismissCountStr = localStorageAvailable() ? localStorage.getItem(XPROMO_MODAL_DISMISS_COUNT) : null;
  const modalDismissCount = modalDismissCountStr ? Number(modalDismissCountStr) : 0;
  const lastClickedStr = localStorageAvailable() ? localStorage.getItem(XPROMO_LAST_MODAL_CLICK) : null;
  const lastModalClick = lastClickedStr ? new Date(lastClickedStr).getTime() : 0;
  const ineligibilityReason = localStorageAvailable() ? null : 'local_storage_unavailable';
  return {
    ineligibilityReason,
    lastModalClick,
    modalDismissCount,
  };
}

export function markBannerClosed() {
  if (!localStorageAvailable()) { return false; }

  // note that we dismissed the banner
  localStorage.setItem(BANNER_LAST_CLOSED, new Date());
}

export const markListingClickTimestampLocalStorage = (dateTime) => {
  if (!localStorageAvailable()) { return; }

  localStorage.setItem(XPROMO_LAST_MODAL_CLICK, dateTime);
};

export const setModalDismissCountLocalStorage = (count) => {
  if (!localStorageAvailable()) { return; }

  localStorage.setItem(XPROMO_MODAL_DISMISS_COUNT, count);
};

export function interstitialType(state) {
  if (isEligibleListingPage(state)) {
    if (state.xpromo.listingClick.active) {
      return XPROMO_MODAL_LISTING_CLICK_NAME;
    } else if (isXPromoPersistentEnabled(state)) {
      return PERSIST;
    } else if (loginRequiredEnabled(state)) {
      return LOGIN;
    }
    return USUAL;
  } else if (isEligibleCommentsPage(state)) {
    return MINIMAL;
  }
}

export function interstitialData(state, additionalData) {
  const baseData = {
    interstitial_type: (
      get(additionalData, 'interstitialType') ||
      interstitialType(state)
    ),
  };

  const { active, clickInfo } = state.xpromo.listingClick;
  if (active && !!clickInfo) {
    return {
      ...baseData,
      listing_click_type: clickInfo.listingClickType,
    };
  }

  return baseData;
}
