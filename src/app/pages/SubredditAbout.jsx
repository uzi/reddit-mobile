import React from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { BackAnchor } from 'platform/components';

import CommunityHeader from 'app/components/CommunityHeader';
import QuarantineBanner from 'app/components/QuarantineBanner';
import SubredditAbout from 'app/components/SubredditAbout';

import isFakeSubreddit from 'lib/isFakeSubreddit';

const selector = createStructuredSelector({
  subreddit: (state, props) => {
    const { subredditName } = props.urlParams;
    if (!subredditName) {
      return;
    }
    return state.subreddits[subredditName.toLowerCase()];
  },
  subredditName: (state, props) => props.urlParams.subredditName,
});

const backToSubredditLink = subredditName => (
  <div className='SubredditAboutPage__invalid-subreddit'>
    Sorry, there's no about page for
    <BackAnchor
      className='SubredditAboutPage__invalid-link'
      href={ `/r/${subredditName}` }
    >
      { `r/${subredditName}` }
    </BackAnchor>
  </div>
);

export const SubredditAboutPage = connect(selector)(props => {
  const {
    subreddit,
    subredditName,
  } = props;

  if (isFakeSubreddit(subredditName)) {
    return backToSubredditLink(subredditName);
  }

  return (
    <div className='SubredditAboutPage'>
      <CommunityHeader subredditName={ subredditName } />
      { subreddit && subreddit.quarantine
        ? <QuarantineBanner
            expanded
            quarantineMessageHTML={ subreddit.quarantineMessageHTML }
            subredditName={ subredditName }
          />
        : null
      }
      <SubredditAbout subredditName={ subredditName } />
    </div>
  );
});
