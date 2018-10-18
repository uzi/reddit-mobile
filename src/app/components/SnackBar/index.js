import './styles.less';
import React from 'react';
import { connect } from 'react-redux';
import cx from 'lib/classNames';
import SnooIcon from 'app/components/SnooIcon';
import { getBranchLink } from 'lib/xpromoState';
import {
  hide,
  promoDismissed,
} from 'app/actions/xpromo';
import { trackXPromoView } from 'lib/eventUtils';
import { XPROMO_NAMES, SCALED_INFERENCE } from 'app/constants';
import { setMetadata, reportOutcome } from 'app/actions/scaledInference';

const HEADER_COPY = 'Open in the official Reddit app';
const BODY_COPY = 'Fastest way to browse and packed with exclusive features like Chat and News.';
const NO_COPY = 'NO';
const YES_COPY = 'CONTINUE';

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
    const {
      href,
      listingClickModalIsActive,
    } = this.props;

    const dismiss = () => {
      this.props.promoDismissed('snackbar');
      this.setState({
        dismissed: true,
      });
    };

    const dismissed = this.state.dismissed || listingClickModalIsActive;

    // inverted snack bar styles for contrast
    const nightmode = !this.props.nightmode;

    return (
      <div className={ cx('SnackBar', 'amp', { dismissed }, { nightmode }) }>
        <div className={ 'SnackBar__header' }>
          <SnooIcon />
          <span className="SnackBar__text">{ HEADER_COPY }</span>
        </div>
        <div className={ 'SnackBar__body' }>
          { BODY_COPY }
        </div>
        <div className="SnackBar__buttons">
          <div
            className="SnackBar__no SnackBar__button"
            onClick={ dismiss }>
            { NO_COPY }
          </div>
          <a
            className="SnackBar__yes SnackBar__button"
            href={ href }
          >
            { YES_COPY }
          </a>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const href = getBranchLink(state, state.platform.currentPage.url, {
    tags: [XPROMO_NAMES[SCALED_INFERENCE.SNACKBAR]],
    utm_content: XPROMO_NAMES[SCALED_INFERENCE.SNACKBAR],
  }, XPROMO_NAMES[SCALED_INFERENCE.SNACKBAR]);

  const listingClickModalIsActive = state.xpromo.listingClick.active;

  return {
    href,
    nightmode: state.theme === 'nightmode',
    listingClickModalIsActive,
  };
};

const mapDispatchToProps = {
  promoDismissed: () => async (dispatch) => {
    dispatch(hide());
    dispatch(promoDismissed());
  },
  setMetadata,
  reportOutcome,
  trackXPromoView: () => async (_, getState) => {
    return trackXPromoView(getState(), { interstitial_type: SCALED_INFERENCE.SNACKBAR });
  },
};

export default connect(mapStateToProps, mapDispatchToProps)(SnackBar);
