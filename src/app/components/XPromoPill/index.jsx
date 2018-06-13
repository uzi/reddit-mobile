import './styles.less';

import React from 'react';
import config from 'config';
import { getBranchLink } from 'lib/xpromoState';
import { connect } from 'react-redux';
import cx from 'lib/classNames';

class XPromoPill extends React.Component {
  constructor() {
    super();
    this.state = {
      dismissed: false,
    };
  }

  render() {
    const { dismissed } = this.state;
    const { href } = this.props;

    const onClick = (e) => {
      this.setState({ dismissed: true });
      e.stopPropagation();
      e.preventDefault();
      return false;
    };

    return (
      <a className={ cx('XPromoPill', { dismissed }) } href={ href }>
        <span>OPEN REDDIT APP</span>
        <img
          className="XPromoPill__close"
          src={ `${config.assetPath}/img/close-circle-x.png` }
          onClick={ onClick }
        />
      </a>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const href = getBranchLink(state, ownProps.url, {
    channel: 'xpromo',
    campaign: 'nsfw_xpromo',
    feature: 'mweb',
    utm_source: 'xpromo',
    utm_medium: 'mweb',
    utm_name: 'nsfw_xpromo',
  });
  return { href };
};

export default connect(mapStateToProps)(XPromoPill);
