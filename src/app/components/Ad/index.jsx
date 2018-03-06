import React from 'react';
import { findDOMNode } from 'react-dom';
import { connect } from 'react-redux';

import Observer from '@researchgate/react-intersection-observer';

import { isHidden } from 'lib/dom';

import * as adActions from 'app/actions/ads';
import Post from 'app/components/Post';

const T = React.PropTypes;

const IMPRESSION_THRESHOLD = 0;
const VIEWABILITY_THRESHOLD = 0.5;
const VIEWABILITY_TIME = 1000;

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

  constructor(props) {
    super(props);
    this.state = {
      madeImpression: false,
      madeViewableImpression: false,
    };
  }

  componentDidMount() {
    this.checkAdblock();
  }

  checkAdblock() {
    if (isHidden(findDOMNode(this))) {
      this.props.onAdblockDetected();
    }
  }
  
  handleImpressionChange = e => {
    // an element must enter the viewport to register as impression
    if (e.isIntersecting) {
      this.onImpression();
    }
  }

  onImpression() {
    // we only need to track the impression once.
    if (this.state.madeImpression) { return; }
    this.setState({ madeImpression: true }, this.props.onImpression);
  }

  handleViewabilityChange = e => {
    // an element must be 50% viewable for at least 1 second
    // to be consider viewable per the IAB standard.
    if (e.isIntersecting && e.intersectionRatio >= VIEWABILITY_THRESHOLD) {
      this.timer = window.setTimeout(() => {
        this.onViewableImpression();
      }, VIEWABILITY_TIME);
      return;
    }

    // reset if the item is no longer in view.
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  onViewableImpression() {
    // we only need to track the impression once.
    if (this.state.madeViewableImpression) { return; }
    this.setState({ madeViewableImpression: true }, this.props.onViewableImpression);
  }

  render() {
    const { postProps, postId } = this.props;
    return (
      <Observer
        threshold={ VIEWABILITY_THRESHOLD }
        onChange={ this.handleViewabilityChange }
        disabled={ this.state.madeViewableImpression }
      >
        <Observer
          threshold={ IMPRESSION_THRESHOLD }
          onChange={ this.handleImpressionChange }
          disabled={ this.state.madeImpression }
        >
          <Post { ...postProps } postId={ postId } key={ `post-id-${postId}` }/>
        </Observer>
      </Observer>
    );
  }
}

const mapDispatchToProps = (dispatch, { postId, placementIndex }) => ({
  onImpression() { dispatch(adActions.trackImpression(postId)); },
  onViewableImpression() { dispatch(adActions.trackViewableImpression(postId)); },
  onAdblockDetected() { dispatch(adActions.trackAdHidden(placementIndex)); },
});

export default connect(undefined, mapDispatchToProps)(Ad);
