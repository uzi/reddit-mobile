// replies are technically comments. _but_ its an action taken on a post or comment.
// Thus all actions related to replying, opening the form, and making the reply
// are kept in this file.

import { COMMENT } from 'apiClient/models/thingTypes';

import { getEventTracker } from 'lib/eventTracker';
import { getBasePayload, buildSubredditData, convertId } from 'lib/eventUtils';
import { apiOptionsFromState } from 'lib/apiOptionsFromState';
import { firePixelsOfType, AdEvents } from 'lib/ads';
import * as rulesModalActions from 'app/actions/rulesModal';
import { flags } from 'app/constants';
import features from 'app/featureFlags';
import modelFromThingId from 'app/reducers/helpers/modelFromThingId';
import { navigateToUrl } from 'platform/actions';
import { METHODS } from 'platform/router';


export const TOGGLE = 'REPLY__TOGGLE';
export const PENDING = 'REPLY__PENDING';
export const SUCCESS = 'REPLY__SUCCESS';
export const FAILURE = 'REPLY__FAILURE';

export const toggle = parentId => async (dispatch, getState) => {
  const state = getState();

  dispatch({ type: TOGGLE, parentId });

  // If a logged out user tries to comment or reply to a comment redirect to sign up
  if (!state.session.isValid) {
    return dispatch(navigateToUrl(METHODS.GET, '/register'));
  }

  // Experiment to show subreddit rules at comment time.
  const { subredditName } = state.platform.currentPage.urlParams;
  const featureName = 'rules_modal_on_comment';
  const key = rulesModalActions.getLocalStorageKey(featureName, subredditName);

  // Disable during shell rendering, necessary to ensure that the modal hasn't
  // been marked as "seen" in localStorage before showing
  if (state.platform.shell) { return; }
  // Disable if we aren't in a subreddit context
  if (!subredditName) { return; }
  // Disable if modal has been marked as "seen" in localStorage
  if (state.rulesModal[key]) { return; }

  const feature = features.withContext({ state });
  const clickAnywhereEnabled = feature.enabled(flags.RULES_MODAL_ON_COMMENT_CLICK_ANYWHERE);
  const clickButtonEnabled = feature.enabled(flags.RULES_MODAL_ON_COMMENT_CLICK_BUTTON);

  // Disable if none of the relevant features are enabled
  if (!(clickAnywhereEnabled || clickButtonEnabled)) { return; }

  const isRequired = clickButtonEnabled;
  const thingType = COMMENT;
  const onDecline = dispatch => dispatch({ type: TOGGLE, parentId });
  dispatch(rulesModalActions.display(
    featureName,
    subredditName,
    thingType,
    isRequired,
    onDecline,
  ));
};

export const success = (parentId, reply) => ({
  parentId,
  type: SUCCESS,
  model: reply,
  message: 'Comment added!',
});

export const pending = parentId => ({
  type: PENDING,
  parentId,
});

export const failure = parentId => ({
  type: FAILURE,
  parentId,
});

export const submit = (parentId, { text }) => async (dispatch, getState) => {
  const state = getState();
  const model = modelFromThingId(parentId, state);

  if (state.replyRequests[parentId] && state.replyRequests[parentId].pending) { return; }
  if (!model) {
    dispatch(failure(parentId));
    return;
  }

  try {
    dispatch(pending(parentId));
    const apiResponse = await model.reply(apiOptionsFromState(state), text);
    const reply = apiResponse.getModelFromRecord(apiResponse.results[0]);

    dispatch(success(parentId, reply));

    // Fire comment-submitted pixel if associated with promoted post
    const post = state.posts[reply.linkId];
    if (post.promoted) {
      firePixelsOfType(post.events, AdEvents.CommentSubmitted);
    }

    logReply(reply, getState());
  } catch (e) {
    dispatch(failure(parentId));
  }
};


function logReply(reply, state) {
  const parent = modelFromThingId(reply.parentId, state);
  const post = state.posts[reply.linkId];

  getEventTracker().track('comment_events', 'cs.comment', {
    ...getBasePayload(state),
    ...buildSubredditData(state),
    comment_id: convertId(reply.name),
    comment_fullname: reply.name,
    comment_body: reply.bodyMD,
    post_id: convertId(post.name),
    post_fullname: post.name,
    post_created_ts: post.createdUTC * 1000,
    parent_id: convertId(parent.name),
    parent_fullname: parent.name,
    parent_created_ts: parent.createdUTC * 1000,
  });
}
