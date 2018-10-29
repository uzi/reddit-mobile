import './styles.less';
import React from 'react';
import cx from 'lib/classNames';
import { connect } from 'react-redux';
import { getTopButtonStyle } from 'app/selectors/xpromo';
import { isWikiPage } from 'app/selectors/platformSelector';
import { getBranchLink } from 'lib/xpromoState';
import { XPROMO, XPROMO_NAMES } from 'app/constants';
import { isOptOut } from 'app/selectors/xpromo';

const mapStateToProps = state => {
  return {
    link: getBranchLink(state, state.platform.currentPage.url, {
      tags: [XPROMO_NAMES[XPROMO.TOPBUTTON]],
      utm_content: XPROMO_NAMES[XPROMO.TOPBUTTON],
    }),

    style: getTopButtonStyle(state),

    isOptOut: isOptOut(state),

    isWikiPage: isWikiPage(state),
  };
};

const DisconnectedTopButton = props => {
  const { link, style, isOptOut, isWikiPage } = props;

  if (isOptOut || isWikiPage) { return null; }

  return (
    <a href={ link } className={ cx('TopButton', style) }>USE APP</a>
  );
};

export default connect(mapStateToProps)(DisconnectedTopButton);
