import * as adActions from 'app/actions/ads';
import merge from 'platform/merge';

const DEFAULT = {
  hasBuffered: {},
  currentViewStartedAt: {},
};

export default (state = DEFAULT, action={}) => {
  switch (action.type) {
    case adActions.VIDEO_AD_BUFFERING: {
      const { hasBuffered, postId } = action;
      return merge(state, {
        hasBuffered: {
          [postId]: hasBuffered,
        },
      });
    }
    case adActions.VIDEO_CURRENT_VIEW_STARTED_AT: {
      const { newTime, postId } = action;
      return merge(state, {
        currentViewStartedAt: {
          [postId]: newTime,
        },
      });
    }
    default: return state;
  }
};
