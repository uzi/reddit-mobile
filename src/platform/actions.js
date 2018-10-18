import { METHODS } from './router';

export const INCOGNITO_DETECTED = 'PLATFORM__INCOGNITO_DETECTED';
export const SET_PAGE = 'PLATFORM__SET_PAGE';
export const SET_STATUS = 'PLATFORM__SET_STATUS';
export const GOTO_PAGE_INDEX = 'PLATFORM__GOTO_PAGE_INDEX';
export const NAVIGATE_TO_URL = 'PLATFORM__NAVIGATE_TO_URL';
export const SET_SHELL = 'PLATFORM__SET_SHELL';
export const REDIRECT = 'PLATFORM__REDIRECT';
export const REROUTE_PAGE = 'PLATFORM__REROUTE_PAGE'; // re-run the handlers for the page
export const REWRITE_HISTORY = 'PLATFORM__REWRITE_HISTORY';

export const incognitoDetected = () => (
  { type: INCOGNITO_DETECTED }
);

export const setPage = (url, { urlParams={}, queryParams={}, hashParams={}, referrer='' }={}) => ({
  type: SET_PAGE,
  payload: { url, urlParams, queryParams, hashParams, referrer },
});

export const filterHistory = (pred) => async (dispatch, getState) => {
  const history = getState().platform.history.filter(pred);
  return dispatch({
    type: REWRITE_HISTORY,
    payload: { history },
  });
};

export const gotoPageIndex = (
  pageIndex,
  pathName,
  {
    queryParams={},
    hashParams={},
    referrer='',
  }={}
) => ({
  type: GOTO_PAGE_INDEX,
  payload: { pageIndex, pathName, queryParams, hashParams, referrer },
});

export const navigateToUrl = (
  method,
  pathName,
  {
    queryParams={},
    hashParams={},
    bodyParams={},
    referrer='',
  }={}
) => ({
  type: NAVIGATE_TO_URL,
  payload: { method, pathName, queryParams, hashParams, bodyParams, referrer },
});

export const setShell = shell => ({ type: SET_SHELL, shell });

export const redirect = url => ({ type: REDIRECT, url });

export const reroutePage = () => async (dispatch, getState) => {
  const { currentPage } = getState().platform;

  dispatch(navigateToUrl(
    METHODS.GET,
    currentPage.url,
    {
      queryParams: currentPage.queryParams,
      hashParams: currentPage.hashParams,
      bodyParams: {},
      referrer: currentPage.referrer,
    }
  ));
};

export const activateClient = () => async (dispatch, getState) => {
  const { platform } = getState();
  if (!platform.shell) { return; }

  dispatch(setShell(false));
  dispatch(reroutePage());
};

export const setStatus = (status) => (
  {
    type: SET_STATUS,
    payload: { status },
  }
);
