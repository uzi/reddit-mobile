import './styles.less';

import React from 'react';
import { connect } from 'react-redux';
import { dismiss } from 'app/actions/notification';

class Notification extends React.Component {
  render() {
    const { title, content, button, dismiss, visible } = this.props;

    const className = `Notification ${visible ? '' : 'hidden'}`;

    return (
      <div className={ className }>
        <span
          className="Notification__close icon icon-x"
          onClick={ dismiss }
        />
        <div className='Notification__title'>{ title }</div>
        <div className='Notification__content'>{ content }</div>
        <div className='Notification__button' onClick={ dismiss }>{ button }</div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { title, content, button, visible } = state.notification;
  return { title, content, button, visible };
}

const mapDispatchToProps = {
  dismiss,
};

export default connect(mapStateToProps, mapDispatchToProps)(Notification);
