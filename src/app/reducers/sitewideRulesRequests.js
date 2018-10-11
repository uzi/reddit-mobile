import merge from 'platform/merge';

import * as sitewideRulesActions from 'app/actions/sitewideRules';
import { newSitewideRulesRequest } from 'app/models/SitewideRulesRequests';

export const DEFAULT = null;

export default (state=DEFAULT, action={}) => {
  switch (action.type) {
    case sitewideRulesActions.FETCHING_SITEWIDE_RULES: {
      const currentRequest = state;
      if (currentRequest && currentRequest.loading) { return state; }

      return newSitewideRulesRequest();
    }

    case sitewideRulesActions.RECEIVED_SITEWIDE_RULES: {
      const currentRequest = state;
      if (!(currentRequest && currentRequest.loading)) { return state; }

      return merge(state, { loading: false });
    }

    case sitewideRulesActions.FAILED_SITEWIDE_RULES: {
      const currentRequest = state;
      if (!(currentRequest && currentRequest.loading)) { return state; }

      return merge(state, { loading: false, failed: true });
    }
    default: return state;
  }
};
