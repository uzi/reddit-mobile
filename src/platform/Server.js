import { Thunker, PromiseWell } from '@r/middleware';
import Koa from 'koa';
import KoaRouter from 'koa-router';
import KoaBodyParser from 'koa-bodyparser';
import { combineReducers, createStore, applyMiddleware } from 'redux';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import values from 'lodash/values';

import navigationMiddleware from './navigationMiddleware';
import platform from './reducer';
import * as actions from './actions';
import { createQuery } from './pageUtils';
import { METHODS } from './router';

export default config => {
  const {
    port=8888,
    preRouteServerMiddleware=[],
    reduxMiddleware=[],
    reducers={},
    routes=[],
    getServerRouter=() => {},
    template=() => {},
    dispatchBeforeNavigation=async () => {},
    dispatchAfterNavigation=async () => {},
    onHandlerComplete=() => {},
  } = config;

  const server = new Koa();
  const bodyparser = KoaBodyParser();
  const router = new KoaRouter();

  const handleRoute = async ctx => {
    const nav = navigationMiddleware.create(routes, true, onHandlerComplete);
    const well = PromiseWell.create();
    const thunk = Thunker.create();

    const r = combineReducers({ ...reducers, platform });

    const store = createStore(r, {}, applyMiddleware(
      ...reduxMiddleware,
      nav,
      thunk,
      well.middleware,
    ));

    await store.dispatch(async (dispatch, getState, utils) => {
      await dispatchBeforeNavigation(ctx, dispatch, getState, utils);
    });

    store.dispatch(actions.navigateToUrl(
      ctx.request.method.toLowerCase(),
      ctx.path,
      {
        queryParams: ctx.request.query,
        bodyParams: ctx.request.body,
        referrer: ctx.headers.referer,
      }
    ));

    await store.dispatch(async (dispatch, getState, utils) => {
      await dispatchAfterNavigation(ctx, dispatch, getState, utils);
    });

    await well.onComplete();
    const state = store.getState();

    // check for redirects
    const currentUrl = state.platform.currentPage.url;
    const currentQuery = state.platform.currentPage.queryParams;

    if (!isEqual(currentUrl, ctx.path) || !isEqual(currentQuery, ctx.request.query)) {
      if (currentUrl) {
        let newUrl = currentUrl;
        if (!isEmpty(currentQuery)) { newUrl += createQuery(currentQuery); }
        ctx.redirect(newUrl);
      } else {
        ctx.redirect('/');
      }
    } else {
      // HEAD request must not have a response body but otherwise
      // are equivalent to GETs.
      // HEAD requests are converted into GETS by navigation middleware
      // if there isn't an explicit HEAD method on our handler.
      if (ctx.request.method.toLowerCase() !== METHODS.HEAD) {
        ctx.body = template(state, store);
      }

      ctx.status = state.platform.currentPage.status;
    }
  };

  // set up server routes before setting up shared routes
  getServerRouter(router);

  for (const route of routes) {
    const [path, handler] = route;
    for (const method of values(METHODS)) {
      if (handler.prototype[method]) {
        router[method](path, handleRoute);
      }
    }
  }

  // hook up all the middleware to the koa instance
  preRouteServerMiddleware.forEach(m => server.use(m));
  server.use(bodyparser);
  server.use(router.routes());
  server.use(router.allowedMethods());

  return () => {
    server.listen(port, () => {
      console.log(`App launching on port ${port}`);
    });
  };
};
