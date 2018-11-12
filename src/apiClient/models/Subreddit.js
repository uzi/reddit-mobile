import RedditModel from './RedditModel';
import { SUBREDDIT } from './thingTypes';
import SubscriptionEndpoint from '../apis/SubscriptionEndpoint';

const T = RedditModel.Types;

// If the data doesn't have all of the keys, get the full subreddit data
// and then merge in the changes and submit _that_. The API requires the
// full object be sent.
// Whoever uses this new model for posting should confirm that
// this is the full list of edit fields, you may just be able to
// say something like
const EDIT_FIELDS = [
  'default_set',
  'subreddit_id',
  'domain',
  'show_media',
  'wiki_edit_age',
  'submit_text',
  'spam_links',
  'title',
  'collapse_deleted_comments',
  'wikimode',
  'over_18',
  'related_subreddits',
  'suggested_comment_sort',
  'description',
  'submit_link_label',
  'spam_comments',
  'spam_selfposts',
  'submit_text_label',
  'key_color',
  'language',
  'wiki_edit_karma',
  'hide_ads',
  'header_hover_text',
  'public_traffic',
  'public_description',
  'comment_score_hide_mins',
  'subreddit_type',
  'exclude_banned_modqueue',
  'submission_type',
].sort();

export default class Subreddit extends RedditModel {
  static type = SUBREDDIT;

  static fields = EDIT_FIELDS;

  static PROPERTIES = {
    accountsActive: T.number,
    advertiserCategory: T.string,
    bannerImage: T.string,
    bannerSize: T.arrayOf(T.number),
    collapseDeletedComments: T.bool,
    commentScoreHideMins: T.number,
    createdUTC: T.number,
    description: T.string,
    descriptionHTML: T.string,
    displayName: T.string,
    displayNamePrefixed: T.string,
    headerImage: T.string,
    headerSize: T.arrayOf(T.number),
    headerTitle: T.string,
    hideAds: T.bool,
    iconImage: T.string,
    iconSize: T.arrayOf(T.number),
    id: T.string,
    keyColor: T.string,
    lang: T.string,
    name: T.string,
    over18: T.bool,
    publicDescription: T.string,
    publicTraffic: T.nop,
    quarantine: T.bool,
    quarantineMessageHTML: T.string,
    relatedSubreddits: T.array,
    spoilersEnabled: T.bool,
    submissionType: T.string,
    submitLinkLabel: T.string,
    submitText: T.string,
    submitTextLabel: T.string,
    subredditType: T.string,
    subscribers: T.number,
    suggestedCommentSort: T.string,
    title: T.string,
    url: T.string,
    userIsBanned: T.bool,
    userIsContributor: T.bool,
    userIsModerator: T.bool,
    userIsMuted: T.bool,
    userIsSubscriber: T.bool,
    userSrThemeEnabled: T.bool,
    whitelistStatus: T.nop,
    wikiEnabled: T.bool,
  };

  static API_ALIASES = {
    accounts_active: 'accountsActive',
    advertiser_category: 'advertiserCategory',
    banner_img: 'bannerImage',
    banner_size: 'bannerSize',
    collapse_deleted_comments: 'collapseDeletedComments',
    comment_score_hide_mins: 'commentScoreHideMins',
    created_utc: 'createdUTC',
    description_html: 'descriptionHTML',
    display_name: 'displayName',
    display_name_prefixed: 'displayNamePrefixed',
    header_img: 'headerImage',
    header_size: 'headerSize',
    header_title: 'headerTitle',
    hide_ads: 'hideAds',
    icon_img: 'iconImage',
    icon_size: 'iconSize',
    key_color: 'keyColor',
    over_18: 'over18',
    public_description: 'publicDescription',
    public_traffic: 'publicTraffic',
    quarantine_message_html: 'quarantineMessageHTML',
    related_subreddits: 'relatedSubreddits',
    spoilers_enabled: 'spoilersEnabled',
    submission_type: 'submissionType',
    submit_link_label: 'submitLinkLabel',
    submit_text_label: 'submitTextLabel',
    submit_text: 'submitText',
    subreddit_type: 'subredditType',
    user_is_banned: 'userIsBanned',
    user_is_contributor: 'userIsContributor',
    user_is_moderator: 'userIsModerator',
    user_is_muted: 'userIsMuted',
    user_is_subscriber: 'userIsSubscriber',
    user_sr_theme_enabled: 'userSrThemeEnabled',
    whitelist_status: 'whitelistStatus',
    wiki_enabled: 'wikiEnabled',
  };

  static cleanName = (name) => {
    if (!name) { return name; }
    return name.replace(/^\/?r\//, '').replace(/\/?$/, '').toLowerCase();
  };

  // we want to be able to lookup subreddits by name. This way when you have a
  // a permalink url with the subredddit name or someone types in a subreddit name
  // in the goto field we can look-up the subreddit in our cache without converting
  // the name to a thing_id.
  // We use a special type of subreddit to handle profile posts, and as an
  // interim measure, we want to handle permalinks that include the display
  // name for those subreddits (u_profilename). We can safely use the
  // display_name field for that mapping of URL -> state ID for vanilla
  // subreddits and for profile post subreddits.
  makeUUID(data) {
    // We may pass this an already formed model which will have "displayName"
    // instead of "display_name". So if we already have a uuid, just use that.
    if (data.uuid) {
      return data.uuid;
    }

    const { display_name } = data;
    return Subreddit.cleanName(display_name);
  }

  makePaginationId(data) {
    return data.name; // this is the thing fullname
  }

  toggleSubscribed(apiOptions) {
    const { userIsSubscriber } = this;
    const toggled = !userIsSubscriber;
    const oldModel = this;

    const stub = this.stub('userIsSubscriber', toggled, async () => {
      try {
        const data = { subreddit: oldModel.name };
        const endpoint = toggled ? SubscriptionEndpoint.post : SubscriptionEndpoint.del;
        await endpoint(apiOptions, data);
        return stub;
      } catch (e) {
        throw oldModel;
      }
    });

    return stub;
  }
}
