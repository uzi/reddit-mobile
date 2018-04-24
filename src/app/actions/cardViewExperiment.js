import { trackCardViewExperimentEvent } from 'lib/eventUtils';
import { getActiveExperimentVariant } from 'lib/experiments';

// TODO: prefer featureFlags.js variables instead of rewriting strings here
const LOGGED_IN_EXPERIMENT = 'mweb_card_view_as_default_logged_in_users';
const LOGGED_OUT_EXPERIMENT = 'mweb_card_view_as_default_logged_out_users';
const OPTED_IN_TRACKING_EVENT = 'opted_in_to_card_view';
const OPTED_OUT_TRACKING_EVENT = 'opted_out_of_card_view';

export function cardViewEnabled(state, loggedOut, optedOut) {
  const inLoggedInTreatment = getActiveExperimentVariant(state, LOGGED_IN_EXPERIMENT);
  const shouldShowToLoggedOutUser = !inLoggedInTreatment && loggedOut && !optedOut;
  const shouldShowToLoggedInUser = inLoggedInTreatment && !optedOut;
  return (shouldShowToLoggedInUser || shouldShowToLoggedOutUser);
}

export const OPTED_OUT_OF_CARD_VIEW = 'OPTED_OUT_OF_CARD_VIEW';
const optOutOfCardView = optedOut => ({ type: OPTED_OUT_OF_CARD_VIEW, optedOut });

export const toggleOptOutOfCardView = () => async (dispatch, getState) => {
  const state = getState();
  const loggedOut = state.user.loggedOut;
  const shouldTrack = cardViewEnabled(state, loggedOut);
  if (!shouldTrack) { return; }
  const { optedOutOfCardViewExperiment } = state;
  const didOptOutOfCardView = !optedOutOfCardViewExperiment;
  const event = didOptOutOfCardView
    ? OPTED_OUT_TRACKING_EVENT
    : OPTED_IN_TRACKING_EVENT;
  const experimentName = getActiveExperimentVariant(state, LOGGED_IN_EXPERIMENT)
    ? LOGGED_IN_EXPERIMENT
    : LOGGED_OUT_EXPERIMENT;

  trackCardViewExperimentEvent(state, event, experimentName);
  dispatch(optOutOfCardView(didOptOutOfCardView));
};
