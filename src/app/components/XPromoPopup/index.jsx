import './styles.less';
import React from 'react';
import cx from 'lib/classNames';
import { connect } from 'react-redux';
import config from 'config';
import SnooIcon from 'app/components/SnooIcon';
import { getXPromoLinkforCurrentPage } from 'lib/xpromoState';
import {
  listingClickModalDismissClicked,
} from 'app/actions/xpromo';
import { XPROMO_NAMES, XPROMO } from 'app/constants';


const { assetPath } = config;

const dispatcher = dispatch => ({
  onDismiss: () => dispatch(listingClickModalDismissClicked()),
});

function mapStateToProps (state) {
  const { active } = state.xpromo.listingClick;
  const link = getXPromoLinkforCurrentPage(state, XPROMO_NAMES[XPROMO.NATIVE]);
  return { active, link };
}

class XPromoPopup extends React.Component {
  render() {
    const { link, active, onDismiss } = this.props;
    const className = cx('XPromoPopup', { active });

    const ua = (window.navigator && window.navigator.userAgent.toLowerCase()) || '';
    const isChrome = ua.indexOf('chrome') !== -1;
    const isSafari = !isChrome && ua.indexOf('safari') !== -1;

    let continueIconURL;
    let continueIconClassName;
    let continueLabel;

    if (isSafari) {
      continueIconURL = `${assetPath}/img/safari.png`;
      continueLabel = 'Safari';
      continueIconClassName = 'XPromoPopup__safari';
    } else if (isChrome) {
      continueIconURL = `${assetPath}/img/chrome.png`;
      continueLabel = 'Chrome';
      continueIconClassName = 'XPromoPopup__chrome';
    } else {
      continueIconURL = `${assetPath}/img/chrome.png`;
      continueLabel = 'Browser';
      continueIconClassName = 'XPromoPopup__chrome';
    }

    return (
      <div className={ className }>
        <div className="XPromoPopup__overlay"></div>
        <div className="XPromoPopup__content">
          <div className="XPromoPopup__header">
            See this post
          </div>
          <div className="XPromoPopup__actions">
            <div className="XPromoPopup__action">
              <SnooIcon />
              <span className="XPromoPopup__actionTitle">Reddit App</span>
              <a href={ link } className="XPromoPopup__actionButton">OPEN</a>
            </div>
            <div className="XPromoPopup__action">
              <img src={ `${continueIconURL}` } className={ continueIconClassName } />
              <span className="XPromoPopup__actionTitle">{ continueLabel }</span>
              <span onClick={ onDismiss } className="XPromoPopup__actionButton">CONTINUE</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps, dispatcher)(XPromoPopup);
