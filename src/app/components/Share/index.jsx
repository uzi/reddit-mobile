import './styles.less';
import React from 'react';
import { connect } from 'react-redux';
import { prepareShare } from 'app/actions/sharing';
import config from 'config';

const SHARE_ICON_1 = `${config.assetPath}/img/icon_share_32.png`;
const SHARE_ICON_2 = `${config.assetPath}/img/icon_share_ios_32.png`;

export const getSharingData = (state) => {
  const hasWebShare = state.sharing.hasWebShare;
  const icon = hasWebShare ? SHARE_ICON_1 : SHARE_ICON_2;
  const iconType = hasWebShare ? 'v1' : 'v2';

  return { hasWebShare, icon, iconType };
};


class DisconnectedShare extends React.Component {
  handleShare(e) {
    this.props.prepareShare(this.props.payload);
    e.stopPropagation();
  }

  render() {
    const { icon, iconType } = this.props.sharingData;

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
  const { hasWebShare } = sharingData;
  const payload = { post: ownProps.post, url: ownProps.post.cleanPermalink, tags: [] };

  payload.tags = hasWebShare ? ['WebShare'] : ['ClipboardShare'];

  return { sharingData, payload };
};

const Share = connect(mapStateToProps, mapDispatchToProps)(DisconnectedShare);

export default Share;
