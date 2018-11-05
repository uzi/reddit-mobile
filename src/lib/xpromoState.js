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
  getRevampVariant,
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
import {
  XPROMO,
  REVAMP_BRANCH_PARAMS,
  XPROMO_NAMES,
} from '../app/constants';
import { pageTypeSelector } from 'app/selectors/platformSelector';
import { isOptOut } from '../app/selectors/xpromo';

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
  const params = {
    interstitial_type,
    tags: [interstitial_type],
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

  return getXPromoLink(state, path, XPROMO_MODAL_LISTING_CLICK_NAME, {
    utm_content: XPROMO_NAMES[XPROMO.NATIVE],
    tags: [XPROMO_NAMES[XPROMO.NATIVE]],
  });
}

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

export function getXpromoClosingTime(state, localStorageKey=BANNER_LAST_CLOSED) {
  if (localStorageAvailable()) {
    const lastClosedStr = localStorage.getItem(localStorageKey);
    return (lastClosedStr ? new Date(lastClosedStr).getTime() : 0);
  }
  return Infinity;
}

function getXpromoClosingRange(state, presetRange) {
  return FREQUENCIES[(presetRange || getExperimentRange(state) || EVERY_TWO_WEEKS)];
}

export function isInterstitialDimissed(state) {
  const defaultRange = getXpromoClosingTime(state)+getXpromoClosingRange(state, EVERY_TWO_WEEKS);
  return (defaultRange > Date.now());
}

export function getBranchLink(state, path, _payload={}) {
  const { utm_content, tags: _tags } = _payload;

  let tags = _tags;
  let payload = _payload;

  if (utm_content && tags) {
    tags = _tags.slice();
    const pageType = pageTypeSelector(state);
    const tagIndex = tags.indexOf(utm_content);
    const updateIndex = tagIndex >= 0 ? tagIndex : tags.length;
    const updatedContent = `${utm_content}_${pageType}`;
    tags[updateIndex] = updatedContent;

    payload = {
      ..._payload,
      tags,
      utm_content: updatedContent,
    };
  }

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

  const variant = getRevampVariant(state);
  const baseParams = REVAMP_BRANCH_PARAMS;


  const basePayload = {
    ...baseParams,
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
    keyword: variant,
    utm_term: variant,
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

/*

The logic for choosing xpromo components is now increasingly
specific to the particular variant being tested, so this function
now only checks if the user selected permanent opt out
*/

export function shouldNotShowBanner(state) {
  return (isOptOut(state));
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
