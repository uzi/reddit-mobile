import 'babel-polyfill';
import './lib/dnt';

import React from 'react';
import isEmpty from 'lodash/isEmpty';

import localStorageAvailable from 'lib/localStorageAvailable';

import Client from 'platform/Client';
import * as platformActions from 'platform/actions';
import * as sharingActions from 'app/actions/sharing';
import { toastSuccess } from 'app/actions/toaster';
import { TOAST_SUCCESS_EMAIL_VALIDATION } from 'app/constants';
import { isEmailVerified } from 'app/selectors/platformSelector';

import App from 'app';
import config from 'config';
import errorLog from 'lib/errorLog';
import { initGoogleTagManager } from 'lib/gtm';
import { setupGoogleTag } from 'lib/dfp';
import routes from 'app/router';
import reducers from 'app/reducers';
import reduxMiddleware from 'app/reduxMiddleware';
import { sendTimings, onHandlerCompleteTimings } from 'lib/timing';
import Session from 'app/models/Session';
import Preferences from 'apiClient/models/Preferences';
import * as xpromoActionsClientOnly from 'app/actions/xpromoClientOnly';
import detectIncognito from 'lib/detectIncognito';
import {
  trackExposeSharing,
  trackXPromoIncognito,
} from 'lib/eventUtils';

// importing these to populate the branch.link property needed for mobile sharing
import { branchProxy } from 'app/actions/sharing';
import branch from 'branch-sdk';

// Bits to help in the gathering of client side timings to relay back
// to the server
const beginMount = Date.now();
let isShell;

window.onload = () => {
  const endMount = Date.now();
  sendTimings(beginMount, endMount, isShell);
  initGoogleTagManager();
  setupGoogleTag();
};

const ERROR_ENDPOINTS = {
  log: config.postErrorURL,
  hivemind: config.statsURL,
};

const ERROR_LOG_OPTIONS = {
  SHOULD_RETHROW: false, // prevent error-log from re-throwing errors that were uncaught
};

const fullPathName = () => {
  // window.location.pathname doesn't include query params, hash, etc
  const { pathname, search, hash } = window.location;
  return `${pathname}${search}${hash}`;
};

const getUserAgentAndURL = () => ({
  userAgent: window.navigator.userAgent,
  requestUrl: fullPathName(),
});

// We hang on to this so we can call it after we add our own onerror callback.
const noOp = () => {}; // no-op for debug-mode when sentry isn't enabled
const sentryOnError = window.onerror || noOp;

// register `window.onerror` and `window.onunhandledrejection` handlers
// asap to start logging any errors that come through.
// We pass ERROR_ENDPOINTS to configure the endpoints we log to,
// and ERROR_LOG_OPTIONS to prevent double logging errors.
// RE the latter, `errorLog` rethrows errors and rejection events
// in a new callstack so chrome's default error-logging will
// do its default error formatting and stack traces. We don't want to re-throw
// these top-level errors and rejections, because they'd show up in the console
// twice.
window.onerror = (...args) => {
  const [message, url, line, column, error] = args;
  errorLog({
    ...getUserAgentAndURL(),
    error,
    message,
    url,
    line,
    column,
  }, ERROR_ENDPOINTS, ERROR_LOG_OPTIONS);

  sentryOnError(...args);
};

// This isn't supported in most mobile browsers right now but it is in chrome.
// Having it will give us better logging in debug (for promises that don't have
// a .catch handler). Maybe mobile browsers will support it soon as well.
window.onunhandledrejection = rejection => {
  errorLog({
    ...getUserAgentAndURL(),
    rejection,
  }, ERROR_ENDPOINTS, ERROR_LOG_OPTIONS);
};

// start the app now
const client = Client({
  routes,
  reducers,
  reduxMiddleware,
  modifyData: data => {
    // TODO if we start not using shell rendering in a serious way,
    // we'll need to unserialize all of the api models. This should
    // be considered when we debate using JSON output from the models
    // instead of the api model instances.

    if (!isEmpty(data.session)) {
      data.session = new Session(data.session);
      window.session = data.session;
    }

    data.preferences = Preferences.fromJSON(data.preferences);

    data.meta.env = 'CLIENT';

    // Pull some defaults from localStorage (if available)
    if (localStorageAvailable()) {
      try {
        const collapsedComments = window.localStorage.collapsedComments;
        if (collapsedComments !== undefined) {
          data.comments.collapsed = JSON.parse(collapsedComments);
        }
      } catch (e) { console.warn(e); }

      try {
        const expandedPosts = window.localStorage.expandedPosts;
        if (expandedPosts !== undefined) {
          data.expandedPosts = JSON.parse(expandedPosts);
        }
      } catch (e) { console.warn(e); }

      try {
        const visitedPosts = window.localStorage.visitedPosts;
        if (visitedPosts !== undefined) {
          if (!visitedPosts.startsWith('[')) {
            // Old format -- comma separated string
            data.visitedPosts = visitedPosts.split(',');
          } else {
            data.visitedPosts = JSON.parse(visitedPosts);
          }
        }
      } catch (e) { console.warn(e); }

      try {
        const optOuts = window.localStorage.optOuts;
        if (optOuts !== undefined) {
          data.optOuts = JSON.parse(optOuts);
        }
      } catch (e) { console.warn(e); }

      try {
        const rulesModal = window.localStorage.rulesModal;
        if (rulesModal !== undefined) {
          data.rulesModal = JSON.parse(rulesModal);
        }
      } catch (e) { console.warn(e); }
    }

    return data;
  },
  appComponent: <App/>,
  debug: (process.env.NODE_ENV || 'production') !== 'production',
  onHandlerComplete: onHandlerCompleteTimings,
})();

isShell = client.getState().platform.shell;
client.dispatch(platformActions.activateClient());

if (isShell) {
  // We need to use this action right here, because
  // the branch SDK will use the global window object
  client.dispatch(xpromoActionsClientOnly.checkAndSet());
}

client.dispatch(sharingActions.detectWebShareCapability());

const state = client.getState();
const emailVerified = isEmailVerified(state);

trackExposeSharing(state);

detectIncognito().then(result => {
  if (result) {
    trackXPromoIncognito(state);
    client.dispatch(platformActions.incognitoDetected());
  }
});

if (emailVerified) {
  client.dispatch(toastSuccess(TOAST_SUCCESS_EMAIL_VALIDATION));
}

// expose mobile sharing

// populate the branchProxy object with branch.link
branchProxy.link = (payload, callback) => { return branch.link(payload, callback); };
