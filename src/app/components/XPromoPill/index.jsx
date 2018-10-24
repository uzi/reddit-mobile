import './styles.less';

import React from 'react';
import config from 'config';
import { getBranchLink } from 'lib/xpromoState';
import { connect } from 'react-redux';
import cx from 'lib/classNames';
import {
  promoDismissed,
  hide,
} from 'app/actions/xpromo';

import { trackXPromoView } from 'lib/eventUtils';
import { XPROMO, XPROMO_NAMES } from 'app/constants';


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
    const { href } = this.props;

    const dismiss = (e) => {
      this.setState({ dismissed: true });
      e.stopPropagation();
      e.preventDefault();
      return false;
    };

    return (
      <div className={ cx('XPromoPill', { dismissed }) } href={ href }>
        <a href={ href }>OPEN REDDIT APP</a>
        <img
          className="XPromoPill__close"
          src={ `${config.assetPath}/img/close-circle-x.png` }
          onClick={ dismiss }
        />
      </div>
    );
  }
}

const PARAMS = {
  tags: [XPROMO_NAMES[XPROMO.PILL]],
  utm_content: XPROMO_NAMES[XPROMO.PILL],
};

const mapStateToProps = (state) => {
  const href = getBranchLink(state, state.platform.currentPage.url, PARAMS);
  return { href };
};

const mapDispatchToProps = {
  promoDismissed: () => async (dispatch) => {
    dispatch(hide());
    dispatch(promoDismissed());
  },
  trackXPromoView: () => async (_, getState) => {
    return trackXPromoView(getState(), { interstitial_type: XPROMO.PILL });
  },
};

export default connect(mapStateToProps, mapDispatchToProps)(XPromoPill);
