import './styles.less';
import React from 'react';
import cx from 'lib/classNames';
import { connect } from 'react-redux';
import { getTopButtonStyle } from 'app/selectors/xpromo';
import { getBranchLink } from 'lib/xpromoState';
import { SCALED_INFERENCE, XPROMO_NAMES } from 'app/constants';
import { isOptOut } from 'app/selectors/xpromo';

const mapStateToProps = state => {
  return {
    link: getBranchLink(state, state.platform.currentPage.url, {
      tags: [XPROMO_NAMES[SCALED_INFERENCE.TOPBUTTON]],
      utm_content: XPROMO_NAMES[SCALED_INFERENCE.TOPBUTTON],
    }),

    style: getTopButtonStyle(state),

    isOptOut: isOptOut(state),
  };
};

const DisconnectedTopButton = props => {
  const { link, style, isOptOut } = props;

  if (isOptOut) { return null; }

  return (
    <a href={ link } className={ cx('TopButton', style) }>USE APP</a>
  );
};

export default connect(mapStateToProps)(DisconnectedTopButton);
