import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import * as navigationActions from 'platform/actions';
import { METHODS } from 'platform/router';
import isFakeSubreddit from 'lib/isFakeSubreddit';
import { listingTime } from 'lib/listingTime';

import SortSelector from 'app/components/SortSelector';
import { PAGE_NAMES } from 'app/constants';
import { isHomePage } from 'app/selectors/platformSelector';
import { SORTS } from 'app/sortValues';

const T = React.PropTypes;

const SortAndTimeSelector = props => {
  const {
    className,
    sort,
    sortOptions,
    onSortChange,
    time,
    timeOptions,
    onTimeChange,
  } = props;

  return (
    <div className={ `SortAndTimeSelector ${className}` }>
      <SortSelector
        id='posts-sort-selector'
        title='Sort posts by:'
        sortValue={ sort }
        sortOptions={ sortOptions }
        onSortChange={ onSortChange }
      />
      { time &&
        <SortSelector
          id='posts-time-selector'
          sortValue={ time }
          sortOptions={ timeOptions }
          onSortChange={ onTimeChange }
        />
      }
    </div>
  );
};

SortAndTimeSelector.propTypes = {
  className: T.string,
  onSortChange: T.func.isRequired,
  onTimeChange: T.func.isRequired,
  sort: SortSelector.sortType.isRequired,
  sortOptions: SortSelector.sortOptionsType.isRequired,
  time: SortSelector.sortType, // isn't required because the current page might
  // not have a time filter active. We use the presence of this property
  // to indicate a time selector should be shown.
  timeOptions: SortSelector.sortOptionsType.isRequired,
};

SortAndTimeSelector.defaultProps = {
  className: '',

  sortOptions: [
    SORTS.HOT,
    SORTS.TOP,
    SORTS.NEW,
    SORTS.CONTROVERSIAL,
  ],

  timeOptions: [
    SORTS.ALL_TIME,
    SORTS.PAST_YEAR,
    SORTS.PAST_MONTH,
    SORTS.PAST_WEEK,
    SORTS.PAST_DAY,
    SORTS.PAST_HOUR,
  ],
};

const mapStateToProps = createSelector(
  state => state.platform.currentPage,
  state => state.user,
  (currentPage, user) => ({ currentPage, user }),
);

const mapDispatchToProps = dispatch => ({
  navigateToUrl(url, query) {
    dispatch(navigationActions.navigateToUrl(METHODS.GET, url, query));
  },
});

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const {
    currentPage: { url, urlParams, queryParams },
    user,
  } = stateProps;

  const isLoggedIn = user && !user.loggedOut;
  // HOT is the default sort for subreddit pages;
  // BEST is the default sort for logged in users on the home page;
  const useBestSort = isHomePage(urlParams.subredditName, urlParams.pageName) && isLoggedIn;
  const sort = urlParams.sort || queryParams.sort || (
    useBestSort
      ? SORTS.BEST
      : SORTS.HOT
    );
  const time = ownProps.time || listingTime(queryParams, sort);
  const { navigateToUrl } = dispatchProps;
  const { userName, commentsOrSubmitted } = urlParams;

  let onSortChange;

  if (userName) {
    onSortChange = sort => {
      const path = commentsOrSubmitted || '';
      navigateToUrl(`/user/${userName}/${path}`, {
        queryParams: { ...queryParams, sort },
      });
    };
  } else {
    onSortChange = sort => {
      const { subredditName } = urlParams;
      if (
        (subredditName || isFakeSubreddit(subredditName))
        && urlParams.pageName !== PAGE_NAMES.SEARCH
      ) {
        const baseUrl = subredditName ? `/r/${subredditName}` : '';
        // for SR  & FakeSR listing pages, sort is in path
        navigateToUrl(`${baseUrl}/${sort}`);
      } else {
        // for all other pages (like search), sort is in the querystring
        navigateToUrl(`${url}`, {
          queryParams: { ...queryParams, sort },
        });
      }

    };
  }

  return {
    time,
    sort,
    ...ownProps,
    ...stateProps,
    onTimeChange: time => navigateToUrl(url, { queryParams: { ...queryParams, t: time } }),
    onSortChange,
  };
};

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(SortAndTimeSelector);
