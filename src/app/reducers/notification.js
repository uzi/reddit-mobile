import { NOTIFY, DISMISS } from 'app/actions/notification';

export const DEFAULT = {
  visible: false,
  title: '',
  content: '',
  button: '',
};

export default (state=DEFAULT, action={}) => {
  switch (action.type) {
    case NOTIFY:
      return { ...DEFAULT, ...action.payload, visible: true };
    case DISMISS:
      return { ...state, visible: false };
    default:
      return state;
  }
};
