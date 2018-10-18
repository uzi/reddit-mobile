import { BaseHandler, METHODS } from 'platform/router';
import { optIntoQuarantine } from 'app/actions/quarantine';

export default class OptIntoQuarantineHandler extends BaseHandler {
  async [METHODS.POST](dispatch) {
    const { subredditName } = this.bodyParams;
    dispatch(optIntoQuarantine(subredditName));
  }
}
