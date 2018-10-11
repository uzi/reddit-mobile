import RedditModel from './RedditModel';
import {
  SITEWIDE_RULE,
} from './thingTypes';

const T = RedditModel.Types;

export default class SitewideRule extends RedditModel {
  static type = SITEWIDE_RULE;

  static SITEWIDE_RULE_KEYWORD = 'site_reason_selected';

  static PROPERTIES = {
    nextStepHeader: T.string,
    nextStepReasons: T.arrayOf(function(val) {
      return SitewideRule.fromJSON({
        nextStepHeader: val.nextStepHeader,
        nextStepReasons: val.nextStepReasons,
        reasonText: val.reasonText,
        reasonTextToShow: val.reasonTextToShow,
        fileComplaint: val.fileComplaint,
        complaintPrompt: val.complaintPrompt,
        complaintUrl: val.complaintUrl,
      });
    }),
    reasonText: T.string,
    reasonTextToShow: T.string,
    fileComplaint: T.bool,
    complaintPrompt: T.string,
    complaintUrl: T.string,
  };

  makeUUID(data) {
    return `${data.reasonText || data.reasonTextToShow}`;
  }

  /**
   * Returns the string used in report flow for this rule(can be already translated).
   * @function
   * @returns {string}
   */
  getReportReasonToShow() {
    return this.reasonTextToShow;
  }
}
