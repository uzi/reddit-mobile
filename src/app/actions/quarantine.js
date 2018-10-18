import config from 'config';
import cookies from 'js-cookie';

import QuarantineEndpoint from 'apiClient/apis/QuarantineEndpoint';
import { apiOptionsFromState } from 'lib/apiOptionsFromState';
import { navigateToUrl } from 'platform/actions';
import { METHODS } from 'platform/router';

export const RECEIVED_QUARANTINE_INTERSTITIAL = 'RECEIVED_QUARANTINE_INTERSTITIAL';

export const receivedQuarantineInterstitial = (name, quarantineMessageHTML) => ({
  type: RECEIVED_QUARANTINE_INTERSTITIAL,
  name,
  quarantineMessageHTML,
});

/**
 * Opts the current user into quarantined content
 *
 * Quarantine access works differently for logged-in vs logged-out users.
 * Logged-in users must opt into each quarantined subreddit individually,
 * while logged out users have a single cookie-based opt-in that grants access
 * to _all_ quarantined subreddits.
 *
 * @param {string} subredditName
 */
export const optIntoQuarantine = subredditName => async (dispatch, getState) => {
  if (getState().user.loggedOut) {
    let options = cookies.getJSON('_options');
    // getJSON seems to return the string as-is if it's not formatted properly
    if (!options || typeof options === 'string') {
      options = {};
    }
    options.pref_quarantine_optin = true;
    const cookieOpts = { domain: config.rootReddit };
    cookies.set('_options', options, cookieOpts);
  } else {
    const apiOptions = apiOptionsFromState(getState());
    await QuarantineEndpoint.postOptIn(apiOptions, subredditName);
  }
  window.location.reload();
};

export const OPTED_OUT_OF_QUARANTINE = 'OPTED_OUT_OF_QUARANTINE';

/**
 * Opts the current user out of quarantined content
 * 
 * The same differences between logged-in and logged-out users described above
 * applies here.
 * 
 * @param {string} subredditName
 */
export const optOutOfQuarantine = subredditName => async (dispatch, getState) => {
  if (getState().user.loggedOut) {
    let options = cookies.getJSON('_options');
    // getJSON seems to return the string as-is if it's not formatted properly
    if (!options || typeof options === 'string') {
      options = {};
    }
    options.pref_quarantine_oportin = false;
    const cookieOpts = { domain: config.rootReddit };
    cookies.set('_options', options, cookieOpts);
  } else {
    const apiOptions = apiOptionsFromState(getState());
    await QuarantineEndpoint.postOptOut(apiOptions, subredditName);
  }
  dispatch({ type: OPTED_OUT_OF_QUARANTINE });
  dispatch(navigateToUrl(METHODS.GET, '/'));
};
