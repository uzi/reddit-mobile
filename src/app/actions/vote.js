import * as platformActions from 'platform/actions';
import { thingType, POST, COMMENT } from 'apiClient/models/thingTypes';
import ResponseError from 'apiClient/errors/ResponseError';
import { apiOptionsFromState } from 'lib/apiOptionsFromState';
import { LOGGEDOUT_REDIRECT } from 'app/constants';
import { AdEvents, firePixelsOfType } from 'lib/ads';

import modelFromThingId from 'app/reducers/helpers/modelFromThingId';

export const PENDING = 'VOTE__PENDING';
export const SUCCESS = 'VOTE__SUCCESS';
export const FAILURE = 'VOTE__FAILURE';

export const pending = (id, model) => ({ type: PENDING, id, model });
export const success = (id, model) => ({ type: SUCCESS, id, model });
export const failure = (direction, type) => {
  const voteWord = direction === 1 ? 'upvote' : 'downvote';
  return {
    type: FAILURE,
    message: `Failed to ${voteWord} the ${type}.`,
  };
};

export const vote = (id, direction) => async (dispatch, getState) => {
  const state = getState();
  if (!state.session.isValid) {
    dispatch(platformActions.setPage(LOGGEDOUT_REDIRECT));
    return;
  }

  const type = thingType(id);
  const thing = modelFromThingId(id, state);

  // If a promoted post or associated comment is voted on,
  // fire the appropriate pixel
  if (direction) {
    if (type === POST) {
      const post = thing;
      if (post.promoted) {
        const voteEvent = direction === 1 ? AdEvents.Upvote : AdEvents.Downvote;
        firePixelsOfType(post.events, voteEvent);
      }
    } else if (type === COMMENT) {
      const postId = thing.linkId;
      const post = state.posts[postId];
      if (post && post.promoted) {
        const voteEvent = direction === 1 ? AdEvents.CommentUpvote : AdEvents.CommentDownvote;
        firePixelsOfType(post.events, voteEvent); 
      }
    }
  }

  const stub = thing._vote(apiOptionsFromState(state), direction);
  dispatch(pending(id, stub));

  try {
    const model = await stub.promise();
    dispatch(success(id, model));

  } catch (e) {
    dispatch(failure(direction, type));
    if (!(e instanceof ResponseError)) {
      throw e;
    }
  }
};
