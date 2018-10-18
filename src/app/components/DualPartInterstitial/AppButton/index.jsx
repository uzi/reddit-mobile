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
    } = this.props;

    const content = (children || title || 'Continue');
    const CLASSNAME = cx('appButton', this.getMixin());

    return (
      <a className={ CLASSNAME } href={ appLink }>
        { content }
      </a>
    );
  }
}

export const selector = createStructuredSelector({
  appLink: (state, props) => {
    return getXPromoLinkforCurrentPage(state, props.interstitialType);
  },
});

export default connect(selector)(AppButton);
