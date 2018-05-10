import RedditModel from './RedditModel';
import { POST } from './thingTypes';
import votable from './mixins/votable';

import comment from '../apis/CommentsEndpoint';

const T = RedditModel.Types;

const IGNORED_THUMBNAILS = new Set(['default', 'image', 'self', 'nsfw', 'spoiler']);
const cleanThumbnail = thumbnail => {
  return IGNORED_THUMBNAILS.has(thumbnail) ? '' : thumbnail;
};

export default class PostModel extends RedditModel {
  static type = POST;

  static PROPERTIES = {
    adserverImpPixel: T.string,
    archived: T.bool,
    author: T.string,
    brandSafe: T.bool,
    callToAction: T.string,
    cleanPermalink: T.link,
    cleanUrl: T.link,
    crosspostParent: T.string,
    distinguished: T.string,
    domain: T.string,
    downs: T.number,
    events: T.array,
    gilded: T.number,
    hidden: T.bool,
    id: T.string,
    impPixel: T.string,
    likes: T.likes,
    locked: T.bool,
    malink: T.link,
    media: T.nop,
    name: T.string,
    over18: T.bool,
    postHint: T.string,
    promoted: T.bool,
    quarantine: T.bool,
    saved: T.bool,
    score: T.number,
    spoiler: T.bool,
    stickied: T.bool,
    subreddit: T.string,
    subredditDetail: T.nop,
    subredditId: T.string,
    thumbnail: T.string,
    title: T.string,
    ups: T.number,
    removed: T.bool,
    approved: T.bool,
    spam: T.bool,
    whitelistStatus: T.nop,
    wls: T.nop,

    // aliases
    approvedBy: T.string,
    authorFlairCSSClass: T.string,
    authorFlairText: T.string,
    bannedBy: T.string,
    createdUTC: T.number,
    disableComments: T.bool,
    hideScore: T.bool,
    isSelf: T.bool,
    isBlankAd: T.bool,
    linkFlairCSSClass: T.string,
    linkFlairText: T.string,
    mediaOembed: T.nop,
    modReports: T.array,
    numComments: T.number,
    originalLink: T.string,
    outboundLink: T.nop,
    promotedBy: T.string,
    promotedDisplayName: T.string,
    promotedUrl: T.string,
    secureMedia: T.nop,
    selfTextHTML: T.string, // html version for display
    selfTextMD: T.string, // markdown version for editing
    sendReplies: T.bool,
    suggestedSort: T.string,
    thirdPartyTracking: T.string,
    thirdPartyTracking2: T.string,
    thirdPartyTrackers: T.string,
    userReports: T.array,
    videoPlaytime: T.number,

    // derived
    crosspostIds: T.nop,
    crosspostParentObj: T.nop,
    expandable: T.bool,
    expandedContent: T.html,
    preview: T.nop, // it's in data as well but we want to transform it
  };

  static API_ALIASES = {
    adserver_imp_pixel: 'adserverImpPixel',
    approved_by: 'approvedBy',
    author_flair_css_class: 'authorFlairCSSClass',
    author_flair_text: 'authorFlairText',
    banned_by: 'bannedBy',
    brand_safe: 'brandSafe',
    call_to_action: 'callToAction',
    created_utc: 'createdUTC',
    crosspost_parent: 'crosspostParent',
    disable_comments: 'disableComments',
    hide_score: 'hideScore',
    imp_pixel: 'impPixel',
    is_self: 'isSelf',
    is_blank: 'isBlankAd',
    link_flair_css_class: 'linkFlairCSSClass',
    link_flair_text: 'linkFlairText',
    media_oembed: 'mediaOembed',
    mod_reports: 'modReports',
    num_comments: 'numComments',
    original_link: 'originalLink',
    over_18: 'over18',
    outbound_link: 'outboundLink',
    permalink: 'cleanPermalink',
    promoted_by: 'promotedBy',
    promoted_display_name: 'promotedDisplayName',
    promoted_url: 'promotedUrl',
    post_hint: 'postHint',
    secure_media: 'secureMedia',
    selftext: 'selfTextMD',
    selftext_html: 'selfTextHTML',
    suggested_sort: 'suggestedSort',
    sr_detail: 'subredditDetail',
    subreddit_id: 'subredditId',
    sendreplies: 'sendReplies',
    third_party_tracking: 'thirdPartyTracking',
    third_party_tracking_2: 'thirdPartyTracking2',
    third_party_trackers: 'thirdPartyTrackers',
    url: 'cleanUrl',
    user_reports: 'userReports',
    whitelist_status: 'whitelistStatus',
    wls: 'wls',
  };

  // Note: derived properties operate on the json passed to
  // Post.fromJson(). If the model is being updated with `.set` (voting uses this)
  // or it's being re-instanced after serializing on the server, we
  // will have the derived property, but we might not have all of the original
  // json the api returns. To handle this, we re-use the computed props when necessary.
  static DERIVED_PROPERTIES = {
    expandable(data) {
      if (data.expandable) {
        return data.expandable;
      }

      // If it has secure_media, or media, or selftext, it has expandable.
      return !!(
        (data.secure_media && data.secure_media.content) ||
        (data.media_embed && data.media_embed.content) ||
        (data.selftext_html)
      );
    },

    expandedContent(data) {
      if (data.expandedContent) {
        return data.expandedContent;
      }

      let content;

      content = (
        (data.secure_media_embed && data.secure_media_embed.content) ||
        (data.media_embed && data.media_embed.content)
      );

      if (!content && data.selftext_html) {
        content = data.selftext_html;
      }

      return content;
    },

    preview(data) {
      if (!data.promoted || data.preview) {
        return data.preview;
      }

      // we build fake preview data for ads and normal thumbnails
      const resolutions = [];

      if (data.mobile_ad_url) {
        resolutions.push({
          url: data.mobile_ad_url,
          height: 628,
          width: 1200,
        });
      }

      const thumbnail = cleanThumbnail(data.thumbnail);
      if (thumbnail) {
        resolutions.push({
          url: thumbnail,
          height: 140,
          width: 140,
        });
      }

      return {
        images: [{
          resolutions,
        }],
      };
    },

    thumbnail(data) {
      return cleanThumbnail(data.thumbnail);
    },

    crosspostParentObj(data) {
      // Note: ultimately we'll want to store this as a top level post in
      // the redux store and reference via crosspostIds.
      if (data.crosspostParentObj) {
        return data.crosspostParentObj;
      }
      if (data.crosspost_parent_list && data.crosspost_parent_list.length) {
        return data.crosspost_parent_list[0];
      }
      return null;
    },

    crosspostIds(data) {
      if (data.crosspostIds) {
        return data.crosspostIds;
      }
      if (data.crosspost_parent_list && data.crosspost_parent_list.length) {
        return data.crosspost_parent_list.map(post => post.name);
      }
      return null;
    },
  };

  reply (apiOptions, text) {
    return comment.post(apiOptions, {
      thingId: this.uuid,
      text,
    });
  }
}

votable(PostModel);
