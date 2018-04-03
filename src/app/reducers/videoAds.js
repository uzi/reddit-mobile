import * as adActions from 'app/actions/ads';
import merge from 'platform/merge';

const DEFAULT = {
  hasBuffered: {},
  skipped: {},
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
    // TODO: add skipped case
    default: return state;
  }
};
