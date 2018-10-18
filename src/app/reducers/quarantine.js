/**
 * Stores messages to disply on the subreddit quarantine interstitial
 * 
 * This reducer is *specifically* used for the quarantine interstitial.  When
 * the normal subreddit route handler receives a 403 back with a quarantine
 * response, the message is stored here.  AppMain uses this state to determine
 * whether to show the opt-in interstitial or just a generic error page.
 * 
 * If you need to access the quarantine interstitial for a subreddit that the
 * user has already opted into, you should do so through the normal subreddit
 * model.
 */
import { RECEIVED_SUBREDDIT } from 'app/actions/subreddits';
import {
  RECEIVED_QUARANTINE_INTERSTITIAL,
  OPTED_OUT_OF_QUARANTINE,
} from 'app/actions/quarantine';

export const DEFAULT = {};

export default (state=DEFAULT, action={}) => {
  switch (action.type) {
    case RECEIVED_QUARANTINE_INTERSTITIAL: {
      // We only really ever need to keep track of one subreddit's state here,
      // so no need to mix in ...state
      return {
        [action.name.toLowerCase()]: action.quarantineMessageHTML,
      };
    }

    case OPTED_OUT_OF_QUARANTINE:
    case RECEIVED_SUBREDDIT: {
      // We only ever really need to keep track of one subreddit's state here
      // so instead of deleting when we want to clear state, we might as well
      // just return the default state.
      return DEFAULT;
    }

    default: return state;
  }
};
