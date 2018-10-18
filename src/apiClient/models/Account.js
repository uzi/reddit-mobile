import RedditModel from './RedditModel';
import { ACCOUNT } from './thingTypes';

const T = RedditModel.Types;

export default class Account extends RedditModel {
  static type = ACCOUNT;

  static PROPERTIES = {
    commentKarma: T.number,
    createdUTC: T.number,
    features: T.nop,
    goldCreddits: T.number,
    goldExpiration: T.number,
    hasMail: T.bool,
    hasModMail: T.bool,
    hasVerifiedEmail: T.bool,
    hideFromRobots: T.bool,
    id: T.string,
    inBeta: T.bool,
    inboxCount: T.number,
    isEmployee: T.bool,
    isFPR: T.bool,
    isGold: T.bool,
    isMod: T.bool,
    isSuspended: T.bool,
    karma: T.number,
    linkKarma: T.number,
    loid: T.string,
    loidCreated: T.number,
    name: T.string,
    oauthClientId: T.string,
    over18: T.bool,
    subredditId: T.string,
    subredditName: T.string,
    suspensionExpirationUTC: T.number,
    verified: T.bool,
    hasSubscribed: T.bool,
  }

  static API_ALIASES = {
    comment_karma: 'commentKarma',
    created_utc: 'createdUTC',
    force_password_reset: 'isFPR',
    gold_creddits: 'goldCreddits',
    gold_expiration: 'goldExpiration',
    has_mail: 'hasMail',
    has_mod_mail: 'hasModMail',
    has_verified_email: 'hasVerifiedEmail',
    hide_from_robots: 'hideFromRobots',
    in_beta: 'inBeta',
    is_employee: 'isEmployee',
    is_gold: 'isGold',
    is_mod: 'isMod',
    is_suspended: 'isSuspended',
    link_karma: 'linkKarma',
    loid_created: 'loidCreated',
    oauth_client_id: 'oauthClientId',
    over_18: 'over18',
    suspension_expiration_utc: 'suspensionExpirationUTC',
    has_subscribed: 'hasSubscribed',
  }

  makeUUID(data) {
    return data.name.toLowerCase();
  }

  static DERIVED_PROPERTIES = {
    karma(data) {
      if (data.karma) {
        return data.karma;
      }
      return data.link_karma + data.comment_karma;
    },
    subredditId(data) {
      return data.subreddit ? data.subreddit.name : '';
    },
    subredditName(data) {
      return data.subreddit ? data.subreddit.display_name : '';
    },
  };
}
