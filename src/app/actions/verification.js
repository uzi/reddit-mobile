export const SET_TOKEN = 'VERIFICATION__SET_TOKEN';
export const BEGIN_VERIFICATION = 'VERIFICATION__BEGIN';
export const END_VERIFICATION = 'VERIFICATION__END';

export const EMAIL_ALREADY_VERIFIED = 'EMAIL_ALREADY_VERIFIED';
export const EMAIL_VERIFY_WRONG_USER = 'EMAIL_VERIFY_WRONG_USER';

import endpoint from 'apiClient/apis/VerificationEndpoint';
import { apiOptionsFromState } from 'lib/apiOptionsFromState';
import { toastSuccess, toastError } from 'app/actions/toaster';
import { notify } from 'app/actions/notification';

export function setVerificationToken(token) {
  return {
    type: SET_TOKEN,
    token,
  };
}

export const getVerificationTokenFromState = (state) => {
  const { platform: { currentPage }} = state;
  const { queryParams } = currentPage;
  const { verification_token: token } = queryParams;
  return token;
};

export const beginVerification = (token) => async (dispatch, getState) => {
  const state = getState();

  token = token || getVerificationTokenFromState(state);

  if (!token) {
    return;
  }

  const apiOptions = apiOptionsFromState(state);

  endpoint.post(apiOptions, token).then((response) => {
    if (response.success) {
      dispatch(toastSuccess('Success, email verification complete.'));
      return;
    }

    switch (response.reason) {
      case EMAIL_ALREADY_VERIFIED:
        dispatch(toastError('This email has already been verified.'));
        return;
      case EMAIL_VERIFY_WRONG_USER:
        dispatch(notify({
          title: 'Complete Verification',
          content: 'The email verification link you\'ve followed is for a different user account. Please log out and click the email verification link again to verify your email.',
          button: 'GOT IT',
        }));
        return;
      default:
        dispatch(toastError('Something went wrong.'));
    }
  }).catch(() => {
    dispatch(toastError('Something went wrong.'));
  });
};
