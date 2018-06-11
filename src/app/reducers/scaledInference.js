import * as scaledInferenceActions from 'app/actions/scaledInference';
import { SCALED_INFERENCE } from 'app/constants';

const { D, BB, TA } = SCALED_INFERENCE;

const DEFAULT = {
  session: {},
  outcomes: {},
  variants: {
    xpromo_click: D,
    xpromo_post: BB,
    xpromo_listing: TA,
  },
  xpromoType: null,
};

export default function scaledInferenceReducer(state=DEFAULT, action) {
  switch (action.type) {
    case scaledInferenceActions.SET_METADATA:
      return { ...state, ...action.payload };
    default:
      return state;
  }
}
