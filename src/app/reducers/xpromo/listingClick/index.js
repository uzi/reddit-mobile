/**
 * @module {function} listingClick
 * @memberof app/reducers/xpromo
 *
 * This reducer manges all of the listingClick xpromo state.
 */

import merge from 'platform/merge';

import * as xpromoActions from 'app/actions/xpromo';

export const DEFAULT = {
  ineligibilityReason: null, // Truthy when this session is ineligible
  // for the listing click experiment; truthy values should be strings
  // describing the ineligibilityReason. For now, this is based solely on
  // localStorage being available

  lastModalClick: 0, // Last Time in epoch-milliseconds that we triggered a modal listing click

  target: null, // null or the dom element that was clicked.
  // this is held in order to continue with the action the we initially intercepted
  // if the user dismissed the modal.

  clickInfo: null, // null or an object with additional data about the
  // listing click that opened the app store modal. this info is used
  // for tracking and generating a branch link with relevant deep link info.
  // This will persist on click until `active` is false.
  // it will look like: {
  //   listingClickType: `string` - one of the ListingClickType constants
  //   postId: `string` the postId of the listing item that was clicked on
  // }

  active: false, // True if we're showing anything, in the process of redirecting
  // a click, etc. Any state that needs to know if we're in listing click 'mode'
  // should use this flag. e.g. xpromo tracking and branch link generation that
  // records experiment data and interstitial types should use this flag
  // in order to differentiate being in the listing click experiment vs
  // the frequency experiment

  showingAppStoreModal: false, // true if the click-through modal should be visible

  showingReturnerModal: false, // true if the returner modal should be visible.
  // Note: when bucketed in the dismiss-able variants, clicking 'dismiss' will
  // close the app store modal without showing a returner modal.
};

export default function(state=DEFAULT, action={}) {
  switch (action.type) {
    case xpromoActions.LISTING_CLICK_INITIAL_STATE: {
      const { ineligibilityReason, lastModalClick } = action.payload;
      return merge(state, {
        ineligibilityReason,
        lastModalClick,
        target: null,
      });
    }

    case xpromoActions.SET_LISTING_CLICK_TARGET: {
      const { target } = action.payload;

      return merge(state, { target });
    }

    case xpromoActions.LISTING_CLICK_MODAL_ACTIVATED: {
      const { postId, listingClickType } = action.payload;

      return merge(state, {
        active: true,
        showingAppStoreModal: true,
        clickInfo: {
          listingClickType,
          postId,
        },
      });
    }

    case xpromoActions.LISTING_CLICK_RETURNER_MODAL_ACTIVATED: {
      return merge(state, {
        active: true,
        showingAppStoreModal: false,
        showingReturnerModal: true,
      });
    }

    case xpromoActions.LISTING_CLICK_MODAL_HIDDEN: {
      return merge(state, {
        active: false,
        clickInfo: null,
        target: null,
        showingAppStoreModal: false,
        showingReturnerModal: false,
      });
    }

    case xpromoActions.MARK_MODAL_LISTING_CLICK_TIMESTAMP: {
      return merge(state, {
        lastModalClick: action.clickTime,
      });
    }

    default: return state;
  }
}
