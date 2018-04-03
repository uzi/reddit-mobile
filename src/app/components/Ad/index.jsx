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
  }

  constructor(props) {
    super(props);
    const { isVideo, postId, videoAdsStatus } = props;
    this.hasBuffered = videoAdsStatus.hasBuffered[postId];
    this.event = null;
    this.state = {
      madeImpression: false,
      // handle isVideo, isBuffering, hasSkipped, etc.
      madeAllImpressions: false,
      shouldTrackVideoImpression: isVideo && !this.state.madeAllImpressions && this.hasBuffered,
    };
    console.log('props ', props);
  }

  componentDidMount() {
    this.checkAdblock();
  }

  componentDidUpdate() {
    console.log('i updated as ', this);
    const { isVideo, postId, videoAdsStatus } = this.props;
    if (!isVideo || videoAdsStatus.hasBuffered[postId] === this.hasBuffered) {
      return;
    }
    this.hasBuffered = videoAdsStatus.hasBuffered[postId];
    this.setState({ shouldTrackVideoImpression: this.hasBuffered });
    this.handleObserver(this.event);
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
      impression.timer = window.setTimeout(() => {
        this.onViewabilityImpression(impression);
        if (!this.props.isVideo) {
          this.setState({ madeAllImpressions: true });
        }
      }, time);
      return;
    }
    if (impression.timer) {
      console.log('clearing timeout for ', impression);
      clearTimeout(impression.timer);
    }
  }

  onViewabilityImpression(impression) {
    if (impression.madeImpression) { return; }
    impression.madeImpression = true;
    impression.onImpression();
  }

  render() {
    const { postProps, postId } = this.props;
    return (
      <Observer
        threshold={ THRESHOLDS }
        onChange={ this.handleObserver }
        // TODO: elegant disable
        disabled={ this.state.madeAllImpressions }
      >
        <Post { ...postProps } postId={ postId } key={ `post-id-${postId}` }/>
      </Observer>
    );
  }
}

// TODO: make sure that these don't need to come from somewhere else too
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
