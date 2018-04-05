import './styles.less';
import React from 'react';
import { connect } from 'react-redux';
import { prepareShare } from 'app/actions/sharing';
import { flags } from 'app/constants';
import { getExperimentVariant } from 'lib/experiments';
import { EXPERIMENT_NAMES } from 'app/selectors/xpromo';
import config from 'config';

const SHARE_ICON_1 = `${config.assetPath}/img/icon_share_32.png`;
const SHARE_ICON_2 = `${config.assetPath}/img/icon_share_ios_32.png`;

export const getSharingData = (state) => {
  const experiment = (window && window.navigator && window.navigator.share) ?
    flags.VARIANT_MOBILE_SHARING_WEB_API :
    flags.VARIANT_MOBILE_SHARING_CLIPBOARD;

  const name = EXPERIMENT_NAMES[experiment];

  const variant = getExperimentVariant(state, name);
  let icon = SHARE_ICON_1;
  let iconType = 'v1';

  if (variant === 'treatment_2') {
    icon = SHARE_ICON_2;
    iconType = 'v2';
  }

  return { experiment, variant, icon, iconType };
};


class DisconnectedShare extends React.Component {
  handleShare(e) {
    this.props.prepareShare(this.props.payload);
    e.stopPropagation();
  }

  render() {
    const { icon, iconType, variant } = this.props.sharingData;
    if (!variant) { return null; }

    return (
      <span className="Share" onClick={ (e) => { this.handleShare(e); } }>
        <img className={ `Share__image ${iconType}` } src={ icon } />
        Share
      </span>
    );
  }
}

const mapDispatchToProps = {
  prepareShare,
};

const mapStateToProps = (state, ownProps) => {
  const sharingData = getSharingData(state);
  const { experiment, variant } = sharingData;
  const payload = { url: ownProps.url, tags: [] };

  if (variant) { payload.tags = [experiment, `${experiment}_${variant}`]; }

  return { sharingData, payload };
};

const Share = connect(mapStateToProps, mapDispatchToProps)(DisconnectedShare);

export default Share;
