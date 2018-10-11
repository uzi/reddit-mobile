import SitewideRulesEndpoint from 'apiClient/apis/SitewideRulesEndpoint';
import ResponseError from 'apiClient/errors/ResponseError';

import { apiOptionsFromState } from 'lib/apiOptionsFromState';

export const FETCHING_SITEWIDE_RULES = 'FETCHING_SITEWIDE_RULES';
export const fetching = () => ({
  type: FETCHING_SITEWIDE_RULES,
});

export const RECEIVED_SITEWIDE_RULES = 'RECEIVED_SITEWIDE_RULES';
export const received = sitewideRules => ({
  type: RECEIVED_SITEWIDE_RULES,
  sitewideRules,
});

export const FAILED_SITEWIDE_RULES = 'FAILED_SITEWIDE_RULES';
export const failed = error => ({
  type: FAILED_SITEWIDE_RULES,
  error,
});

/**
 * Fetch sitewide rules.
 * @function
 */
export const fetchSitewideRules = () => async (dispatch, getState) => {
  const state = getState();
  const apiOptions = apiOptionsFromState(state);

  const pendingRequest = state.sitewideRulesRequests;
  if (pendingRequest && !(pendingRequest.failed || pendingRequest.loading)) {
    return;
  }

  dispatch(fetching());

  try {
    const res = await SitewideRulesEndpoint.get(apiOptions);
    const sitewideRules = res.results.map(r => res.getModelFromRecord(r));

    dispatch(received(sitewideRules));
  } catch (e) {
    if (e instanceof ResponseError) {
      dispatch(failed(e));
    } else {
      throw e;
    }
  }
};
