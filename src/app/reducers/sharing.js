import { SHOW_CTA, HIDE_CTA, SET_LINK } from 'app/actions/sharing';

const DEFAULT = {
  visible: false,
  link: null,
  pending: false,
};

export default function(state=DEFAULT, action={}) {
  switch (action.type) {
    case SHOW_CTA:
      return { ...state, link: null, visible: true };
    case HIDE_CTA:
      return { ...state, visible: false };
    case SET_LINK:
      return { ...state, link: action.link };
    default:
      return state;
  }
}
