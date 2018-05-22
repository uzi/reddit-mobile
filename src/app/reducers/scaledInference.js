import * as scaledInferenceActions from 'app/actions/scaledInference';

const DEFAULT = {
  session: {},
  outcomes: {},
  trigger: null,
  xpromoType: null,
};

export default function scaledInferenceReducer(state=DEFAULT, action) {
  switch (action.type) {
    case scaledInferenceActions.SET_METADATA:
      return { ...action.payload, ...state };
    default:
      return state;
  }
}
