import './styles.less';

import React from 'react';
import config from 'config';
import { getBranchLink } from 'lib/xpromoState';
import { connect } from 'react-redux';
import cx from 'lib/classNames';
import { promoClicked, promoDismissed } from 'app/actions/xpromo';
import { getExperimentVariant } from 'lib/experiments';
import { trackXPromoView } from 'lib/eventUtils';
import { SCALED_INFERENCE, SCALED_INFERENCE_BRANCH_PARAMS } from 'app/constants';

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
    const { href, promoClicked, promoDismissed } = this.props;

    const onDismiss = (e) => {
      this.setState({ dismissed: true });
      promoDismissed(SCALED_INFERENCE.PILL);
      e.stopPropagation();
      e.preventDefault();
      return false;
    };

    const onAccept = () => {
      promoClicked(SCALED_INFERENCE.PILL);
      window.location = href;
    };

    return (
      <a className={ cx('XPromoPill', { dismissed }) } href={ href }>
        <span onClick={ onAccept }>OPEN REDDIT APP</span>
        <img
          className="XPromoPill__close"
          src={ `${config.assetPath}/img/close-circle-x.png` }
          onClick={ onDismiss }
        />
      </a>
    );
  }
}

const SCALED_INFERENCE_PARAMS = {
  ...SCALED_INFERENCE_BRANCH_PARAMS,
  tags: [SCALED_INFERENCE.PILL],
  utm_content: SCALED_INFERENCE.PILL,
};

const PORN_PARAMS = {
  ...SCALED_INFERENCE_BRANCH_PARAMS,
  campaign: 'nsfw_xpromo',
  utm_source: 'nsfw_xpromo',
  tags: [SCALED_INFERENCE.PILL],
  utm_content: SCALED_INFERENCE.PILL,
};

const mapStateToProps = (state, ownProps) => {
  const params = ownProps.scaledInference ? SCALED_INFERENCE_PARAMS : PORN_PARAMS;

  const variant = getExperimentVariant(state, SCALED_INFERENCE.EXPERIMENT);
  params.keyword = variant;
  params.utm_term = variant;

  const href = getBranchLink(state, state.platform.currentPage.url, params, SCALED_INFERENCE.PILL);
  return { href };
};

const mapDispatchToProps = {
  promoClicked,
  promoDismissed,
  trackXPromoView: () => async (_, getState) => {
    return trackXPromoView(getState(), { interstitial_type: SCALED_INFERENCE.PILL });
  },
};

export default connect(mapStateToProps, mapDispatchToProps)(XPromoPill);
