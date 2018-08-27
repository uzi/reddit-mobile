import './styles.less';

import React from 'react';
import config from 'config';
import { getBranchLink } from 'lib/xpromoState';
import { connect } from 'react-redux';
import cx from 'lib/classNames';
import {
  logAppStoreNavigation,
  navigateToAppStore,
  promoClicked,
  promoDismissed,
  hide,
} from 'app/actions/xpromo';
import { getExperimentVariant } from 'lib/experiments';
import { trackXPromoView } from 'lib/eventUtils';
import { SCALED_INFERENCE, SCALED_INFERENCE_BRANCH_PARAMS } from 'app/constants';
import { setMetadata, reportOutcome } from '../../actions/scaledInference';

class XPromoPill extends React.Component {
  constructor() {
    super();
    this.state = {
      dismissed: false,
    };
  }

  componentDidMount() {
    this.props.trackXPromoView();
  }

  render() {
    const { dismissed } = this.state;
    const { href, promoClicked, promoDismissed, logAppStoreNavigation, setMetadata, reportOutcome } = this.props;

    const dismiss = (e) => {
      this.setState({ dismissed: true });
      promoDismissed(SCALED_INFERENCE.PILL);
      e.stopPropagation();
      e.preventDefault();
      return false;
    };

    const accept = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      setMetadata({ bannerDismissed: true });
      promoClicked('pill');
      const outcomePromise = reportOutcome('accept');
      const logAppStorePromise = logAppStoreNavigation('shazam', { interstitial_type: 'pill' });
      return Promise.all([outcomePromise, logAppStorePromise]).then(() => {
        navigateToAppStore(href);
      });
    };

    return (
      <div className={ cx('XPromoPill', { dismissed }) } href={ href }>
        <span onClick={ accept }>OPEN REDDIT APP</span>
        <img
          className="XPromoPill__close"
          src={ `${config.assetPath}/img/close-circle-x.png` }
          onClick={ dismiss }
        />
      </div>
    );
  }
}

const SCALED_INFERENCE_PARAMS = {
  tags: [SCALED_INFERENCE.PILL],
  utm_content: SCALED_INFERENCE.PILL,
};

const PORN_PARAMS = {
  campaign: 'nsfw_xpromo',
  utm_source: 'nsfw_xpromo',
  tags: [SCALED_INFERENCE.PILL],
  utm_content: SCALED_INFERENCE.PILL,
};

const mapStateToProps = (state, ownProps) => {
  const params = ownProps.scaledInference ? SCALED_INFERENCE_PARAMS : PORN_PARAMS;

  const variant = getExperimentVariant(state, SCALED_INFERENCE.EXPERIMENT);

  const href = getBranchLink(
    state,
    state.platform.currentPage.url, params, SCALED_INFERENCE.PILL);
  return { href };
};

const mapDispatchToProps = {
  reportOutcome,
  setMetadata,
  promoClicked,
  promoDismissed: () => async (dispatch, getState) => {
    dispatch(hide());
    dispatch(promoDismissed());
  },
  logAppStoreNavigation,
  trackXPromoView: () => async (_, getState) => {
    return trackXPromoView(getState(), { interstitial_type: SCALED_INFERENCE.PILL });
  },
};

export default connect(mapStateToProps, mapDispatchToProps)(XPromoPill);
