import { BaseHandler, METHODS } from 'platform/router';
import { optOutOfQuarantine } from 'app/actions/quarantine';

export default class OptOutOfQuarantineInterstitial extends BaseHandler {
  async [METHODS.POST](dispatch) {
    const { subredditName } = this.bodyParams;
    dispatch(optOutOfQuarantine(subredditName));
  }
}
