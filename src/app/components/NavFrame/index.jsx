import './styles.less';
import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import DualPartInterstitial from 'app/components/DualPartInterstitial';
import EUCookieNotice from 'app/components/EUCookieNotice';
import TopNav from 'app/components/TopNav';
import {
  XPromoIsActive,
  isXPromoFixedBottom,
} from 'app/selectors/xpromo';

import SnackBar from 'app/components/SnackBar';
import XPromoPill from 'app/components/XPromoPill';
import { pageTypeSelector } from 'app/selectors/platformSelector';
import { SCALED_INFERENCE } from '../../constants';
import { isCurrentContentNSFW } from '../../selectors/platformSelector';
import { getXPromoVariants } from '../../selectors/xpromo';

const { CLASSIC, SNACKBAR, PILL } = SCALED_INFERENCE;

function renderXPromo (componentName, children, isDisplay=false, mixin=false) {
  if (!isDisplay) { return null; }

  // only the original xpromo banner should render the invisible version
  if (mixin && componentName !== CLASSIC) {
    return null;
  }

  switch (componentName) {
    case null:
      return null;
    case CLASSIC:
      return <DualPartInterstitial mixin={ mixin }>{ children }</DualPartInterstitial>;
    case PILL:
      return <XPromoPill active={ true } scaledInference={ true }/>;
    case SNACKBAR:
      return <SnackBar/>;
  }
}

class NavFrame extends React.Component {
  render() {
    const {
      children,
      showXPromo,
      isXPromoFixed,
      xpromoComponentName,
    } = this.props;

    // xPromoPadding is an additional hidden DOM element that helps
    // to avoid the situation when a bottom-fixed (CSS rules) banner
    // is overlapping the content at the end of the page.
    const showXPromoPadding = (showXPromo && isXPromoFixed);
    const xPromoPadding = renderXPromo(xpromoComponentName, children, showXPromoPadding, 'm-invisible');
    const xPromo = renderXPromo(xpromoComponentName, children, showXPromo);

    const otherContent = (
      <div>
        <TopNav />
        <div className='NavFrame__below-top-nav'>
          <EUCookieNotice />
          { children }
        </div>
        { xPromoPadding }
      </div>
    );

    return (
      <div className='NavFrame'>
        { xPromo }
        { otherContent }
      </div>
    );
  }
}

const xPromoSelector = createSelector(
  XPromoIsActive,
  isXPromoFixedBottom,
  (showXPromo, isXPromoFixed) => {
    return { showXPromo, isXPromoFixed};
  },
);

function mapStateToProps(state) {
  const isNSFW = isCurrentContentNSFW(state);
  const trigger = pageTypeSelector(state);
  const variants = getXPromoVariants(state);
  const xpromoComponentName = variants[trigger];
  const { showXPromo, isXPromoFixed } = xPromoSelector(state);

  return { showXPromo: showXPromo && !isNSFW, isXPromoFixed, xpromoComponentName };
}

export default connect(mapStateToProps)(NavFrame);
