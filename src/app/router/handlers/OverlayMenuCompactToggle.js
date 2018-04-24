import { BaseHandler, METHODS } from 'platform/router';
import { toggleCompact } from 'app/actions/compact';
import { toggleOptOutOfCardView } from 'app/actions/cardViewExperiment';

export default class OverlayMenuCompactToggle extends BaseHandler {
  async [METHODS.POST](dispatch) {
    dispatch(toggleCompact());

    // we track view-style changes for all users in the card view experiment for analytics
    dispatch(toggleOptOutOfCardView());
  }
}
