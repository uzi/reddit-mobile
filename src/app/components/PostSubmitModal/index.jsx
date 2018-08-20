import React from 'react';
import every from 'lodash/every';
import isEmpty from 'lodash/isEmpty';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { parse } from 'url';

import { Anchor, JSForm } from 'platform/components';
import cx from 'lib/classNames';
import forceHttps from 'lib/forceHttps';
import Modal from '../Modal';
import ReCaptchaBox from '../ReCaptchaBox';
import * as postingActions from 'app/actions/posting';
import './styles.less';

const T = React.PropTypes;

const MODAL_TITLE_TEXT = { self: 'Text', link: 'Link' };
const SELECT_COMMUNITY = 'Select a community';
const TITLE_PLACEHOLDER = 'Add an interesting title';
const SAFE_HARBOR_TEXT = 'Posting this link saves the image or gif to Reddit';

const SCRAPED_DOMAIN_REGEX = /\b(gfycat\.com|imgur\.com)$/i;
const SCRAPED_EXTENSION_REGEX = /\.(gif|jpeg|jpg|png|tiff)$/;

class PostSubmitModal extends React.Component {
  static propTypes = {
    readyToPost: T.bool.isRequired,
    subreddit: T.object.isRequired,
    title: T.string.isRequired,
    meta: T.oneOfType([T.string, T.instanceOf(global.File)]).isRequired,
    showCaptcha: T.bool.isRequired,
    submissionType: T.string.isRequired,
    onFieldUpdate: T.func.isRequired,
    onRecaptchaLoaded: T.func.isRequired,
    onSubmit: T.func.isRequired,
    onCloseCaptcha: T.func.isRequired,
  };

  // Safe Harbor check
  isUrlScraped = url => {
    const parsedUrl = parse(forceHttps(url));
    // Check if domain is from scraped domain list
    if (parsedUrl.hostname && SCRAPED_DOMAIN_REGEX.test(parsedUrl.hostname)) {
      return true;
    }
    // Check if pathname has an extension from scraped extension list
    if (parsedUrl.pathname && SCRAPED_EXTENSION_REGEX.test(parsedUrl.pathname)) {
      return true;
    }
    return false;
  }

  render() {
    const {
      meta,
      submissionType,
      readyToPost,
      onSubmit,
      onFieldUpdate,
      onRecaptchaLoaded,
      showCaptcha,
      onCloseCaptcha,
      title: postTitle,
    } = this.props;

    const modalTitle = MODAL_TITLE_TEXT[submissionType];
    const buttonClass = cx('PostSubmitModal__submit-button', { ready: readyToPost });
    const showSafeHarborText = this.isUrlScraped(meta);

    return (
      <Modal exitTo='/' titleText={ modalTitle }>
        <JSForm onSubmit={ onSubmit } className='PostSubmitModal'>

          <div className='PostSubmitModal__submit'>
            <button type='submit' className={ buttonClass }>POST</button>
          </div>

          { this.renderSubredditButton() }

          <div className='PostSubmitModal__title'>
            <input
              value={ postTitle }
              placeholder={ TITLE_PLACEHOLDER }
              onChange={ onFieldUpdate.bind(this, 'title') }
            />
          </div>

          <div className='PostSubmitModal__content'>
            { this.chooseContentInput(submissionType) }
          </div>
        </JSForm>

        { showCaptcha
          ? <ReCaptchaBox
              onCloseCaptcha={ onCloseCaptcha }
              onRecaptchaLoaded={ onRecaptchaLoaded }
              onSubmit={ onSubmit }
            />
          : null }
        { showSafeHarborText
          ? <div className='PostSubmitModal__safeHarborText'>
              { SAFE_HARBOR_TEXT }
            </div>
          : null
        }
      </Modal>
    );
  }

  chooseContentInput() {
    switch (this.props.submissionType) {
      case 'self':
        return this.renderTextInput();
      case 'link':
        return this.renderLinkInput();
      default:
        return this.renderTextInput();
    }
  }

  renderTextInput() {
    return (
      <div className='PostSubmitModal__content-text'>
        <textarea
          rows='5'
          value={ this.props.meta }
          placeholder='Add your text...'
          onChange={ this.props.onFieldUpdate.bind(this, 'meta') }
        />
      </div>
    );
  }

  renderLinkInput() {
    return (
      <div className='PostSubmitModal__content-link'>
        <input
          value={ this.props.meta }
          placeholder='Paste your link here...'
          onChange={ this.props.onFieldUpdate.bind(this, 'meta') }
        />
      </div>
    );
  }

  renderSubredditButton() {
    const { subreddit: { name, iconUrl }, submissionType } = this.props;

    const style = iconUrl ? { backgroundImage: `url(${iconUrl})` } : null;
    const text = name ? name : SELECT_COMMUNITY;
    const commClasses = cx('PostSubmitModal__community-text', { 'greyed': !name });

    return (
      <div className='PostSubmitModal__community'>
        <div className='PostSubmitModal__community-snoo-icon'>
          <div className='PostSubmitModal__community-snoo' style={ style }></div>
        </div>
        <Anchor href={ `/submit/to_community?type=${submissionType}` }>
          <div className={ commClasses }>
            { text }
            <div className='icon icon-nav-arrowdown'></div>
          </div>
        </Anchor>
      </div>
    );
  }
}


const mapStateToProps = createSelector(
  state => state.posting,
  state => state.subreddits,
  state => state.platform.currentPage.urlParams.subredditName,
  (posting, subreddits, subredditName) => {
    const { title, meta, gRecaptchaResponse, showCaptcha, currentType: submissionType } = posting;

    const subredditMetaData = subreddits[subredditName];
    const iconUrl = subredditMetaData ? subredditMetaData.iconImage : null;

    const readyFields = submissionType === 'self'
      ? [title, subredditName]
      : [title, meta, subredditName];

    const readyToPost = every(readyFields, v => !isEmpty(v));

    return {
      title,
      meta,
      gRecaptchaResponse,
      submissionType,
      readyToPost,
      showCaptcha,
      subreddit: { name: subredditName, iconUrl },
    };
  }
);

const dispatcher = dispatch => {
  return {
    onFieldUpdate: (name, e) => dispatch(postingActions.updateField(name, e.target.value)),
    onRecaptchaLoaded: (name, value) => dispatch(postingActions.updateField(name, value)),
    onCloseCaptcha: () => dispatch(postingActions.closeCaptcha()),
    _onSubmit: data => dispatch(postingActions.submitPost(data)),
  };
};

const mergeProps = (stateProps, dispatchProps) => {
  const { onFieldUpdate, onRecaptchaLoaded, onCloseCaptcha, _onSubmit } = dispatchProps;
  const {
    title,
    meta,
    gRecaptchaResponse,
    showCaptcha,
    submissionType,
    readyToPost,
    subreddit,
  } = stateProps;

  return {
    meta,
    title,
    gRecaptchaResponse,
    submissionType,
    readyToPost,
    subreddit,
    showCaptcha,
    onFieldUpdate,
    onRecaptchaLoaded,
    onCloseCaptcha,
    onSubmit: () => {
      if (!readyToPost) { return; }
      _onSubmit(
        { title, meta, gRecaptchaResponse, showCaptcha, sr: subreddit.name, kind: submissionType }
      );
    },
  };
};


export default connect(mapStateToProps, dispatcher, mergeProps)(PostSubmitModal);
