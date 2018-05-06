import './styles.less';

import React from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { JSForm } from 'platform/components';
import cx from 'lib/classNames';
import * as replyActions from 'app/actions/reply';

const T = React.PropTypes;

export class CommentReplyForm extends React.Component {
  static propTypes = {
    onToggleReply: T.func.isRequired,
    pending: T.bool.isRequired,
  };

  constructor (props) {
    super(props);

    this.textarea = null;

    this.state = {
      disableButton: true,
    };
  }

  componentDidMount() {
    if (this.textarea) { this.textarea.focus(); }
  }

  onTextChange = (e) => {
    this.setState({ disableButton: !e.target.value.trim() });
  }

  render () {
    const { onToggleReply, onSubmitReply, pending } = this.props;
    const { disableButton } = this.state;
    const shouldDisable = disableButton || pending;
    const buttonClass = cx('Button', { 'm-disabled': shouldDisable });

    return (
      <JSForm onSubmit={ onSubmitReply } className='CommentReplyForm'>
        <div className='CommentReplyForm__textarea'>
          <textarea ref={ (node) => { this.textarea = node; } } className='TextField' name='text' onChange={ this.onTextChange } />
        </div>

        <div className='CommentReplyForm__footer'>
          <span
            className='CommentReplyForm__close icon icon-x Button m-linkbutton'
            onClick={ onToggleReply }
          />

          <div className='CommentReplyForm__button'>
            <button type='submit' className={ buttonClass } disabled={ shouldDisable }>
              ADD COMMENT
            </button>
          </div>
        </div>
      </JSForm>
    );
  }
}

const stateProps = createStructuredSelector({
  replyApi: (state, { parentId }) => !!state.replyRequests[parentId] && state.replyRequests[parentId].pending,
});

const mapDispatchToProps = (dispatch, { parentId }) => ({
  onSubmitReply: formData => dispatch(replyActions.submit(parentId, formData)),
});

export default connect(stateProps, mapDispatchToProps)(CommentReplyForm);
