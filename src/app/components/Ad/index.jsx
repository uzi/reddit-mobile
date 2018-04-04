import React from 'react';
import { findDOMNode } from 'react-dom';
import { connect } from 'react-redux';

import 'lib/intersectionObserverPolyfill'; // Must come before Observer import
import Observer from '@researchgate/react-intersection-observer';

import { isHidden } from 'lib/dom';

import * as adActions from 'app/actions/ads';
import Post from 'app/components/Post';

const T = React.PropTypes;

const IMPRESSION_THRESHOLD = 0.01;
const VIEWABILITY_THRESHOLD = 0.5;
const VIDEO_VIEWABILITY_THRESHOLD = 1.0;
const VIEWABILITY_TIME = 1000;
const VIDEO_VIEWABILITY_TIME = 2000;
const VIDEO_FULL_VIEWABILITY_TIME = 3000;
const THRESHOLDS = [
  IMPRESSION_THRESHOLD,
  VIEWABILITY_THRESHOLD,
  VIDEO_VIEWABILITY_THRESHOLD,
];

class Ad extends React.Component {
  static propTypes = {
    // ownProps
    postId: T.string.isRequired,
    placementIndex: T.number.isRequired,
    postProps: T.object.isRequired,

    // props from connect
    onImpression: T.func.isRequired,
    onViewableImpression: T.func.isRequired,
    onAdblockDetected: T.func.isRequired,
  };

  // an element must be 50% viewable for at least 1 second
  // to be consider viewable per the IAB standard.
  viewableImpression = {
    threshold: VIEWABILITY_THRESHOLD,
    time: VIEWABILITY_TIME,
    timer: null,
    onImpression: this.props.onViewableImpression,
    madeImpression: false,
    disabled: false,
  }
  // a video ad element must be 50% viewable for at least
  // 2 seconds continuously post-buffering to be considered viewable
  // per specs
  videoViewableImpression = {
    threshold: VIEWABILITY_THRESHOLD,
    time: VIDEO_VIEWABILITY_TIME,
    timer: null,
    onImpression: this.props.onVideoViewableImpression,
    madeImpression: false,
    disabled: false,
  }
  // a video ad element must be 100% viewable for at least
  // 3 seconds continuously post-buffering to be considered
  // fully viewable per specs
  videoFullyViewableImpression = {
    threshold: VIDEO_VIEWABILITY_THRESHOLD,
    time: VIDEO_FULL_VIEWABILITY_TIME,
    timer: null,
    onImpression: this.props.onVideoFullyViewableImpression,
    madeImpression: false,
    disabled: false,
  }

  constructor(props) {
    super(props);
    const { isVideo, postId, videoAdsStatus } = props;
    this.hasBuffered = videoAdsStatus.hasBuffered[postId];
    this.latestViewStartTime = videoAdsStatus.currentViewStartedAt[postId];
    this.event = null;
    this.state = {
      madeImpression: false,
      shouldDisableObserver: false,
      shouldTrackVideoImpression: isVideo && this.hasBuffered,
    };
  }

  componentDidMount() {
    this.checkAdblock();
  }

  componentDidUpdate() {
    const { isVideo, postId, videoAdsStatus } = this.props;
    const { hasBuffered, currentViewStartedAt } = videoAdsStatus;
    const userSkippedInVideo = currentViewStartedAt[postId] !== this.latestViewStartTime;
    if (!isVideo) { return; }
    if (userSkippedInVideo) {
      this.handleVideoSkip(currentViewStartedAt[postId]);
    }
    this.handleBufferingUpdate(hasBuffered[postId]);
  }

  handleVideoSkip(newViewStartTime) {
    this.latestViewStartTime = newViewStartTime;
    const impressions = [
      this.viewableImpression,
      this.videoViewableImpression,
      this.videoFullyViewableImpression,
    ];
    // when a user skips around in a video, the view isn't considered to be
    // continuous, therefore, we must reset the view timers whenever
    // a user skips
    impressions.forEach(impression => {
      if (impression.madeImpression) { return; }
      clearTimeout(impression.timer);
      impression.timer = null;
      // user can skip to the end of the video, but we can only count viewable
      // impressions when the video is playing. hence, if there isn't enough
      // remaining time in the video to record an impression, we disable the stat.
      // however, if a user then skips back to an earlier part of the video, we
      // may re-enable the impression
      const { length } = this.props.videoAdsStatus;
      impression.disabled = length - newViewStartTime * 1000 < impression.time ? true : false;
      this.checkIfShouldDisableObserver();
    });
  }

  handleBufferingUpdate(bufferedStatus) {
    // tracking video impressions is dependent on whether or not the video is buffering
    if (this.hasBuffered === bufferedStatus) {
      this.handleObserver(this.event);
      return;
    }
    this.hasBuffered = bufferedStatus;
    this.setState({ shouldTrackVideoImpression: this.hasBuffered }, () => {
      this.handleObserver(this.event);
    });
  }

  checkAdblock() {
    if (isHidden(findDOMNode(this))) {
      this.props.onAdblockDetected();
    }
  }

  handleObserver = e => {
    // make event available globally to allow for delays in buffering
    this.event = e;

    // basic impression metric
    const { madeImpression } = this.state;
    // an element must enter the viewport to register as impression
    if (!madeImpression && e.isIntersecting && e.intersectionRatio >= IMPRESSION_THRESHOLD) {
      this.setState({ madeImpression: true }, this.props.onImpression);
    }

    // viewability impression metrics
    this.handleImpression(e, this.viewableImpression);
    if (this.state.shouldTrackVideoImpression) {
      this.handleImpression(e, this.videoViewableImpression);
      this.handleImpression(e, this.videoFullyViewableImpression);
    }
  }

  handleImpression(e, impression) {
    const { madeImpression, threshold, time } = impression;
    if (!madeImpression && e.isIntersecting && e.intersectionRatio >= threshold) {
      if (impression.timer || impression.disabled) {
        return;
      }
      impression.timer = window.setTimeout(() => {
        this.onViewabilityImpression(impression);
        this.checkIfShouldDisableObserver();
      }, time);
      return;
    }
    if (impression.timer) {
      clearTimeout(impression.timer);
    }
  }

  onViewabilityImpression(impression) {
    if (impression.madeImpression) { return; }
    impression.madeImpression = true;
    impression.onImpression();
  }

  checkIfShouldDisableObserver() {
    // we only need to check all impressions when the ad is a video
    const impressions = [
      this.viewableImpression,
    ];
    if (this.props.isVideo) {
      impressions.push(this.videoViewableImpression, this.videoFullyViewableImpression);
    }
    const shouldDisableObserver = impressions.reduce((shouldDisable, imp) => (
      (shouldDisable && (imp.madeImpression || imp.disabled))
    ), true);
    if (shouldDisableObserver === this.state.shouldDisableObserver) { return; }
    // enable or disable the observer based on whether all impressions have been made
    // or whether impressions are disabled
    this.setState({ shouldDisableObserver });
  }

  render() {
    const { postProps, postId } = this.props;
    return (
      <Observer
        threshold={ THRESHOLDS }
        onChange={ this.handleObserver }
        disabled={ this.state.shouldDisableObserver }
      >
        <Post { ...postProps } postId={ postId } key={ `post-id-${postId}` }/>
      </Observer>
    );
  }
}

const mapDispatchToProps = (dispatch, { postId, placementIndex }) => ({
  onImpression() { dispatch(adActions.trackImpression(postId)); },
  onViewableImpression() { dispatch(adActions.trackViewableImpression(postId)); },
  onVideoViewableImpression() {
    dispatch(adActions.trackVideoViewableImpression(postId));
  },
  onVideoFullyViewableImpression() {
    dispatch(adActions.trackVideoFullyViewableImpression(postId));
  },
  onAdblockDetected() { dispatch(adActions.trackAdHidden(placementIndex)); },
});

export default connect(undefined, mapDispatchToProps)(Ad);
