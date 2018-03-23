
export const TOAST_SUCCESS_COPY = 'Link copied to your clipboard and ready to share.';
export const TOAST_ERROR_COPY = 'NO SHARING!';

export const SHOW_CTA = 'SHARING__SHOW_CTA';
export const HIDE_CTA = 'SHARING__HIDE_CTA';
export const SET_LINK = 'SHARING__SET_LINK';

import { copy } from 'lib/clipboard';
import { toastSuccess } from 'app/actions/toaster';
import { trackSharingPrepare, trackSharingExecute } from 'lib/eventUtils';
import config from 'config';

export const showCTA = () => ({
  type: SHOW_CTA,
});

export const hideCTA = () => ({
  type: HIDE_CTA,
});

export const setLink = (link) => ({
  type: SET_LINK,
  link,
});

export const executeShare = (url) => (dispatch, getState) => {
  trackSharingExecute(getState());

  const hasWebShareAPI = window && window.navigator && window.navigator.share;
  let result;

  if (hasWebShareAPI) {
    result = window.navigator.share({ url });
  } else {
    result = copy(url);
    dispatch(toastSuccess(TOAST_SUCCESS_COPY));
  }

  dispatch(hideCTA());

  return Promise.resolve(result);
};

export const prepareShare = (payload) => (dispatch, getState) => {
  dispatch(showCTA());
  trackSharingPrepare(getState());

  return getBranchLinkFromAPI(payload).then((link) => {
    dispatch(setLink(link));
  });
};

// this gets populated in client.js
export const branchProxy = {};

export const getBranchLinkFromAPI = ({ url, tags }) => {
  const canonicalUrl = `${config.reddit}${url}`;

  return new Promise((resolve, reject) => {
    branchProxy.link({
      tags,
      channel: 'growth',
      feature: 'sharing',
      data: {
        $canonical_url: canonicalUrl,
        $deeplink_path: url,
        $android_deeplink_path: `reddit${url}`,
        $desktop_url: canonicalUrl,
        $android_url: canonicalUrl,
        $ios_url: canonicalUrl,
        $ipad_url: canonicalUrl,
        $fire_url: canonicalUrl,
        $blackberry_url: canonicalUrl,
        $windows_phone_url: canonicalUrl,
      },
    }, function(err, link) {
      if (err) {
        reject(err);
      } else {
        resolve(link);
      }
    });
  });
};
