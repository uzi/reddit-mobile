import { getExperimentVariant } from 'lib/experiments';
import { userAccountSelector, loggedOutUserAccountSelector } from 'app/selectors/userAccount';
import localStorageAvailable from 'lib/localStorageAvailable';
import { pageTypeSelector } from 'app/selectors/platformSelector';
import { sendOutcome, sendObserve } from '../../apiClient/apis/ScaledInferenceEndpoint';
import { show } from 'app/actions/xpromo';
import { shouldNotShowBanner } from 'lib/xpromoState';
import { getCurrentPost, getCurrentSubreddit } from 'app/selectors/platformSelector';
import {
  SCALED_INFERENCE,
  OPT_OUT_XPROMO_INTERSTITIAL_MENU,
  OPT_OUT_XPROMO_INTERSTITIAL,
} from 'app/constants';

export const HANDSHAKE_BEGIN = 'SCALED_INFERENCE__HANDSHAKE_BEGIN';
export const HANDSHAKE_END = 'SCALED_INFERENCE__HANDSHAKE_END';
export const REPORT_OUTCOME = 'SCALED_INFERENCE__REPORT_OUTCOME';
export const SET_METADATA = 'SCALED_INFERENCE__SET_METADATA';
export const LOCAL_STORAGE_KEY = SCALED_INFERENCE.EXPERIMENT;
export const SCALED_INFERENCE_PROJECT_IDS = [0, 1, 2];

const outcomeQueue = [];
let observeSucceeded = false;

export const getStateFromLocalStorage = () => {
  if (localStorageAvailable()) {
    const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    return serializedState ? JSON.parse(serializedState) : {};
  }

  return {};
};

export const setStateInLocalStorage = (state) => {
  if (localStorageAvailable()) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }
};

export const updateStateInLocalStorage = (update) => {
  setStateInLocalStorage(Object.assign(getStateFromLocalStorage(), update));
};

export const clearStateInLocalStorage = () => {
  setStateInLocalStorage(null);
};

export const setMetadata = (payload) => {
  updateStateInLocalStorage(payload);
  return {
    type: SET_METADATA,
    payload,
  };
};

export const getMetadata = (state) => {
  return getStateFromLocalStorage() || state.scaledInference;
};

export const getScaledInferenceProjectId = (state) => {
  const queryParams = state.platform.currentPage && state.platform.currentPage.queryParams;

  if (queryParams && queryParams.si_project_id) {
    return parseInt(queryParams.si_project_id);
  }

  const variant = getExperimentVariant(state, LOCAL_STORAGE_KEY);

  switch (variant) {
    case SCALED_INFERENCE.PROJECT_1: return SCALED_INFERENCE_PROJECT_IDS[1];
    case SCALED_INFERENCE.PROJECT_2: return SCALED_INFERENCE_PROJECT_IDS[2];
    default: return SCALED_INFERENCE_PROJECT_IDS[0];
  }
};

export const isOptOut = (state) => {
  return state.optOuts[OPT_OUT_XPROMO_INTERSTITIAL_MENU.STORE_KEY] ||
         state.optOuts[OPT_OUT_XPROMO_INTERSTITIAL.STORE_KEY];
};

export const isScaledInferenceActive = (state) => {
  if (shouldThrottle(state)) { return false; }
  if (isOptOut(state)) { return false; }
  const id = getScaledInferenceProjectId(state);
  return id === SCALED_INFERENCE_PROJECT_IDS[2];
};

export const isScaledInferenceLatencyActive = (state) => {
  if (shouldThrottle(state)) { return false; }
  if (isOptOut(state)) { return false; }
  const id = getScaledInferenceProjectId(state);
  return id === SCALED_INFERENCE_PROJECT_IDS[1];
};

const shouldThrottle = (state) => {
  const userAccount = userAccountSelector(state);

  const platform = state && state.platform;
  const currentPage = platform && platform.currentPage;
  const queryParams = currentPage && currentPage.queryParams;

  if (queryParams && queryParams.si_throttle === 'off' ||
      queryParams && queryParams.si_experiment) {
    return false;
  }

  if (getScaledInferenceProjectId(state) !== SCALED_INFERENCE_PROJECT_IDS[0]) {
    return false;
  }

  const THROTTLE_PERCENTAGE = 25;

  const loggedOutUserAccount = loggedOutUserAccountSelector(state);
  const id = userAccount ? userAccount.id : loggedOutUserAccount.loid;
  const num = parseInt(id, 36);
  const mod = (num % 100) | 0;
  const pass = mod < THROTTLE_PERCENTAGE;

  return !pass;
};

export const getContextFromState = (state) => {
  const account = userAccountSelector(state) || loggedOutUserAccountSelector(state);
  const lastSessionTimestamp = (localStorageAvailable() && localStorage.getItem('last_session_timestamp')) || null;
  const post = getCurrentPost(state);
  const subreddit = getCurrentSubreddit(state);

  return {
    local_time: (new Date()).toString(),
    is_logged_out: !userAccountSelector(state),
    is_incognito: state.platform.incognito,
    is_post_nsfw: post && post.over18,
    is_subreddit_nsfw: subreddit && subreddit.over18,
    target_type: pageTypeSelector(state),
    post_type: post && post.postHint,
    referrer_source: document.referrer,
    is_night_mode: !(state.theme === 'daymode'),
    screen_width: window.innerWidth,
    screen_height: window.innerHeight,
    user_agent: state.meta.userAgent,
    last_mweb_session: lastSessionTimestamp,
    user_timestamp: state.loid.loidCreated,
    current_subreddit_id: subreddit && subreddit.id,
    is_card_view: !state.compact,
    karma: account.karma,
    current_post: post && post.id,
    is_opted_out: isOptOut(state),
  };
};

export const completeHandshake = (data) => async (dispatch, getState) => {
  dispatch(setMetadata(data));

  const state = getState();

  if (data.err) {
    dispatch(setMetadata({ ...data, variants: DEFAULT_XPROMO_TYPES }));

    if (projectId === SCALED_INFERENCE_PROJECT_IDS[2]) {
      if (!shouldNotShowBanner(state)) {
        dispatch(show());
      }
    }

    return;
  }

  observeSucceeded = true;
  outcomeQueue.forEach(closure => {
    closure(data);
  });

  const projectId = getScaledInferenceProjectId(state);

  if (projectId === SCALED_INFERENCE_PROJECT_IDS[2]) {
    dispatch(setMetadata({ ...data, variants: data.variants || DEFAULT_XPROMO_TYPES }));
    if (!isOptOut(state)) {
      dispatch(show());
    }
  } else {
    dispatch(setMetadata({ ...data, variants: DEFAULT_XPROMO_TYPES }));

    if (projectId === SCALED_INFERENCE_PROJECT_IDS[1]) {
      if (!shouldNotShowBanner(state)) {
        dispatch(show());
      }
    }
  }
};

let handshakeCalled = false;

export const handshake = () => async (dispatch, getState) => {
  if (handshakeCalled) { return; }

  handshakeCalled = true;

  // the PLATFORM__SET_STATUS action will trigger the dispatch of this
  // action creator in order to prevent a context data race condition
  // the above flag ensures it is only called once

  const state = getState();
  const storage = getMetadata(state);
  const session = extractSession(storage);
  const outcomes = (storage && storage.outcomes) || {};

  if (shouldThrottle(state)) {
    return;
  }

  const projectId = getScaledInferenceProjectId(state);
  const payload = {
    context: { ...outcomes, ...getContextFromState(state) },
    session,
    project_id: projectId,
    variants: storage.variants,
  };

  dispatch({ type: HANDSHAKE_BEGIN });

  return sendObserve(payload).then(json => {
    return dispatch(completeHandshake(json));
  });
};

const DEFAULT_XPROMO_TYPES = {
  [SCALED_INFERENCE.CLICK]: SCALED_INFERENCE.D,
  [SCALED_INFERENCE.POST]: SCALED_INFERENCE.BB,
  [SCALED_INFERENCE.LISTING]: SCALED_INFERENCE.TA,
};

export const extractSession = (storage) => {
  return (storage && storage.session) || null;
};

export const reportOutcome = (outcome, isHeaderButton = false, trigger = null) => async (dispatch, getState) => {
  const state = getState();

  const projectId = getScaledInferenceProjectId(state);

  if (observeSucceeded || !projectId) {
    return dispatch(_reportOutcome(outcome, isHeaderButton, null, trigger));
  }

  outcomeQueue.push(({ session }) => {
    return dispatch(_reportOutcome(outcome, isHeaderButton, session, trigger));
  });

  return null;
};

export const _reportOutcome = (outcome, isHeaderButton = false, _session = null, _trigger = null) => async (dispatch, getState) => {
  const state = getState();

  if (shouldThrottle(state)) {
    return;
  }

  const storage = getMetadata(state);

  const pageType = pageTypeSelector(state);
  const trigger = _trigger || pageType;
  const xpromoType = (storage.variants || DEFAULT_XPROMO_TYPES)[trigger];
  const session = _session || extractSession(storage);
  const projectId = getScaledInferenceProjectId(state);
  const payload = {
    session,
    outcome,
    trigger,
    xpromoType,
    headerButton: isHeaderButton,
    project_id: projectId,
  };

  dispatch({
    type: REPORT_OUTCOME,
    outcome,
  });

  if (outcome === SCALED_INFERENCE.ACCEPT || outcome === SCALED_INFERENCE.DISMISS) {
    const storage = getMetadata(state);
    const outcomes = storage && storage.outcomes;

    const prefix = `${trigger}_${xpromoType}`;
    const timestampKey = `${prefix}_time_since_last_view`;
    const responseKey = `${prefix}_last_view_response`;
    const now = Date.now();

    const updatedOutcomes = {
      ...outcomes,
      [timestampKey]: now,
      [responseKey]: outcome,
    };

    dispatch(setMetadata({ ...storage, session, outcomes: updatedOutcomes }));
  }

  return sendOutcome(payload);
};
