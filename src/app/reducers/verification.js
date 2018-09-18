import * as verificationActions from 'app/actions/verification';

const DEFAULT = {
  token: null,
};

export default function(state=DEFAULT, action={}) {
  switch (action.type) {
    case verificationActions.SET_TOKEN:
      return { token: action.token };
    default: return state;
  }
}
