import { createSelector } from 'reselect';

import {
  PAGE_NAMES,
  XPROMO,
} from 'app/constants';

export const pageTypeSelector = state => {
  const currentPageURL = (state.platform.currentPage && state.platform.currentPage.url) || '';
  if (/\/r\/\w+\/comments/.test(currentPageURL)) {
    return XPROMO.POST;
  }
  return XPROMO.LISTING;
};

// regexes borrowed from the router
// ['/r/:subredditName/(w|wiki)/:path(.*)?', WikiPageHandler]
// ['/(help|w|wiki)/:path(.*)?', WikiPageHandler]
const WIKI_REGEX_1 = /^\/r\/\w+\/((w)|(wiki))/;
const WIKI_REGEX_2 = /^((help)|(w)|(wiki))/;

export const isWikiPage = createSelector(
  state => state.platform.currentPage && state.platform.currentPage.url,
  url => WIKI_REGEX_1.test(url) || WIKI_REGEX_2.test(url)
);

export const getCurrentSubreddit = state => {
  const regex = /\/r\/(\w+)/;
  const page = state.platform.currentPage;
  const url = page && page.url;
  const match = url && regex.exec(url);
  const sub = match && match[1];
  const res = sub && state.subreddits[sub];
  return res;
};

export const getCurrentPost = state => {
  const regex = /\/r\/\w+\/comments\/(\w+)/;
  const page = state.platform.currentPage;
  const url = page && page.url;
  const match = url && regex.exec(url);
  const id = match && match[1];
  const res = id && state.posts[id];
  return res;
};

export const isCurrentContentNSFW = state => {
  const subreddit = getCurrentSubreddit(state);
  if (subreddit && subreddit.over18) { return true; }
  const post = getCurrentPost(state);
  if (post && post.over18) { return true; }
  return false;
};

export const isEmailVerified = state =>
  state.platform &&
  state.platform.currentPage &&
  state.platform.currentPage.queryParams &&
  state.platform.currentPage.queryParams.verified;

export function isHomePage(subredditName, pageName) {
  return !subredditName && pageName !== PAGE_NAMES.SEARCH; // the frontpage
}
