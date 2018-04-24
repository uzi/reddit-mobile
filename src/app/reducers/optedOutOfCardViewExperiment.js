import { OPTED_OUT_OF_CARD_VIEW } from 'app/actions/cardViewExperiment';

export const DEFAULT = false;

export default (state = DEFAULT, action = {}) => {
  switch (action.type) {
    case OPTED_OUT_OF_CARD_VIEW: {
      return action.optedOut;
    }

    default: return state;
  }
};
