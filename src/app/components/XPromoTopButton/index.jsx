import './styles.less';
import React from 'react';
import cx from 'lib/classNames';
import { connect } from 'react-redux';
import { getTopButtonStyle } from 'app/selectors/xpromo';
import { getBranchLink } from 'lib/xpromoState';
import { reportOutcome } from 'app/actions/scaledInference';
import { SCALED_INFERENCE, XPROMO_NAMES } from 'app/constants';
import { navigateToAppStore } from 'app/actions/xpromo';
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

const mapDispatchToProps = {
  reportOutcome,
};

const DisconnectedTopButton = props => {
  const { link, reportOutcome, style, isOptOut } = props;

  if (isOptOut) { return null; }

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await reportOutcome('accept', true);
    navigateToAppStore(link);
  };
  return (
    <a href={ props.link } onClick={ onClick } className={ cx('TopButton', style) }>USE APP</a>
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(DisconnectedTopButton);
