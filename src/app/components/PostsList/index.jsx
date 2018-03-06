import './styles.less';
import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import Ad from 'app/components/Ad';
import PaginationButtons from 'app/components/PaginationButtons';
import Post from 'app/components/Post';
import LoadingXpromo from 'app/components/LoadingXpromo';
import { addXPromoToPostsList } from 'app/components/XPromoAdFeed';
import { isXPromoInFeedEnabled } from 'app/selectors/xpromo';

const T = React.PropTypes;

export const PostsList = props => {
  const { loading, postRecords, nextUrl, prevUrl, shouldPage } = props;
  const shouldRenderPagination = !loading && shouldPage && postRecords.length;

  // On the Server side, the const "loading" is false until the client-side
  // is loaded, so we need to check the contents of the postRecords to find
  // out whether to show the Loader while rendering on the server-side
  if (loading || (!postRecords.length)) {
    return <LoadingXpromo />;
  }

  return (
    <div className='PostsList PostAndCommentList'>
      { renderPostsList(props) }
      { shouldRenderPagination ? renderPagination(postRecords, nextUrl, prevUrl) : null }
    </div>
  );
};

PostsList.propTypes = {
  loading: T.bool.isRequired,
  postRecords: T.array.isRequired,
  nextUrl: T.string,
  prevUrl: T.string,
  shouldPage: T.bool,
  forceCompact: T.bool,
  subredditIsNSFW: T.bool,
  subredditSpoilersEnabled: T.bool,
  onPostClick: T.func,
};

PostsList.defaultProps = {
  nextUrl: '',
  posts: [],
  prevUrl: '',
  forceCompact: false,
  subredditIsNSFW: false,
  subredditSpoilersEnabled: false,
  shouldPage: true,
};

const renderPostsList = props => {
  const {
    postRecords,
    forceCompact,
    subredditIsNSFW,
    subredditShowSpoilers,
    onPostClick,
    isXPromoEnabled,
    posts,
  } = props;
  const postProps = {
    forceCompact,
    subredditIsNSFW,
    subredditShowSpoilers,
    onPostClick,
  };
  
  const postsList = postRecords.map((postRecord, i) => {
    const postId = postRecord.uuid;
    const post = posts[postId];
    if (post.promoted) {
      return <Ad
        postId={ postId }
        placementIndex={ i }
        postProps={ {
          ...postProps,
          key: 'native-ad',
        } }
        key={ `post-id-${postId}` } />;
    }
    return <Post { ...postProps } postId={ postId } key={ `post-id-${postId}` }/>;
  });
  
  if (isXPromoEnabled) {
    addXPromoToPostsList(postsList, 5);
  }

  return postsList;
};

const renderPagination = (postRecords, nextUrl, prevUrl) => (
  <PaginationButtons
    preventUrlCreation={ !!(nextUrl || prevUrl) }
    nextUrl={ nextUrl }
    prevUrl={ prevUrl }
    records={ postRecords }
  />
);

const selector = createSelector(
  (state, props) => state.postsLists[props.postsListId],
  state => state.posts,
  (_, props) => props.nextUrl,
  (_, props) => props.prevUrl,
  isXPromoInFeedEnabled,
  (postsList, posts, nextUrl, prevUrl, isXPromoEnabled) => ({
    loading: !!postsList && postsList.loading,
    postRecords: postsList ? postsList.results.filter(p => !posts[p.uuid].hidden) : [],
    prevUrl,
    nextUrl,
    isXPromoEnabled,
    posts,
  }),
);

export default connect(selector)(PostsList);
