import config from 'config';
import cookies from 'js-cookie';

import { apiOptionsFromState } from 'lib/apiOptionsFromState';
import QuarantineEndpoint from 'apiClient/apis/QuarantineEndpoint';

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
