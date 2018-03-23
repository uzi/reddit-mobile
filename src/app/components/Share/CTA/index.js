import './styles.less';
import React from 'react';
import { connect } from 'react-redux';
import { executeShare, hideCTA } from 'app/actions/sharing';
import { getSharingData } from '..';
import cx from 'lib/classNames';

const hasWebShare = !!(window && window.navigator && window.navigator.share);

class CTA extends React.Component {
  render() {
    const { link, visible, hideCTA, icon, iconType } = this.props;
    const pending = !link;
    const copy = hasWebShare ? 'SHARE LINK' : 'COPY LINK';

    return (
      <div className={ cx('ShareCTA', { visible, pending }) }>
        <div className='ShareCTA__content'>
          <span className='ShareCTA__close icon icon-x' onClick={ hideCTA }></span>
          <div className='ShareCTA__header'>
            <img className={ `ShareCTA__image ${iconType}` } src={ icon } />
            Share this Link
          </div>
          <div className='ShareCTA__target'>
            { pending ? 'Preparing your link' : link }
          </div>
          <div
            className='ShareCTA__button'
            onClick={ () => { this.handleShare(); } }
          >
            { copy }
          </div>
        </div>
      </div>
    );
  }

  handleShare() {
    const { link } = this.props;
    if (link) { this.props.executeShare(link); }
  }
}

const mapStateToProps = (state) => {
  return {
    ...getSharingData(state),
    link: state.sharing.link,
    visible: state.sharing.visible,
  };
};

const mapDispatchToProps = {
  executeShare,
  hideCTA,
};

export default connect(mapStateToProps, mapDispatchToProps)(CTA);
