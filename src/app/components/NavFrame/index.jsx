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

const CLASSIC = 'CLASSIC';
const SNACKBAR = 'SNACKBAR';
const PILL = 'PILL';
const NONE = 'NONE';

const DEFAULT_VARIANTS = {
  [SCALED_INFERENCE.CLICK]: SCALED_INFERENCE.D,
  [SCALED_INFERENCE.LISTING]: SCALED_INFERENCE.TA,
  [SCALED_INFERENCE.POST]: SCALED_INFERENCE.BB,
};

const VARIANT_TO_COMPONENT = {
  [SCALED_INFERENCE.N]: NONE,
  [SCALED_INFERENCE.TA]: CLASSIC,
  [SCALED_INFERENCE.BB]: CLASSIC,
  [SCALED_INFERENCE.P]: PILL,
  [SCALED_INFERENCE.BLB]: SNACKBAR,
};

function renderXPromo (variant, children, isDisplay=false, mixin=false) {
  if (!isDisplay) { return null; }

  const component = VARIANT_TO_COMPONENT[variant];

  // only the original xpromo banner should render the invisible version
  if (mixin && component !== CLASSIC) {
    return null;
  }

  switch (component) {
    case NONE:
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
      variant,
    } = this.props;

    // xPromoPadding is an additional hidden DOM element that helps
    // to avoid the situation when a bottom-fixed (CSS rules) banner
    // is overlapping the content at the end of the page.
    const showXPromoPadding = (showXPromo && isXPromoFixed);
    const xPromoPadding = renderXPromo(variant, children, showXPromoPadding, 'm-invisible');
    const xPromo = renderXPromo(variant, children, showXPromo);

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
  const variant = variants ? variants[trigger] : DEFAULT_VARIANTS[trigger];
  const { showXPromo, isXPromoFixed } = xPromoSelector(state);
  return { showXPromo: showXPromo && !isNSFW, isXPromoFixed, variant };
}

export default connect(mapStateToProps)(NavFrame);
