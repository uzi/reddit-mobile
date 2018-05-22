import './styles.less';
import React from 'react';
import { connect } from 'react-redux';
import { getBranchLink } from 'lib/xpromoState';
import { reportOutcome } from 'app/actions/scaledInference';

const mapStateToProps = state => ({
  link: getBranchLink(state, state.platform.currentPage.url, { tags: ['TopButton', 'mweb'] }),
});

const mapDispatchToProps = {
  reportOutcome,
};

const DisconnectedTopButton = props => {
  const onClick = () => props.reportOutcome('accept', true);
  return (
    <a href={ props.link } onClick={ onClick } className="TopButton">USE APP</a>
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(DisconnectedTopButton);
