import './styles.less';

import React from 'react';
import cx from 'lib/classNames';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { getXPromoLinkforCurrentPage } from 'lib/xpromoState';
import {
  XPROMO_ADLOADING_TYPES as ADLOADING_TYPES,
  XPROMO_AD_FEED_TYPES as ADFEED_TYPES,
} from 'app/constants';
import {
  logAppStoreNavigation,
  navigateToAppStore,
  promoClicked,
} from 'app/actions/xpromo';
import { reportOutcome } from '../../../actions/scaledInference';

class AppButton extends React.Component {
  // Because of the rendering of this component on both sides (client
  // and server) and to avoid React rendering inconsistency and warnings,
  // we need to mounted it right after the first server-side rendering.
  constructor(props) {
    super(props);
    this.state = { mounted: false };
  }
  componentDidMount() {
    this.setState({ mounted: true });
  }
  getMixin() {
    const { interstitialType } = this.props;
    switch (interstitialType) {
      case ADLOADING_TYPES.MAIN: return 'm-main';
      case ADLOADING_TYPES.COMMENTS: return 'm-comment';
      case ADFEED_TYPES.LISTING_BIG:
      case ADFEED_TYPES.LISTING_SMALL: return 'm-adfeed';
    }
  }
  render() {
    const {
      title,
      appLink,
      children,
      navigator,
    } = this.props;

    const content = (children || title || 'Continue');
    const CLASSNAME = cx('appButton', this.getMixin());
    const serverLink = (
      <a className={ CLASSNAME } href={ appLink }>
        { content }
      </a>
    );
    const clientLink = (
      <span className={ CLASSNAME } onClick={ navigator(appLink) }>
        { content }
      </span>
    );
    return (this.state.mounted ? clientLink : serverLink);
  }
}

export const selector = createStructuredSelector({
  appLink: (state, props) => {
    return getXPromoLinkforCurrentPage(state, props.interstitialType);
  },
});

const mapDispatchToProps = dispatch => {
  let preventExtraClick = false;

  return {
    navigator: (async (url, interstitial_type, visit_trigger='app_button') => {
      // Prevention of additional click events
      // while the Promise dispatch is awaiting
      if (!preventExtraClick) {
        preventExtraClick = true;
        // Track "XPromoEvent" and "AppStoreVisit" events.
        // Get a promise that returns back after the redirection is completed.
        const extraData = interstitial_type ? { interstitial_type } : undefined;
        const logAppStoreAction = logAppStoreNavigation(visit_trigger, extraData);
        const trackingPromise = dispatch(logAppStoreAction);
        const outcomePromise = dispatch(reportOutcome('accept'));

        dispatch(promoClicked()); // Hide interstitial XPromo banner

        await trackingPromise;
        await outcomePromise;

        navigateToAppStore(url);  // window.loction redirect to AppStore link.
        // We should not call `await` until the app-store navigation
        // is in progress, see actions/xpromo.navigateToAppStore for more info.

        preventExtraClick = false;
      }
    }),
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { interstitialType, visitTrigger } = ownProps;
  const { navigator: dispatchNavigator } = dispatchProps;

  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    navigator: (url) => (e) => {
      dispatchNavigator(url, interstitialType, visitTrigger);
      // On the client-side, function "onClick()" should work instead of
      // HREF attribute (which is in used after the server-side rendering).
      // So prevent the HREF attr. after the client-side will be loaded!
      e.preventDefault();
      e.stopPropagation();
      return false;
    },
  };
};

export default connect(selector, mapDispatchToProps, mergeProps)(AppButton);
