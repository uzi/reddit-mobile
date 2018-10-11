import * as loginActions from 'app/actions/login';
import * as sitewideRulesActions from 'app/actions/sitewideRules';

const DEFAULT = [];

export default function(state=DEFAULT, action={}) {
  switch (action.type) {
    case loginActions.LOGGED_IN:
    case loginActions.LOGGED_OUT: {
      return DEFAULT;
    }

    case sitewideRulesActions.RECEIVED_SITEWIDE_RULES: {
      const { sitewideRules } = action;
      return sitewideRules;
    }

    default: return state;
  }
}
