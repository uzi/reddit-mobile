import './styles.less';
import React from 'react';
import { connect } from 'react-redux';
import cx from 'lib/classNames';
import SnooIcon from 'app/components/SnooIcon';
import { getBranchLink } from 'lib/xpromoState';
import {
  hide,
  logAppStoreNavigation,
  navigateToAppStore,
  promoClicked,
  promoDismissed,
} from 'app/actions/xpromo';
import { trackXPromoView } from 'lib/eventUtils';
import { SCALED_INFERENCE } from 'app/constants';
import { setMetadata, reportOutcome } from 'app/actions/scaledInference';

class SnackBar extends React.Component {
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
    const { href, reportOutcome, logAppStoreNavigation } = this.props;

    const dismiss = () => {
      this.props.promoDismissed('snackbar');
      this.setState({
        dismissed: true,
      });
    };

    const accept = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      setMetadata({ bannerDismissed: true });
      this.props.promoClicked('snackbar');
      const extraData = { interstitial_type: 'snackbar' };
      const outcomePromise = reportOutcome('accept');
      const logAppStorePromise = logAppStoreNavigation(null, extraData);
      await outcomePromise;
      await logAppStorePromise;
      navigateToAppStore(href);
    };

    const {
      dismissed,
    } = this.state;

    // inverted snack bar styles for contrast
    const nightmode = !this.props.nightmode;

    return (
      <div className={ cx('SnackBar', { dismissed }, { nightmode }) }>
        <div className={ 'SnackBar__header' }>
          <SnooIcon />
          <span className="SnackBar__text">Get the Reddit app!</span>
        </div>
        <div className="SnackBar__buttons">
          <a className="SnackBar__yes SnackBar__button" href={ this.props.href } onClick={ accept }>LET'S GO</a>
          <div className="SnackBar__no SnackBar__button" onClick={ dismiss }>NO THANKS</div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const href = getBranchLink(state, state.platform.currentPage.url, {
    tags: [SCALED_INFERENCE.SNACKBAR],
    utm_content: [SCALED_INFERENCE.SNACKBAR],
  }, SCALED_INFERENCE.SNACKBAR);
  return {
    href,
    nightmode: state.theme === 'nightmode',
  };
};

const mapDispatchToProps = {
  promoClicked,
  promoDismissed: () => async (dispatch) => {
    dispatch(hide());
    dispatch(promoDismissed());
  },
  logAppStoreNavigation,
  setMetadata,
  reportOutcome,
  trackXPromoView: () => async (_, getState) => {
    return trackXPromoView(getState(), { interstitial_type: SCALED_INFERENCE.SNACKBAR });
  },
};

export default connect(mapStateToProps, mapDispatchToProps)(SnackBar);
