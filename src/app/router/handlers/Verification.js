import { filterHistory, setPage, navigateToUrl } from 'platform/actions';
import { BaseHandler, METHODS } from 'platform/router';
import { userAccountSelector } from 'app/selectors/userAccount';

export default class Verfication extends BaseHandler {
  async [METHODS.GET](dispatch, getState) {
    const state = getState();
    const { platform: { currentPage }} = state;
    const user = userAccountSelector(state);
    const isLoggedIn = user && !user.loggedOut;
    const { urlParams, queryParams: _queryParams, hashParams } = currentPage;
    const { verificationToken } = urlParams;
    const queryParams = { ..._queryParams, verification_token: verificationToken };

    // The login component sends the user back to the last URL that is not “login” or “register” when the user logs in or clicks on the close button, defaulting to the home page.
    // If the original verification url is in browser history the component will try to send them back there resulting in a broken experience.
    // This removes the original verification url from browser history after handling the verification route.
    // examples tests of the regex:
    // regex = /^\/?verification\//
    // regex.test('verification/') => true
    // regex.test('/verification/') => true
    // regex.test('prefix/verification/') => false
    // regex.test('/special_verification/') => false
    // regex.test('/verification_2/') => false

    if (process.env.ENV === 'client') {
      const historyFilter = (entry) => entry && !/^\/?verification\//.test(entry.url);
      // redirect the url and make sure platform runs the handler

      if (!isLoggedIn) {
        dispatch(setPage('/login', { queryParams, hashParams }));
      } else {
        dispatch(navigateToUrl(METHODS.GET, '/', { queryParams, hashParams }));
      }

      dispatch(filterHistory(historyFilter));
    }
  }
}
