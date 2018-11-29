import './styles.less';

import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import { Anchor } from 'platform/components';
import { METHODS } from 'platform/router';
import * as platformActions from 'platform/actions';

import cx from 'lib/classNames';

import * as overlayActions from 'app/actions/overlay';
import * as subscribedSubredditsActions from 'app/actions/subscribedSubreddits';

import { flags } from 'app/constants';

import Logo from 'app/components/Logo';
import SnooIcon from 'app/components/SnooIcon';
import XPromoTopButton from 'app/components/XPromoTopButton';

import { featuresSelector } from 'app/selectors/features';

export const TopNav = props => {
  const { assetPath, overlay, feature } = props;

  // NOTE: this isn't working (no user in props)
  let notificationsCount;
  if (props.user && props.user.inbox_count) {
    notificationsCount = (
      <span className='badge badge-xs badge-orangered badge-right'>
        { props.user.inbox_count }
      </span>
    );
  }

  const settingsOpen = overlay === overlayActions.SETTINGS_MENU;
  const communityMenuOpen = overlay === overlayActions.COMMUNITY_MENU;
  const submitPostOpen = overlay === overlayActions.POST_SUBMIT;

  const sideNavIcon = cx('icon icon-menu icon-large', { blue: settingsOpen });
  const communityMenuIcon = cx('icon icon-nav-arrowdown', { blue: communityMenuOpen });
  const postSubmitMenuIcon = cx('icon icon-large', {
    'icon-post_edit': !submitPostOpen,
    'icon-nav-close': submitPostOpen,
  });

  const {
    toggleCommunityMenu,
    togglePostSubmit,
    openSearchBar,
    toggleSettingsMenu,
  } = props;

  return (
    <nav className={ `TopNav${settingsOpen ? ' opened' : ''}` }>
      <XPromoTopButton />
      <div className='pull-left TopNav-padding TopNav-left' key='topnav-menu'>
        <Anchor
          className='MobileButton TopNav-padding TopNav-snoo'
          href='/'
        >
          <SnooIcon />
        </Anchor>
        <h1 className='TopNav-text TopNav-padding'>
          <div
            className='TopNav-text-community-menu-button TopNav-text-vcentering'
            onClick={ toggleCommunityMenu }
          >
            <div className='TopNav-text-vcentering'>
              <Logo assetPath={ assetPath ? assetPath : '' } />
            </div>
            <div className='MobileButton community-button'>
              <span className={ communityMenuIcon } />
            </div>
          </div>
        </h1>
      </div>
      <div className='TopNav-padding TopNav-right' key='topnav-actions'>
        <div
          className='MobileButton TopNav-floaty'
          onClick={ togglePostSubmit }
        >
          <span className={ postSubmitMenuIcon } />
        </div>
        <div
          className='MobileButton TopNav-floaty'
          onClick={ openSearchBar }
        >
          <span className='icon icon-search icon-large' />
        </div>
        <div
          className='MobileButton TopNav-floaty'
          onClick={ toggleSettingsMenu }
        >
          { feature.enabled(flags.MCDONALDS_CAMPAIGN) ?
            <img
              src={ `${assetPath ? assetPath : ''}/img/mcdonalds-burger@2x.png` }
              className='TopNav-Mcdonalds'
            /> :
            <span className={ sideNavIcon }>
            { notificationsCount }
            </span>
          }
        </div>
      </div>
    </nav>
  );
};

const mapStateToProps = createSelector(
  state => state.overlay,
  state => state.session.isValid,
  featuresSelector,
  (overlay, isLoggedIn, feature) => {
    return { overlay, isLoggedIn, feature };
  },
);

const mapDispatchProps = dispatch => ({
  toggleCommunityMenu: () => {
    // start fetching subscription list if we haven't already
    // it's safe to do this all the time because it's cached
    dispatch(subscribedSubredditsActions.fetchSubscribedSubreddits());
    dispatch(overlayActions.toggleCommunityMenu());
  },

  togglePostSubmit: isLoggedIn => {
    if (isLoggedIn) {
      dispatch(overlayActions.togglePostSubmit());
    } else {
      dispatch(platformActions.navigateToUrl(METHODS.GET, '/register'));
    }
  },
  openSearchBar: () => { dispatch(overlayActions.openSearchBar()); },
  toggleSettingsMenu: () => { dispatch(overlayActions.toggleSettingsMenu()); },
});

const mergeProps = (stateProps, dispatchProps) => {
  const { isLoggedIn } = stateProps;
  const { togglePostSubmit } = dispatchProps;

  return {
    ...stateProps,
    ...dispatchProps,
    togglePostSubmit: () => togglePostSubmit(isLoggedIn),
  };
};

export default connect(mapStateToProps, mapDispatchProps, mergeProps)(TopNav);
