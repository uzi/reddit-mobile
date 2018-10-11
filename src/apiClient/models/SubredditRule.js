import RedditModel from './RedditModel';
import {
  COMMENT,
  POST,
  SUBREDDIT_RULE,
} from './thingTypes';

const T = RedditModel.Types;

export default class SubredditRule extends RedditModel {
  static type = SUBREDDIT_RULE;

  /**
   * Valid types for rule targets.
   * @enum
   */
  static RULE_TARGET = {
    ALL: 'all',
    POST: 'link',
    COMMENT: 'comment',
  };

  static PROPERTIES = {
    createdUTC: T.number,
    description: T.string,
    descriptionHTML: T.string,
    kind: T.string,
    priority: T.number,
    shortName: T.string,
    violationReason: T.string,

    // The `subredditName` property is not returned from the API directly.  It is
    // mixed into the response data by `SubredditRulesEndpoint.get` in order
    // to enable making unique UUIDs.
    subredditName: T.string,
  };

  static API_ALIASES = {
    short_name: 'shortName',
    created_utc: 'createdUTC',
    description_html: 'descriptionHTML',
    violation_reason: 'violationReason',
  };

  makeUUID(data) {
    // The actual rules model in r2 doesn't have a proper unique key, but
    // the `created_utc` timestamp should work since it shouldn't change.
    return `${data.subredditName}/${data.created_utc || data.createdUTC}`;
  }

  /**
   * Check if subreddit rules apply to the given thing type
   * @function
   * @param {string} thingType
   * @returns {boolean}
   */
  static doRulesApplyToThingType(thingType) {
    return thingType === POST || thingType === COMMENT;
  }

  /**
   * Check if a specific rule applies to the given thing type
   * @function
   * @param {string} thingType
   * @returns {boolean}
   */
  doesRuleApplyToThingType(thingType) {
    switch (this.kind) {
      case SubredditRule.RULE_TARGET.COMMENT:
        // Rule applies only to comments
        return thingType === COMMENT;

      case SubredditRule.RULE_TARGET.POST:
        // Rule applies only to posts
        return thingType === POST;

      default:
        // Rule applies to all valid rule target
        return SubredditRule.doRulesApplyToThingType(thingType);
    }
  }

  /**
   * Returns the string used in reports for violating this rule.
   * @function
   * @returns {string}
   */
  getReportReasonToShow() {
    return this.violationReason || this.shortName;
  }
}
