import { PAGE_NAMES } from 'app/constants';
import { SUPPORTED_SORTS } from 'app/sortValues';
import CommentsPageHandler from './handlers/CommentsPage';
import CommunityGotoActionHandler from './handlers/CommunityGotoAction';
import PostsFromSubredditHandler from './handlers/PostsFromSubreddit';
import LiveRedirectHandler from './handlers/LiveRedirect';
import Login from './handlers/Login';
import Register from './handlers/Register';
import OverlayMenuCompactToggleHandler from './handlers/OverlayMenuCompactToggle';
import OverlayMenuThemeToggleHandler from './handlers/OverlayMenuThemeToggle';
import SavedAndHiddenHandler from './handlers/SavedAndHidden';
import SearchPageHandler from './handlers/SearchPage';
import SetOver18Handler from './handlers/SetOver18';
import SubredditAboutPageHandler from './handlers/SubredditAboutPage';
import SubredditRulesPageHandler from './handlers/SubredditRulesPage';
import ToggleSubredditSubscriptionHandler from './handlers/ToggleSubredditSubscription';
import UserActivityHandler from './handlers/UserActivity';
import UserActivityRerouteHandler from './handlers/UserActivityReroute';
import UserProfilerHandler from './handlers/UserProfile';
import DirectMessage from './handlers/DirectMessage';
import Messages from './handlers/Messages';
import WikiPageHandler from './handlers/WikiPage';
import { PostSubmitHandler, PostSubmitCommunityHandler } from './handlers/PostSubmit';
import UserRerouteHandler from './handlers/UserReroute';
import Status404PageHandler from './handlers/Status404Page';

const SORTS = SUPPORTED_SORTS.join('|');

/* eslint-disable max-len */
export default [
  ['/', PostsFromSubredditHandler, { name: 'index' }],
  ['/place', PostsFromSubredditHandler, { name: 'place' }],
  ['/r/:subredditName(place)', PostsFromSubredditHandler, { name: 'place' }],
  [`/r/:subredditName(place)/:sort(${SORTS})`, PostsFromSubredditHandler, { name: 'place' }],
  [`/:sort(${SORTS})`, PostsFromSubredditHandler, { name: PAGE_NAMES.LISTING }],
  ['/r/:subredditName', PostsFromSubredditHandler, { name: PAGE_NAMES.LISTING }],
  ['/user/:user/m/:multi', PostsFromSubredditHandler, { name: PAGE_NAMES.LISTING }],
  ['/r/:subredditName/comments/:postId/comment/:commentId', CommentsPageHandler, { name: PAGE_NAMES.COMMENTS }],
  ['/r/:subredditName/comments/:postId/:postTitle/:commentId', CommentsPageHandler, { name: PAGE_NAMES.COMMENTS }],
  ['/r/:subredditName/comments/:postId/:postTitle?', CommentsPageHandler, { name: PAGE_NAMES.COMMENTS }],
  [`/:pageName(${PAGE_NAMES.SEARCH})`, SearchPageHandler, { name: PAGE_NAMES.SEARCH }],
  [`/r/:subredditName/:pageName(${PAGE_NAMES.SEARCH})`, SearchPageHandler, { name: PAGE_NAMES.SEARCH }],
  ['/r/:subredditName/about', SubredditAboutPageHandler],
  ['/r/:subredditName/about/rules', SubredditRulesPageHandler],
  [`/r/:subredditName/:sort(${SORTS})`, PostsFromSubredditHandler, { name: PAGE_NAMES.LISTING }],
  ['/r/:subredditName/(w|wiki)/:path(.*)?', WikiPageHandler],
  ['/(help|w|wiki)/:path(.*)?', WikiPageHandler],
  ['/comments/:postId/:postTitle/:commentId', CommentsPageHandler, { name: PAGE_NAMES.COMMENTS }],
  ['/comments/:postId/:postTitle?', CommentsPageHandler, { name: PAGE_NAMES.COMMENTS }],
  ['/comments', CommentsPageHandler],
  ['/user/:userName/activity', UserActivityRerouteHandler],
  ['/user/:userName/about', UserProfilerHandler, { name: PAGE_NAMES.USER }],
  ['/user/:userName/gild', UserProfilerHandler],
  ['/user/:userName/:savedOrHidden(saved|hidden)', SavedAndHiddenHandler],
  ['/user/:userName/:commentsOrSubmitted(comments|submitted)', UserActivityHandler],
  ['/user/:userName', UserActivityHandler],
  ['/user/:userName/comments/:postId/:postTitle/:commentId', CommentsPageHandler, { name: PAGE_NAMES.COMMENTS }],
  ['/user/:userName/comments/:postId/:postTitle?', CommentsPageHandler, { name: PAGE_NAMES.COMMENTS }],
  ['/live/*', LiveRedirectHandler ],
  ['/login', Login],
  ['/register', Register],
  ['/message/compose', DirectMessage],
  ['/message/:mailType', Messages],
  ['/message/messages/:threadId', Messages],
  ['/notification/:mailType', Messages],
  ['/r/:subredditName/submit', PostSubmitHandler, { name: PAGE_NAMES.SUBMIT }],
  ['/submit', PostSubmitHandler],
  ['/submit/to_community', PostSubmitCommunityHandler],

  // actions
  ['/actions/community-goto', CommunityGotoActionHandler],
  ['/actions/overlay-compact-toggle', OverlayMenuCompactToggleHandler],
  ['/actions/overlay-theme-toggle', OverlayMenuThemeToggleHandler],
  ['/actions/setOver18', SetOver18Handler],
  ['/actions/toggle-subreddit-subscription', ToggleSubredditSubscriptionHandler],

  // reroutes
  ['/u/*', UserRerouteHandler],
  ['*', Status404PageHandler],
];
/* eslint-enable */
