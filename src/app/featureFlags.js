import Flags from '@r/flags';
import sha1 from 'crypto-js/sha1';
import url from 'url';
import {
  OPT_OUT_FLAGS,
  XPROMO_AD_FEED_TYPES,
  flags as flagConstants,
} from 'app/constants';
import {
  MODAL_EXPERIMENT_LIST as RULES_MODAL_EXPERIMENT_SUBREDDITS,
  XPROMO_EXCLUDE_LIST as RULES_XPROMO_SUBREDDITS,
} from 'app/subredditRulesList';
import getSubreddit from 'lib/getSubredditFromState';
import getRouteMetaFromState from 'lib/getRouteMetaFromState';
import getContentId from 'lib/getContentIdFromState';
import isFakeSubreddit from 'lib/isFakeSubreddit';
import { getDevice, IPHONE, ANDROID } from 'lib/getDeviceFromState';
import { trackBucketingEvents } from 'lib/eventUtils';
import {
  featureEnabled,
  extractUser,
  getExperimentData,
} from 'lib/experiments';

const {
  BETA,
  XPROMOBANNER,
  USE_BRANCH,
  BOTTOM_COMMENT_BANNER,
  MID_COMMENT_BANNER,
  // Recommended Content experiments
  VARIANT_NEXTCONTENT_BOTTOM,
  VARIANT_RECOMMENDED_BOTTOM,
  VARIANT_RECOMMENDED_TOP,
  VARIANT_RECOMMENDED_TOP_PLAIN,
  VARIANT_RECOMMENDED_BY_POST,
  VARIANT_RECOMMENDED_BY_POST_TOP_ALL,
  VARIANT_RECOMMENDED_BY_POST_TOP_DAY,
  VARIANT_RECOMMENDED_BY_POST_TOP_MONTH,
  VARIANT_RECOMMENDED_BY_POST_HOT,
  VARIANT_RECOMMENDED_SIMILAR_POSTS,
  VARIANT_SUBREDDIT_HEADER,
  VARIANT_TITLE_EXPANDO,
  VARIANT_MIXED_VIEW,
  SHOW_AMP_LINK,
  RULES_MODAL_ON_SUBMIT_CLICK_ANYWHERE,
  RULES_MODAL_ON_SUBMIT_CLICK_BUTTON,
  RULES_MODAL_ON_COMMENT_CLICK_ANYWHERE,
  RULES_MODAL_ON_COMMENT_CLICK_BUTTON,

  // Removing defaults experiment
  VARIANT_DEFAULT_SRS_TUTORIAL,
  VARIANT_DEFAULT_SRS_POPULAR,

  // Xpromo ----------------------------------------------------------------------
  // Login Required
  VARIANT_XPROMO_LOGIN_REQUIRED_IOS,
  VARIANT_XPROMO_LOGIN_REQUIRED_ANDROID,
  VARIANT_XPROMO_LOGIN_REQUIRED_IOS_CONTROL,
  VARIANT_XPROMO_LOGIN_REQUIRED_ANDROID_CONTROL,

  // Comments
  VARIANT_XPROMO_INTERSTITIAL_COMMENTS_IOS,
  VARIANT_XPROMO_INTERSTITIAL_COMMENTS_ANDROID,

  // Modal Listing Click
  XPROMO_MODAL_LISTING_CLICK_DAILY_DISMISSIBLE_IOS,
  XPROMO_MODAL_LISTING_CLICK_DAILY_DISMISSIBLE_ANDROID,

  // Interstitial frequency
  VARIANT_XPROMO_INTERSTITIAL_FREQUENCY_IOS,
  VARIANT_XPROMO_INTERSTITIAL_FREQUENCY_ANDROID,
  VARIANT_XPROMO_INTERSTITIAL_FREQUENCY_IOS_CONTROL,
  VARIANT_XPROMO_INTERSTITIAL_FREQUENCY_ANDROID_CONTROL,

  // Persistent Xpromo
  VARIANT_XPROMO_PERSISTENT_IOS,
  VARIANT_XPROMO_PERSISTENT_ANDROID,

  // XPromo Ad loading (preloader and Mobile App redirect button)
  VARIANT_XPROMO_AD_LOADING_IOS,
  VARIANT_XPROMO_AD_LOADING_ANDROID,

  // Call to action
  SHOW_CALL_TO_ACTION,

  // XPromo Ad Feed inside the Listing pages
  VARIANT_XPROMO_AD_FEED_IOS,
  VARIANT_XPROMO_AD_FEED_ANDROID,
} = flagConstants;

const config = {
  [BETA]: true,

  [XPROMOBANNER]: {
    and: [
      { notOptedOut: OPT_OUT_FLAGS },
      { allowedPages: ['index', 'listing', 'comments'] },
      { allowNSFW: false },
      { allowedDevices: [IPHONE, ANDROID] },
      { not: {
        subreddits: RULES_XPROMO_SUBREDDITS },
      },
    ],
  },
  [USE_BRANCH]: true,
  [BOTTOM_COMMENT_BANNER]: {
    url: 'mweb_comments_banner',
    and: [{
      variant: 'mweb_comments_banner:banner',
    }, {
      loggedin: false,
    }],
  },
  [MID_COMMENT_BANNER]: {
    url: 'mweb_comments_banner',
    and: [{
      variant: 'mweb_comments_banner:banner',
    }, {
      loggedin: false,
    }],
  },
  [VARIANT_NEXTCONTENT_BOTTOM]: {
    url: 'experimentnextcontentbottom',
    and: [{
      variant: 'nextcontent_mweb:bottom',
    }, {
      loggedin: false,
    }],
  },
  [VARIANT_RECOMMENDED_BOTTOM]: {
    url: 'experimentrecommendedbottom',
    and: [{
      variant: 'recommended_srs:bottom',
    }, {
      loggedin: false,
    }, {
      seoReferrer: true,
    }],
  },
  [VARIANT_RECOMMENDED_TOP]: {
    url: 'experimentrecommendedtop',
    and: [{
      variant: 'recommended_srs:top',
    }, {
      loggedin: false,
    }, {
      seoReferrer: true,
    }],
  },
  [VARIANT_RECOMMENDED_TOP_PLAIN]: {
    url: 'experimentrecommendedtopplain',
    and: [{
      variant: 'recommended_srs:plain_list_top',
    }, {
      loggedin: false,
    }, {
      seoReferrer: true,
    }],
  },
  [VARIANT_RECOMMENDED_BY_POST]: {
    url: 'experimentrecommendedposttosubreddits',
    and: [{
      loggedin: false,
    }, {
      variant: 'subreddits_by_post:sr_by_post',
    }],
  },
  [VARIANT_RECOMMENDED_BY_POST_TOP_ALL]: {
    url: 'experimentrecommendedposttosubredditstopoststopall',
    and: [{
      loggedin: false,
    }, {
      variant: 'subreddits_by_post:posts_by_sr_by_post_top_all',
    }],
  },
  [VARIANT_RECOMMENDED_BY_POST_TOP_DAY]: {
    url: 'experimentrecommendedposttosubredditstopoststopday',
    and: [{
      loggedin: false,
    }, {
      variant: 'subreddits_by_post:posts_by_sr_by_post_top_day',
    }],
  },
  [VARIANT_RECOMMENDED_BY_POST_TOP_MONTH]: {
    url: 'experimentrecommendedposttosubredditstopoststopmonth',
    and: [{
      loggedin: false,
    }, {
      variant: 'subreddits_by_post:posts_by_sr_by_post_top_month',
    }],
  },
  [VARIANT_RECOMMENDED_BY_POST_HOT]: {
    url: 'experimentrecommendedposttosubredditstopostshot',
    and: [{
      loggedin: false,
    }, {
      variant: 'subreddits_by_post:posts_by_sr_by_post_hot',
    }],
  },
  [VARIANT_RECOMMENDED_SIMILAR_POSTS]: {
    url: 'experimentrecommendedsimilarposts',
    and: [{
      loggedin: false,
    }, {
      variant: 'subreddits_by_post:similar_posts',
    }],
  },
  [VARIANT_SUBREDDIT_HEADER]: {
    url: 'experimentsubredditheader',
    and: [{
      variant: 'recommended_srs:sr_name_top',
    }, {
      loggedin: false,
    }, {
      seoReferrer: true,
    }],
  },
  [VARIANT_XPROMO_LOGIN_REQUIRED_IOS]: {
    and: [
      { loggedin: false },
      { allowedDevices: [IPHONE] },
      { allowedPages: ['index', 'listing'] },
      { or: [
        { url: 'xpromologinrequired' },
        { variant: 'mweb_xpromo_require_login_ios:login_required' },
      ] },
    ],
  },
  [VARIANT_XPROMO_LOGIN_REQUIRED_IOS_CONTROL]: {
    and: [
      { loggedin: false },
      { allowedDevices: [IPHONE] },
      { allowedPages: ['index', 'listing'] },
      { or: [
        { variant: 'mweb_xpromo_require_login_ios:control_1' },
        { variant: 'mweb_xpromo_require_login_ios:control_2' },
      ] },
    ],
  },
  [VARIANT_XPROMO_LOGIN_REQUIRED_ANDROID]: {
    and: [
      { loggedin: false },
      { allowedDevices: [ANDROID] },
      { allowedPages: ['index', 'listing'] },
      { or: [
        { url: 'xpromologinrequired' },
        { variant: 'mweb_xpromo_require_login_android:login_required' },
      ] },
    ],
  },
  [VARIANT_XPROMO_LOGIN_REQUIRED_ANDROID_CONTROL]: {
    and: [
      { loggedin: false },
      { allowedDevices: [ANDROID] },
      { allowedPages: ['index', 'listing'] },
      { or: [
        { variant: 'mweb_xpromo_require_login_android:control_1' },
        { variant: 'mweb_xpromo_require_login_android:control_2' },
      ] },
    ],
  },
  [VARIANT_XPROMO_INTERSTITIAL_FREQUENCY_IOS]: {
    and: [
      { allowedDevices: [IPHONE] },
      { or: [
        { variant: 'mweb_xpromo_interstitial_frequency_ios:every_day' },
        { variant: 'mweb_xpromo_interstitial_frequency_ios:every_three_days' },
        { variant: 'mweb_xpromo_interstitial_frequency_ios:every_week' },
        { variant: 'mweb_xpromo_interstitial_frequency_ios:every_two_weeks' },
      ] },
    ],
  },
  [VARIANT_XPROMO_INTERSTITIAL_FREQUENCY_ANDROID]: {
    and: [
      { allowedDevices: [ANDROID] },
      { or: [
        { variant: 'mweb_xpromo_interstitial_frequency_android:every_day' },
        { variant: 'mweb_xpromo_interstitial_frequency_android:every_three_days' },
        { variant: 'mweb_xpromo_interstitial_frequency_android:every_week' },
        { variant: 'mweb_xpromo_interstitial_frequency_android:every_two_weeks' },
      ] },
    ],
  },
  [VARIANT_XPROMO_INTERSTITIAL_FREQUENCY_IOS_CONTROL]: {
    and: [
      { allowedDevices: [IPHONE] },
      { or: [
        { variant: 'mweb_xpromo_interstitial_frequency_ios:control_1' },
        { variant: 'mweb_xpromo_interstitial_frequency_ios:control_2' },
      ] },
    ],
  },
  [VARIANT_XPROMO_INTERSTITIAL_FREQUENCY_ANDROID_CONTROL]: {
    and: [
      { allowedDevices: [ANDROID] },
      { or: [
        { variant: 'mweb_xpromo_interstitial_frequency_android:control_1' },
        { variant: 'mweb_xpromo_interstitial_frequency_android:control_2' },
      ] },
    ],
  },
  [VARIANT_XPROMO_PERSISTENT_IOS]: {
    and: [
      { allowedDevices: [IPHONE] },
      { allowedPages: ['index', 'listing', 'comments'] },
      { not: { or: [
        { peak: 'mweb_xpromo_modal_listing_click_daily_dismissible_ios' },
        { peak: 'mweb_xpromo_require_login_ios' },
      ]}},
      { or: [
        { url: 'xpromopersistent' },
        { variant: 'mweb_xpromo_persistent_ios:treatment' },
      ] },
    ],
  },
  [VARIANT_XPROMO_PERSISTENT_ANDROID]: {
    and: [
      { allowedDevices: [ANDROID] },
      { allowedPages: ['index', 'listing', 'comments'] },
      { not: { or: [
        { peak: 'mweb_xpromo_modal_listing_click_daily_dismissible_android' },
        { peak: 'mweb_xpromo_require_login_android' },
      ]}},
      { or: [
        { url: 'xpromopersistent' },
        { variant: 'mweb_xpromo_persistent_android:treatment' },
      ] },
    ],
  },
  [VARIANT_XPROMO_INTERSTITIAL_COMMENTS_IOS]: {
    and: [
      { allowedDevices: [IPHONE] },
      { allowNSFW: false },
      { allowedPages: ['comments'] },
      { or: [
        { url: 'xpromointerstitialcomments' },
        { enabled: 'mweb_xpromo_interstitial_comments_ios' },
      ] },
    ],
  },
  [VARIANT_XPROMO_INTERSTITIAL_COMMENTS_ANDROID]: {
    and: [
      { allowedDevices: [ANDROID] },
      { allowNSFW: false },
      { allowedPages: ['comments'] },
      { or: [
        { url: 'xpromointerstitialcomments' },
        { enabled: 'mweb_xpromo_interstitial_comments_android' },
      ] },
    ],
  },
  [XPROMO_MODAL_LISTING_CLICK_DAILY_DISMISSIBLE_IOS]: {
    and: [
      { notOptedOut: OPT_OUT_FLAGS },
      { allowedDevices: [IPHONE] },
      { allowNSFW: false },
      { allowedPages: ['index', 'listing'] },
      { enabled: 'mweb_xpromo_modal_listing_click_daily_dismissible_ios' },
    ],
  },

  [XPROMO_MODAL_LISTING_CLICK_DAILY_DISMISSIBLE_ANDROID]: {
    and: [
      { notOptedOut: OPT_OUT_FLAGS },
      { allowedDevices: [ANDROID] },
      { allowNSFW: false },
      { allowedPages: ['index', 'listing'] },
      { enabled: 'mweb_xpromo_modal_listing_click_daily_dismissible_android' },
    ],
  },

  [VARIANT_XPROMO_AD_LOADING_IOS]: {
    and: [
      { notOptedOut: OPT_OUT_FLAGS },
      { allowedDevices: [IPHONE] },
      { allowedPages: ['index', 'listing', 'comments'] },
      { or: [
        { variant: 'mweb_xpromo_ad_loading_ios:treatment' },
      ]},
    ],
  },
  [VARIANT_XPROMO_AD_LOADING_ANDROID]: {
    and: [
      { notOptedOut: OPT_OUT_FLAGS },
      { allowedDevices: [ANDROID] },
      { allowedPages: ['index', 'listing', 'comments'] },
      { or: [
        { variant: 'mweb_xpromo_ad_loading_android:treatment' },
      ]},
    ],
  },

  [VARIANT_XPROMO_AD_FEED_IOS]: {
    and: [
      { notOptedOut: OPT_OUT_FLAGS },
      { allowedDevices: [IPHONE] },
      { allowedPages: ['index', 'listing'] },
      { or: [
        { variant: `mweb_xpromo_ad_feed_ios:${XPROMO_AD_FEED_TYPES.LISTING_BIG}` },
        { variant: `mweb_xpromo_ad_feed_ios:${XPROMO_AD_FEED_TYPES.LISTING_SMALL}` },
      ]},
    ],
  },
  [VARIANT_XPROMO_AD_FEED_ANDROID]: {
    and: [
      { notOptedOut: OPT_OUT_FLAGS },
      { allowedDevices: [ANDROID] },
      { allowedPages: ['index', 'listing'] },
      { or: [
        { variant: `mweb_xpromo_ad_feed_android:${XPROMO_AD_FEED_TYPES.LISTING_BIG}` },
        { variant: `mweb_xpromo_ad_feed_android:${XPROMO_AD_FEED_TYPES.LISTING_SMALL}` },
      ]},
    ],
  },
  [VARIANT_TITLE_EXPANDO]: {
    and: [
      { compact: true},
      { or: [
          { url: 'titleexpando' },
          { variant: 'mweb_post_title_expando:active' },
      ] },
    ],
  },
  [VARIANT_MIXED_VIEW]: {
    and: [
      { compact: false },
      { or: [
        { variant: 'mweb_mixed_view:active'},
        { url: 'mixedview'},
      ] },
    ],
  },
  [SHOW_AMP_LINK]: true,
  [VARIANT_DEFAULT_SRS_TUTORIAL]: {
    url: 'experimentdefaultsrstutorial',
    and: [{
      loggedin: true,
    }, {
      variant: 'default_srs_holdout:tutorial',
    }],
  },
  [VARIANT_DEFAULT_SRS_POPULAR]: {
    url: 'experimentdefaultsrspopular',
    and: [{
      loggedin: true,
    }, {
      variant: 'default_srs_holdout:popular',
    }],
  },
  [SHOW_CALL_TO_ACTION]: {
    and: [
      { employee: true },
    ],
  },
  [RULES_MODAL_ON_SUBMIT_CLICK_ANYWHERE]: {
    and: [
      { allowedPages: ['submit'] },
      { subreddits: RULES_MODAL_EXPERIMENT_SUBREDDITS },
      { loggedin: true },
      { isMod: false },
      { or: [
        { url: 'rulesmodalonsubmitclickanywhere' },
        { variant: 'mweb_rules_modal_on_submit:click_anywhere' },
      ] },
    ],
  },
  [RULES_MODAL_ON_SUBMIT_CLICK_BUTTON]: {
    and: [
      { allowedPages: ['submit'] },
      { loggedin: true },
      { isMod: false },
      { subreddits: RULES_MODAL_EXPERIMENT_SUBREDDITS },
      { or: [
        { url: 'rulesmodalonsubmitclickbutton' },
        { variant: 'mweb_rules_modal_on_submit:click_button' },
      ] },
    ],
  },
  [RULES_MODAL_ON_COMMENT_CLICK_ANYWHERE]: {
    and: [
      { allowedPages: ['comments'] },
      { loggedin: true },
      { isMod: false },
      { subreddits: RULES_MODAL_EXPERIMENT_SUBREDDITS },
      { or: [
        { url: 'rulesmodaloncommentclickanywhere' },
        { variant: 'mweb_rules_modal_on_comment:click_anywhere' },
      ] },
    ],
  },
  [RULES_MODAL_ON_COMMENT_CLICK_BUTTON]: {
    and: [
      { allowedPages: ['comments'] },
      { loggedin: true },
      { isMod: false },
      { subreddits: RULES_MODAL_EXPERIMENT_SUBREDDITS },
      { or: [
        { url: 'rulesmodaloncommentclickbutton' },
        { variant: 'mweb_rules_modal_on_comment:click_button' },
      ] },
    ],
  },
};

const flags = new Flags(config);
const SEO_REFERRERS = [
  'google.com',
  'bing.com',
];

flags.addRule('loggedin', function(val) {
  return (
    !!this.state.user &&
    !this.state.user.loggedOut &&
    this.state.user.user_name
  ) === val;
});

flags.addRule('users', function(users) {
  const user = extractUser(this);
  return users.includes(user.name);
});

flags.addRule('employee', function(val) {
  const user = extractUser(this.state);
  return user && user.isEmployee === val;
});

flags.addRule('admin', function(val) {
  return extractUser(this).is_admin === val;
});

flags.addRule('beta', function(val) {
  return extractUser(this).is_beta === val;
});

flags.addRule('url', function(query) {
  // turns { feature_thing: true, wat: 7 } into { thing: true }
  const parsedQuery = Flags.parseConfig(this.state.platform.currentPage.queryParams);
  return Object.keys(parsedQuery).includes(query);
});

flags.addRule('compact', function(val) {
  return this.state.compact === val;
});

flags.addRule('subreddit', function (name) {
  const subreddit = getSubreddit(this.state);
  if (!subreddit) {
    return false;
  }

  return subreddit.toLowerCase() === name.toLowerCase();
});

flags.addRule('subreddits', function (subredditNames) {
  const subreddit = getSubreddit(this.state);
  if (!subreddit) {
    return false;
  }

  return subredditNames.map(n => n.toLowerCase()).includes(subreddit.toLowerCase());
});

flags.addRule('isMod', function(val) {
  let userIsMod = false;
  const subreddit = getSubreddit(this.state);
  const moderatingSubreddits = this.state.moderatingSubreddits;
  if (subreddit && moderatingSubreddits && moderatingSubreddits.names) {
    const names = moderatingSubreddits.names.map(n => n.toLowerCase());
    userIsMod = names.includes(subreddit.toLowerCase());
  }
  return userIsMod === val;
});

flags.addRule('peak', function(experimentName) {
  const experimentData = getExperimentData(this.state, experimentName);
  if (!experimentData) {
    return false;
  }

  const { variant } = experimentData;
  const result = (variant && variant !== 'control_1' && variant !== 'control_2');
  return result;
});

flags.addRule('variant', function (name) {
  const [experiment_name, checkedVariant] = name.split(':');
  const experimentData = getExperimentData(this.state, experiment_name);

  if (experimentData) {
    const { variant } = experimentData;
    const firstBuckets = this.state.xpromo.serverSide.firstBuckets;
    const isNotFiredOnServer = (firstBuckets.indexOf(experiment_name)<0);

    // Here the "trackBucketingEvents" should be fired only on the Client Side
    // For the Server Side it's better to run "trackBucketingEvents" manually
    // And of course we need to be shure that this event is not fired twice
    // (both on the Client and Server sides)
    if (this.state.meta.env === 'CLIENT' && isNotFiredOnServer) {
      trackBucketingEvents(this.state, experimentData);
    }
    return variant === checkedVariant;
  }
  return false;
});

flags.addRule('enabled', function(featureName) {
  return featureEnabled(this.state, featureName);
});

// need to keep this function format (not arrow format) to protect
// the value of 'this'
flags.addRule('seoReferrer', function (wantSEO) {
  // Make sure we have a referrer and from the outside
  const referrer = this.state.platform.currentPage.referrer;
  if (!referrer || !referrer.startsWith('http')) {
    return !wantSEO;
  }

  // Check if the referrer matches the list of hostnames
  const referrerHostname = url.parse(referrer).hostname;
  const isSEO = SEO_REFERRERS.some(seo => {
    return referrerHostname.indexOf(seo) !== -1;
  });

  // Compare if we want the user to be from SEO or not
  return (isSEO === wantSEO);
});

flags.addRule('directVisit', function (wantDirect) {
  const referrer = this.state.platform.currentPage.referrer;

  // TODO: We end up adding the initial page to the history twice, once due to
  // the platform SET_STATUS action and once due to the SET_PAGE action.
  const isDirect = !referrer && this.state.platform.history.length <= 2;

  return isDirect === wantDirect;
});

flags.addRule('allowedPages', function (allowedPages) {
  const routeMeta = getRouteMetaFromState(this.state);
  const actionName = routeMeta && routeMeta.name;
  return allowedPages.includes(actionName);
});

// This returns false when no loidCreated value is present, but it should
// really be used in conjunction with a loggedin: false rule, in which case we
// expect to have an loidCreated value.
flags.addRule('minLoidAge', function (minAge) {
  const loidCreated = this.state.accounts.me && this.state.accounts.me.loidCreated;

  if (!loidCreated) {
    return false;
  }

  const age = (new Date()) - (new Date(loidCreated));
  if (age < minAge) { return false; }

  return true;
});

flags.addRule('allowedDevices', function (allowed) {
  const device = getDevice(this.state);
  // If we don't know what device we're on, then we should not match any list
  // of allowed devices.
  return (!!device) && allowed.includes(device);
});

// NOTE it is applyable for:
// - string (value of STORE_KEY key)
// - array of objects with STORE_KEY keys
flags.addRule('notOptedOut', function (flagOrFlags) {
  if (this.state.optOuts) {
    if (typeof flagOrFlags === 'string') {
      return !(this.state.optOuts[flagOrFlags]);
    }
    return !(flagOrFlags.find((item={}) => {
      return !!this.state.optOuts[item.STORE_KEY];
    }));
  }
  return false;
});

// NOTE (prashant.singh - 07 November 2016): This is interim functionality to
// allow simple feature flagging for a percentage of pages. It should not be
// used for true page or user experiments.
// Bucket pages based on content ID, using granularity of 1/10th of a percent.
flags.addRule('pageBucketPercent', function(config) {
  const { seed, percentage } = config;
  const contentId = getContentId(this.state);
  const hashed = sha1(`${seed}${contentId}`).toString();

  // hashed is a 160-bit number expressed as a hex string.
  // We want to find (hashed % 1000), so we can map the hash to bucket sizes
  // with 0.1% granularity. We can't work directly with 160-bit values as
  // JavaScript Numbers, so we compute the modulo in pieces.
  // piece3 is the most significant 10 hex digits (40 bits) of the 160-bit
  // value `hashed` (left shift of 120 bits).
  // piece2 is the 10 next most significant hex digits of hashed (left shift of
  // 80 bits).
  // and so on for piece1 and piece0.
  const piece3 = parseInt(hashed.slice(0,10), 16);
  const piece2 = parseInt(hashed.slice(10,20), 16);
  const piece1 = parseInt(hashed.slice(20,30), 16);
  const piece0 = parseInt(hashed.slice(30,40), 16);
  // So hashed = piece3 * 2^120 + piece2 * 2^80 + piece1 * 2^40 + piece1 * 2^0.
  // And hashed mod 1000 =
  // (((piece3 mod 1000) * (2^120 mod 1000) mod 1000) +
  //  ((piece2 mod 1000) * (2^80 mod 1000) mod 1000) +
  //  ((piece1 mod 1000) * (2^40 mod 1000) mod 1000) +
  //  (piece0 mod 1000)) mod 1000
  // 2^120 mod 1000 = 576
  // 2^80 mod 1000 = 176
  // 2^40 mod 1000 = 776
  const val =
    (((piece3 % 1000)*576 % 1000) +
      ((piece2 % 1000)*176 % 1000) +
      ((piece1 % 1000)*776 % 1000) +
      (piece0 % 1000)
    ) % 1000;

  return val <= 10 * percentage;
});

flags.addRule('allowNSFW', function(allowed) {
  if (allowed) {
    return true;
  }

  return !isNSFWPage(this.state);
});

/**
 * @param {object} state - redux state of the application
 * @returns {boolean} isNSFWPage, is true if the current page is NSFW
 * A page is NSFW when:
 *  or:
 *  | The subreddit for this page is NSFW. e.g. if you're on a listing of r/NSFW
 *  | The post for this page (comments page) is NSFW (i.e. a NSFW post on a SFW subreddit)
 * NOTE: this function only return true if we have enough data to make this decision
 * IF this function returns false, without having enough data, we might
 * trigger a bucketing event that we don't actually want to trigger (i.e.
 *  - load a NSFW listing page
 *  - return false by default
 *  - check the user's experiment variant (fires a bucketing event, because we're bucketed)
 *  - receive subreddit
 *  - feature flag recalculates, and says the page is NSFW
 *    (we now know that we shouldn't even check the user's experiment variant,
 *    but we've already issued a bucketing event!!)
 * )
 */
export const isNSFWPage = state => {
  const subredditName = getSubreddit(state);
  const postId = state.platform.currentPage.urlParams.postId;

  // no-op
  if (!subredditName && !postId) {
    return false;
  }

  if (subredditName) {
    const subreddit = state.subreddits[subredditName.toLowerCase()];
    if (subreddit && subreddit.over18) {
      return true;
    }

    // IF there wasn't a subreddit (or its fake), and we don't need to lookup
    // the post (comments pages), we're all set
    if ((subreddit || isFakeSubreddit(subredditName)) && !postId) {
      return false;
    }
  }

  // When there's a postId in the url, check it
  if (postId) {
    const post = state.posts[`t3_${postId}`];
    if (!post) {
      // We need to check the post before deciding its Safe
      return true;
    }

    // The url doesn't always have a subreddit name, so let's check the
    // posts' subreddit just in case
    if (post.subredditName) {
      const postSubreddit = state.posts[post.subredditName];
      if (postSubreddit && postSubreddit.over18) {
        return true;
      }
    }

    // Otherwise use the post over18 flag
    return post.over18;
  }

  // Return true by default to prevent misfiring
  return true;
};

export default flags;
