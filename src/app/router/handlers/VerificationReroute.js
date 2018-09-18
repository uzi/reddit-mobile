import { setPage, navigateToUrl } from 'platform/actions';
import { BaseHandler, METHODS } from 'platform/router';
import { loggedOutUserAccountSelector } from 'app/selectors/userAccount';

export default class VerficationReroute extends BaseHandler {
  async [METHODS.GET](dispatch, getState) {
    const state = getState();
    const { platform: { currentPage }} = state;
    const isLoggedOut = !!loggedOutUserAccountSelector(state);
    const { urlParams, queryParams: _queryParams, hashParams, referrer } = currentPage;
    const { token } = urlParams;

    const queryParams = { ..._queryParams, verification_token: token };

    const target = isLoggedOut ? '/login' : '/';

    if (process.env.ENV === 'client') {
      // redirect the url and make sure platform runs the handler
      dispatch(navigateToUrl(METHODS.GET, target, { queryParams, hashParams }));
    } else {
      // redirect but don't run the handler
      dispatch(setPage(target, { urlParams, queryParams, hashParams, referrer }));
    }
  }
}
