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
