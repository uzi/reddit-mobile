import merge from 'platform/merge';

import * as loginActions from 'app/actions/login';
import * as replyActions from 'app/actions/reply';

export const DEFAULT = {};

export default function (state=DEFAULT, action={}) {
  switch (action.type) {
    case loginActions.LOGGED_OUT: {
      return DEFAULT;
    }

    case replyActions.FAILURE: {
      return merge(state, { [action.parentId]: { pending: false } });
    }

    case replyActions.PENDING: {
      return merge(state, { [action.parentId]: { pending: true } });
    }

    case replyActions.SUCCESS: {
      return merge(state, { [action.parentId]: { pending: false } });
    }

    default: return state;
  }
}

