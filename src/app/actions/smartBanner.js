import branch from 'branch-sdk';

import getRouteMetaFromState from 'lib/getRouteMetaFromState';
import { shouldShowBanner, markBannerClosed } from 'lib/smartBannerState';

export const SHOW = 'SMARTBANNER__SHOW';
export const show = clickUrl => ({
  type: SHOW,
  data: {
    clickUrl,
  },
});

export const HIDE = 'SMARTBANNER__HIDE';
export const hide = () => ({ type: HIDE });

export const close = () => async (dispatch) => {
  markBannerClosed();
  dispatch(hide());
};

export const checkAndSet = () => async (dispatch, getState) => {
  const state = getState();
  const routeMeta = getRouteMetaFromState(state);
  const {
    showBanner,
    clickUrl,
  } = shouldShowBanner({
    actionName: routeMeta && routeMeta.name,
    userAgent: state.meta.userAgent || '',
    user: state.accounts[state.user.name],
  });
  if (showBanner) {
    if (clickUrl) {
      dispatch(show(clickUrl));
    } else {
      branch.init('key_live_hoc05HaCXaME10UMwyj3filpqzfu2Ue6', (err, data) => {
        // callback to handle err or data
        window.referring_link = data.referring_link;
        window.referring_data = data.data_parsed;
      });

      branch.link(
        {
          channel: 'Web',
          feature: 'Banner',
          // We can use this space to fill "tags" which will populate on the
          // branch dashboard and allow you sort/parse data. Optional/not required.
          // tags: [ 'tag1', 'tag2' ],
          data: {
            // Pass in data you want to appear and pipe in the app,
            // including user token or anything else!
            '$og_redirect': window.location.href,
            '$deeplink_path': window.location.href.split(window.location.host)[1],
          },
        },
        (err, link) => {
          dispatch(show(link));
        }
      );  
    }
  }
};
