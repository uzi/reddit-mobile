/**
 * @module components/CommentTree
 */
import './index.less';
import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { Anchor } from 'platform/components';

import includes from 'lodash/includes';

import BannerAd from 'app/components/BannerAd';
import Comment from 'app/components/Comment';
import GoogleCarouselMetadata from 'app/components/GoogleCarouselMetadata';
import { AD_MID_COMMENT_SCREENS, flags } from 'app/constants';
import cx from 'lib/classNames';
import createCommentList from 'lib/createCommentList';
import * as commentActions from 'app/actions/comment';
import features from 'app/featureFlags';

import commentDispatchers, { returnDispatchers } from 'app/components/Comment/dispatchers';

import LoadingXpromo from 'app/components/LoadingXpromo';

import { COMMENT_LOAD_MORE } from 'apiClient/models/thingTypes';

import PostModel from 'apiClient/models/PostModel';

const T = React.PropTypes;

const NESTING_STOP_LEVEL = 6;
const PADDING = 16;

/**
 * Component for an entire comment tree. The "tree" is actually drawn entirely
 * flat, with padding being used to simulate the threading. The tree is drawn
 * flat largely for performance reasons. Requires a connection to a redux store.
 * @function
 * @param   {object} props
 * @param   {boolean} [props.post] - The post model that the tree is associated
 *                    with. Passed to the google carousel.
 * @param   {function} [props.isCrawlerRequest=false] - If the request was made
 *                    by a crawler.
 * @param   {function} [props.pageUrl] - The url of the current page.
 * @param   {function} [props.pageId] - The id of the current page (derived from url params).
 * @returns {React.Element}
 */
export class CommentTree extends React.Component {
  state = {
    bannerCommentName: null,
  }

  refByCommentName = {}

  componentDidMount() {
    if (!this.props.features.enabled(flags.MID_COMMENT_BANNER)) {
      return;
    }

    const minimumDistanceFromTop = window.innerHeight * AD_MID_COMMENT_SCREENS;
    // TODO: Only check top level nodes
    for (let idx = 0; idx < this.props.comments.length; idx++) {
      // Ads can only be inserted between top level comments
      const comment = this.props.comments[idx];
      if (comment.depth === 0) {
        const nodeRef = this.refByCommentName[comment.data.name];
        const distanceFromTop = nodeRef.getBoundingClientRect().top + window.scrollY;
        if (distanceFromTop > minimumDistanceFromTop && idx > 0) {
          this.setState({
            bannerCommentName: comment.data.name,
          });
          break;
        }
      }
    }
  }

  render() {
    const {
      comments,
      post,
      pageUrl,
      isCrawlerRequest,
      commentsPending,
    } = this.props;

    if (commentsPending) {
      return <LoadingXpromo type='comments'/>;
    }

    return (
      <div className='CommentTree'>
      { isCrawlerRequest && comments.length ?
      <GoogleCarouselMetadata
        post={ post }
        comments={ comments.filter(c => c.depth === 0).map(c => c.data) }
        pageUrl={ pageUrl }
      />
      : null
      }
        <div className='CommentTree__tree'>
          { comments.map(({ depth, data, isHidden }) => {
            return renderNode(
              this.props,
              depth,
              data,
              isHidden,
              ref => { this.refByCommentName[data.name] = ref; },
              this.state.bannerCommentName === data.name &&
                this.props.features.enabled(flags.MID_COMMENT_BANNER),
            );
          }) }
        </div>
        { !post.promoted && this.props.features.enabled(flags.BOTTOM_COMMENT_BANNER) &&
          post.whitelistStatus === 'all_ads' && post.wls === 6 && !post.over18 &&
          <BannerAd
            id='btf-comments-banner'
            shouldCollapse
            listingName='comments'
            a9
            whitelistStatus={ post.whitelistStatus }
            wls={ post.wls }
            placement='BTF'
            withBottomSpacing
          />
        }
      </div>
    );
  }
}

CommentTree.propTypes = {
  post: T.instanceOf(PostModel).isRequired,
  isCrawlerRequest: T.bool,
  pageUrl: T.string,
  pageId: T.string,
};

CommentTree.defaultProps = {
  isCrawlerRequest: false,
};

const renderNode = (props, depth, data, isHidden, innerRef, withAd) => {
  const {
    onLoadMore,
    replyingList,
    thingsBeingEdited,
    user,
    post,
    isSubredditModerator,
    commentDispatchers,
    reports,
  } = props;
  const postPermalink = post.cleanPermalink;
  const uuid = data.name;
  const authorType = determineAuthorType(data, user, post.author || '');
  const editObject = thingsBeingEdited[uuid];
  const isReplying = !!replyingList[uuid];

  const maxedNestingLevel = Math.min(depth, NESTING_STOP_LEVEL);
  const depthOverMax = depth - NESTING_STOP_LEVEL;
  const dotsNum = depthOverMax > 0 ? depthOverMax : 0;

  return (
    <div
      className={ cx('CommentTree__comment', {
        'm-toplevel': depth === 0,
        'm-hidden': isHidden,
      }) }
      style={ { paddingLeft: maxedNestingLevel * PADDING } }
      ref={ innerRef }
    >
      { withAd && !post.promoted &&
        post.whitelistStatus === 'all_ads' && post.wls === 6 &&
        !post.over18 &&
          <BannerAd
            id='mid-comments-banner'
            shouldCollapse
            listingName='comments'
            a9
            whitelistStatus={ post.whitelistStatus }
            wls={ post.wls }
            sizes={ [300, 250] }
          />
      }
      { renderLines(maxedNestingLevel) /* render out the depth lines on the left of the comment */ }
      { data.type === 'comment'
        ?
          <Comment
            isSubredditModerator={ isSubredditModerator }
            commentReplying={ isReplying }
            authorType={ authorType }
            comment={ data }
            commentCollapsed={ data.isCollapsed }
            editing={ !!editObject }
            editPending={ !!(editObject && editObject.pending) }
            isTopLevel={ depth === 0 }
            user={ user }
            votingDisabled={ post.archived }
            dotsNum={ dotsNum }
            reports={ reports }

            { ...returnDispatchers(commentDispatchers, uuid) }
          />
        : renderContinueThread(
            e => onLoadMore(data, e),
            data,
            depth === 0,
            dotsNum,
            postPermalink,
          )
      }
    </div>
  );
};

const renderLines = depth => {
  const lines = [];
  for (let i = 0; i < depth; i++) {
    lines.push(
      <div
        className={ cx('CommentTree__commentDepthLine', { 'm-thick': i === 0 }) }
        style={ { left: PADDING * (i + 1) - 1 } }
      />
    );
  }
  return lines;
};

import fill from 'lodash/fill';
function renderDots(count) {
  const content = fill(Array(count), '•').join(' ');

  return <div className='CommentHeader__dots'>{ content }</div>;
}

const renderContinueThread = (onLoadMore, data, isTopLevel, dotsNum, postPermalink) => {
  const isPending = data.isPending;
  const isLoadMore = data.type === COMMENT_LOAD_MORE;
  const label = isLoadMore ?
    'More Comments' : 'Continue Thread';

  const id = stripTypePrefix(data.parentId);
  const url = `${postPermalink}${id}`;

  return (
    <Anchor
      className='CommentTree__continueThread'
      onClick={ e => {
        // If this is a real continue thread link, let the normal page navigation
        // from Anchor handle this
        if (isLoadMore) {
          onLoadMore(e);
        }
      } }
      href={ url }
    >
      { renderDots(dotsNum) }
      <span className={ `icon icon-caron-circled ${isTopLevel ? 'mint': ''}` } />
      { isPending ? 'LOADING...' : label }
      { isLoadMore ? ` (${data.children.length})`: '' }
      { !isPending
        ? <div className='CommentTree__continueThreadIcon icon icon-arrowforward'/>
        : null }
    </Anchor>
  );
};

function determineAuthorType(comment, user, op) {
  if (comment.distinguished) {
    return comment.distinguished;
  } else if (user && user.name === comment.author) {
    return 'self';
  } else if (comment.author === op) {
    return 'op';
  }

  return '';
}

const selector = createSelector(
  (_, props) => props.post.subreddit,
  state => state.user,
  (state, { pageId }) => state.commentsPages.data[pageId] || [],
  (state, { pageId }) => {
    const apiData = state.commentsPages.api[pageId];
    return apiData ? apiData.pending : true;
  },
  state => state.platform.currentPage.url,
  state => state.comments.data,
  state => state.comments.loadMore,
  state => state.comments.continueThread,
  state => state.comments.collapsed,
  state => state.comments.loadMorePending,
  state => state.editingText,
  state => state.replying,
  state => state.moderatingSubreddits.names,
  state => state.reports,
  state => features.withContext({ state }),
  (
    subreddit,
    user,
    commentsList,
    commentsPending,
    currentUrl,
    allComments,
    allLoadMoreComments,
    allContinueThreads,
    collapsedComments,
    pendingLoadMore,
    thingsBeingEdited,
    replyingList,
    moderatingSubreddits,
    reports,
    features,
  ) => ({
    user,
    thingsBeingEdited,
    currentUrl,
    replyingList,
    isSubredditModerator: includes(moderatingSubreddits, subreddit.toLowerCase()),
    comments: commentsList.length > 0 ? createCommentList({
      commentsList,
      allComments,
      allLoadMoreComments,
      allContinueThreads,
      collapsedComments,
      pendingLoadMore,
    }) : [],
    reports,
    commentsPending,
    features,
  })
);

function stripTypePrefix(id) {
  return id.split('_')[1];
}

const dispatcher = (dispatch, { pageId, post }) => ({
  // Dispatchers for the commentTree component
  onLoadMore: (data, e) => {
    e.preventDefault();
    dispatch(commentActions.loadMore(data.uuid, pageId, post.uuid));
  },
  // Dispatchers passed to the comment.
  commentDispatchers: commentDispatchers(dispatch),
});

const mergeProps = (stateProps, dispatchProps, ownProps) => ({
  ...stateProps,
  ...dispatchProps,
  ...ownProps,
});

export default connect(selector, dispatcher, mergeProps)(CommentTree);
