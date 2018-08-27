import './styles.less';
import React from 'react';
import { connect } from 'react-redux';
import { getBranchLink } from 'lib/xpromoState';
import { reportOutcome } from 'app/actions/scaledInference';
import { SCALED_INFERENCE } from 'app/constants';
import { navigateToAppStore } from '../../actions/xpromo';

const mapStateToProps = state => {
  return {
    link: getBranchLink(state, state.platform.currentPage.url, {
      tags: [SCALED_INFERENCE.TOPBUTTON],
      utm_content: SCALED_INFERENCE.TOPBUTTON,
    }),
  };
};

const mapDispatchToProps = {
  reportOutcome,
};

const DisconnectedTopButton = props => {
  const { link, reportOutcome } = props;
  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await reportOutcome('accept', true);
    navigateToAppStore(link);
  };
  return (
    <a href={ props.link } onClick={ onClick } className="TopButton">USE APP</a>
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(DisconnectedTopButton);
