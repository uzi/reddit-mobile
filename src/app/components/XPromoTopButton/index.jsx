import './styles.less';
import React from 'react';
import { connect } from 'react-redux';
import { getBranchLink } from 'lib/xpromoState';

const mapStateToProps = state => ({
  link: getBranchLink(state, state.platform.currentPage.url, { tags: ['TopButton', 'mweb'] }),
});

const DisconnectedTopButton = props => {
  return (
    <a href={ props.link } className="TopButton">USE APP</a>
  );
};

export default connect(mapStateToProps)(DisconnectedTopButton);
