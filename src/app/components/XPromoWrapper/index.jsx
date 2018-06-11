import React from 'react';
import { connect } from 'react-redux';
import throttle from 'lodash/throttle';
import { createStructuredSelector } from 'reselect';
import * as xpromoPersist from 'lib/xpromoPersistState';
import {
  promoScrollPast,
  promoScrollStart,
  promoScrollUp,
  promoPersistActivate,
  promoPersistDeactivate,
} from 'app/actions/xpromo';
import {
  trackXPromoView,
  trackXPromoEvent,
} from 'lib/eventUtils';

import {
  XPROMO_SCROLLPAST,
  XPROMO_SCROLLUP,
  XPROMO_VIEW,
  XPROMO_DISMISS,
  XPROMO_INELIGIBLE,
} from 'lib/eventUtils';

import {
  xpromoThemeIsUsual,
  dismissedState,
  scrollPastState,
  scrollStartState,
  isXPromoPersistent,
  xpromoAdFeedVariant,
} from 'app/selectors/xpromo';

import { SCALED_INFERENCE } from 'app/constants';

class XPromoWrapper extends React.Component {
  constructor(props) {
    super(props);

    this.scrollListener = throttle(this.onScroll, 100);
  }

  launchPersistentExperiment() {
    if (this.props.isXPromoPersistent) {
      this.displayPersistBannerByTimer();
    }
  }

  displayPersistBannerByTimer() {
    const { isInterstitialDismissed } = this.props;

    xpromoPersist.runStatusCheck((status) => {
      switch (status) {
        case xpromoPersist.statusKey.JUST_DISMISSED: {
          this.props.trackXPromoEvent(
            XPROMO_VIEW, { process_note: 'just_dismissed_and_show' }
          );
          break;
        }

        case xpromoPersist.statusKey.SHOW_SAME_SESSION: {
          this.props.promoPersistActivate();
          this.props.trackXPromoEvent(
            XPROMO_VIEW, { process_note: 'show_same_session' }
          );
          break;
        }

        case xpromoPersist.statusKey.SHOW_NEW_SESSION: {
          this.props.promoPersistActivate();
          this.props.trackXPromoEvent(
            XPROMO_VIEW, { process_note: 'show_new_session' }
          );
          break;
        }

        case xpromoPersist.statusKey.HIDE: {
          this.props.promoPersistDeactivate();
          this.props.trackXPromoEvent(
            XPROMO_DISMISS, { ineligibility_reason: 'hide_by_timeout'}
          );
          break;
        }

        case xpromoPersist.statusKey.BLOCK_SHOW: {
          this.props.promoPersistDeactivate();
          this.props.trackXPromoEvent(
            XPROMO_INELIGIBLE, { ineligibility_reason: 'recent_session'}
          );
        }
      }
    }, isInterstitialDismissed);
  }

  onScroll = () => {
    // For now we will consider scrolling half the
    // viewport "scrolling past" the interstitial.
    // note the referencing of window
    const {
      alreadyScrolledStart,
      alreadyScrolledPast,
      xpromoThemeIsUsual,
      isXPromoPersistent,
      xpromoAdFeedVariant,
    } = this.props;

    // should appears only once on the start
    // of the scrolled down by the viewport
    if (!xpromoThemeIsUsual && !alreadyScrolledStart) {
      this.props.trackXPromoEvent(XPROMO_SCROLLPAST, { scroll_note: 'scroll_start' });
      this.props.promoScrollStart();
    }
    // should appears only once on scroll down about the half viewport.
    // "scrollPast" state is also used for
    // toggling xpromo fade-in/fade-out actions
    if (this.isScrollPast() && !alreadyScrolledPast) {
      const additionalData = (xpromoThemeIsUsual ? {} : { scroll_note: 'unit_fade_out' });
      this.props.trackXPromoEvent(XPROMO_SCROLLPAST, additionalData);
      this.props.promoScrollPast();
    }
    // should appears only once on scroll up about the half viewport.
    // xpromo fade-in action, if user will scroll
    // window up (only for "minimal" xpromo theme)
    if (!this.isScrollPast() && alreadyScrolledPast) {
      const additionalData = (xpromoThemeIsUsual ? {} : { scroll_note: 'unit_fade_in' });
      this.props.trackXPromoEvent(XPROMO_SCROLLUP, additionalData);
      this.props.promoScrollUp();
    }
    // remove scroll events for usual xpromo theme
    // (no needs to listen window up scrolling)
    if (xpromoThemeIsUsual && alreadyScrolledPast && !isXPromoPersistent) {
      if (xpromoAdFeedVariant) {
        this.props.trackXPromoEvent(
          XPROMO_VIEW, { interstitial_type: xpromoAdFeedVariant }
        );
      }
      this.toggleOnScroll(false);
    }
  }

  isScrollPast() {
    const { alreadyScrolledPast } = this.props;
    let isPastHalfViewport = (window.pageYOffset > window.innerHeight / 2);
    // Fixing an issue, when (height of content part + height of the second xpromo
    // for bottom padding) is the same as window.pageYOffset. In this case:
    // 1. isPastHalfViewport - is false
    // 2. let's scroll a little bit more
    // 3.1. isPastHalfViewport - become true
    // 3.2. class 'fadeOut' will be deleted
    // 3.3. second xpromo for bottom padding become hidden (after deleting the class 'fadeOut')
    // 4. window.pageYOffset will become lower again (because of removing height of second xpromo)
    // 5. isPastHalfViewport - will become false
    // 6. and it will goes around forever...
    // Desynchronizing Up/Down heights, to avoid this issue.
    if (!alreadyScrolledPast) {
      isPastHalfViewport = ((window.pageYOffset - window.innerHeight) > 0);
    }
    return isPastHalfViewport;
  }

  toggleOnScroll(state) {
    if (state) {
      window.addEventListener('scroll', this.scrollListener);
    } else {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  componentDidUpdate() {
    this.launchPersistentExperiment();
  }
  componentWillMount() {
    this.launchPersistentExperiment();
  }
  componentDidMount() {
    this.toggleOnScroll(true);
    this.props.trackXPromoView();
  }
  componentWillUnmount() {
    this.toggleOnScroll(false);
  }
  render() {
    return this.props.children;
  }
}

const selector = createStructuredSelector({
  currentUrl: state => state.platform.currentPage.url,
  alreadyScrolledStart: state => scrollStartState(state),
  alreadyScrolledPast: state => scrollPastState(state),
  xpromoThemeIsUsual: state => xpromoThemeIsUsual(state),
  isInterstitialDismissed: state => dismissedState(state),
  isXPromoPersistent,
  xpromoAdFeedVariant,
});

const mapDispatchToProps = {
  trackXPromoView: () => async (_, getState) => {
    return trackXPromoView(getState(), { interstitial_type: SCALED_INFERENCE.TRANSPARENT });
  },
  trackXPromoEvent: (...args) => async(_, getState) => {
    return trackXPromoEvent(getState(), ...args);
  },
  promoScrollPast,
  promoScrollStart,
  promoScrollUp,
  promoPersistActivate,
  promoPersistDeactivate,
};

export default connect(selector, mapDispatchToProps)(XPromoWrapper);
