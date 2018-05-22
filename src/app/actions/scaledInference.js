import { userAccountSelector, loggedOutUserAccountSelector } from 'app/selectors/userAccount';
import { getExperimentVariant } from 'lib/experiments';
import localStorageAvailable from 'lib/localStorageAvailable';
import { pageTypeSelector } from 'app/selectors/platformSelector';
import { sendOutcome, sendObserve } from '../../apiClient/apis/ScaledInferenceEndpoint';

export const HANDSHAKE_BEGIN = 'SCALED_INFERENCE__HANDSHAKE_BEGIN';
export const HANDSHAKE_END = 'SCALED_INFERENCE__HANDSHAKE_END';
export const REPORT_OUTCOME = 'SCALED_INFERENCE__REPORT_OUTCOME';
export const SET_METADATA = 'SCALED_INFERENCE__SET_METADATA';
export const LOCAL_STORAGE_KEY = 'scaled_inference';
export const SCALED_INFERENCE_PROJECT_IDS = [0, 1, 2];

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
  const storage = getStateFromLocalStorage();
  setStateInLocalStorage({ ...storage, ...payload });
  return {
    type: SET_METADATA,
    payload,
  };
};

export const getScaledInferenceProjectId = (state) => {
  const variant = getExperimentVariant(state, LOCAL_STORAGE_KEY);

  switch (variant) {
    case 'treatment_1': return SCALED_INFERENCE_PROJECT_IDS[1];
    case 'treatment_2': return SCALED_INFERENCE_PROJECT_IDS[2];
    default: return SCALED_INFERENCE_PROJECT_IDS[0];
  }
};

export const shouldThrottle = (state) => {
  const userAccount = userAccountSelector(state);
  const loggedOutUserAccount = loggedOutUserAccountSelector(state);
  const id = userAccount ? userAccount.id : loggedOutUserAccount.loid;
  const num = parseInt(id, 36);
  const percentile = num % 100;
  return percentile !== 42;
};

export const getContextFromState = (state) => {
  const account = userAccountSelector(state) || loggedOutUserAccountSelector(state);
  const lastSessionTimestamp = localStorage.getItem('last_session_timestamp') || null;

  return {
    is_logged_out: !userAccountSelector(state),
    local_time: (new Date()).toString(),
    is_incognito: state.platform.incognito,
    is_post_nsfw: null,
    is_subreddit_nsfw: null,
    target_type: pageTypeSelector(state),
    post_type: null,
    referrer_source: document.referrer,
    is_night_mode: !(state.theme === 'daymode'),
    screen_width: window.innerWidth,
    screen_height: window.innerHeight,
    user_agent: state.meta.userAgent,
    last_mweb_session: lastSessionTimestamp,
    user_timestamp: state.loid.loidCreated,
    current_subreddit_id: null,
    // page_load_time: null,
    is_card_view: !state.compact,
    karma: account.karma,
    last_seen_subreddit_id: null,
    current_post: null,
    last_seen_post_id: null,
  };
};

export const handshake = () => async (dispatch, getState) => {
  const storage = getStateFromLocalStorage();
  const session = (storage && storage.session) || {};
  const outcomes = (storage && storage.outcomes) || {};
  const state = getState();

  if (shouldThrottle(state)) {
    return;
  }

  const projectId = getScaledInferenceProjectId(state);
  const payload = {
    context: { ...outcomes, ...getContextFromState(state) },
    session,
    project_id: projectId,
  };

  dispatch({ type: HANDSHAKE_BEGIN });

  return sendObserve(payload).then(json => {
    updateStateInLocalStorage({ session: json });

    return dispatch({
      type: HANDSHAKE_END,
      data: json,
    });
  });
};

const DEFAULT_XPROMO_TYPES = {
  click: 'D',
  post: 'BB',
  listing: 'TA',
};

export const reportOutcome = (outcome, isHeaderButton = false) => async (dispatch, getState) => {
  const state = getState();

  if (shouldThrottle(state)) {
    return;
  }

  const { trigger: _trigger, xpromoType: _xpromoType } = state.scaledInference;
  const pageType = pageTypeSelector(state);
  const trigger = _trigger || pageType;
  const xpromoType = _xpromoType || DEFAULT_XPROMO_TYPES[trigger];
  const { session } = getStateFromLocalStorage();
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

  if (outcome === 'accept' || outcome === 'dismiss') {
    const storage = getStateFromLocalStorage();
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

    updateStateInLocalStorage({ ...storage, outcomes: updatedOutcomes });
  }

  return sendOutcome(payload);
};
