import './styles.less';
import React from 'react';
import URL from 'url';

import PostModel from 'apiClient/models/PostModel';
import mobilify from 'lib/mobilify';
import gifToHTML5Sources, { posterForHrefIfGiphyCat } from 'lib/gifToHTML5Sources';

import EditForm from 'app/components/EditForm';
import RedditLinkHijacker from 'app/components/RedditLinkHijacker';
import OutboundLink from 'app/components/OutboundLink';

import { flags, LISTING_CLICK_TYPES } from 'app/constants';
import features from 'app/featureFlags';

import HTML5StreamPlayer from 'app/components/HTML5StreamPlayer';

import {
  isPostNSFW,
  cleanPostDomain,
  cleanPostHREF,
} from '../postUtils';

import {
  limitAspectRatio,
  aspectRatioClass,
  findPreviewImage,
  findPreviewVideo,
  DEFAULT_ASPECT_RATIO,
} from '../mediaUtils';

const T = React.PropTypes;

class LinkDescriptor {
  constructor(url, outbound) {
    this.url = url;
    this.outbound = outbound;
  }
}

const {
  VARIANT_CALL_TO_ACTION,
} = flags;

// PostContent is used to render:
//  * Post thumbnail, if there is one
//  * Post Preview/Link Bar (includes playable gif / video / gallery etc)

PostContent.propTypes = {
  post: T.instanceOf(PostModel),
  compact: T.bool.isRequired,
  single: T.bool.isRequired,
  onTapExpand: T.func.isRequired,
  expandedCompact: T.bool.isRequired,
  width: T.number.isRequired,
  toggleShowNSFW: T.func.isRequired,
  togglePlaying: T.func.isRequired,
  showNSFW: T.bool.isRequired,
  showSpoilers: T.bool.isRequired,
  editing: T.bool,
  editPending: T.bool,
  onToggleEdit: T.func.isRequired,
  onUpdateSelftext: T.func.isRequired,
  onUpdatePostPlaytime: T.func.isRequired,
  forceHTTPS: T.bool.isRequired,
  isDomainExternal: T.bool.isRequired,
  renderMediaFullbleed: T.bool.isRequired,
  isThumbnail: T.bool.isRequired,
  isPlaying: T.bool,
  interceptListingClick: T.func.isRequired,
};

PostContent.defaultProps = {
  editing: false,
  editPending: false,
  isPlaying: false,
};

export default function PostContent(props) {
  const { post, isDomainExternal, compact, isThumbnail, interceptListingClick,
          renderMediaFullbleed, showLinksInNewTab } = props;
  const linkUrl = cleanPostHREF(mobilify(post.cleanUrl));
  const linkDescriptor = new LinkDescriptor(linkUrl, true);
  const mediaContentNode = buildMediaContent(post, linkDescriptor, props);
  const selftextNode = buildSelfTextContent(props);
  if (!mediaContentNode && !selftextNode) {
    if (!isDomainExternal || compact) {
      // When in compact mode, the PostHeader Component is responsible for rendering
      // outbound links. But when in list mode, we are, so make sure we render
      // the linkbar to outbound links if needed.
      return null;
    }
  }

  return (
    <div
      className={ `PostContent ${isThumbnail ? 'size-compact' : 'size-default'}` }
      onClick={ e => interceptListingClick(e, LISTING_CLICK_TYPES.CONTENT) }
    >
      { renderMediaContent(mediaContentNode, isThumbnail, isDomainExternal,
                           cleanPostDomain(post.domain), linkUrl,
                           renderMediaFullbleed, showLinksInNewTab,
                           post.outboundLink, post.promoted, post.callToAction) }
      { selftextNode }
    </div>
  );
}

function renderMediaContent(mediaContentNode, isThumbnail, isDomainExternal,
                            linkDisplayText, linkUrl, renderMediaFullbleed,
                            showLinksInNewTab, outboundLink, promoted, callToAction) {
  if (isThumbnail || !isDomainExternal || renderMediaFullbleed) {
    return mediaContentNode;
  }
  
  return (
    <div className='PostContent__media-wrapper'>
      { mediaContentNode }
      { !(features.enabled(VARIANT_CALL_TO_ACTION) && callToAction) && renderLinkBar(linkDisplayText, linkUrl,
                      showLinksInNewTab, outboundLink, promoted) }
    </div>
  );
}

function buildSelfTextContent(props) {
  const { single, editing, post } = props;
  if (!single) { return; }

  if (editing) {
    return renderTextEditor(post.selfTextMD, props);
  }

  if (!post.selfTextHTML) { return; }

  const mobileSelfText = mobilify(post.selfTextHTML);
  return (
    <RedditLinkHijacker>
      <div
        className='PostContent__selftext'
        dangerouslySetInnerHTML={ { __html: mobileSelfText } }
      />
    </RedditLinkHijacker>
  );
}

function renderTextEditor(rawMarkdown, props) {
  const { editPending, onToggleEdit, onUpdateSelftext } = props;

  return (
    <EditForm
      startingText={ rawMarkdown }
      editPending={ editPending }
      onCancelEdit={ onToggleEdit }
      onSaveEdit={ onUpdateSelftext }
    />
  );
}


function buildMediaContent(post, linkDescriptor, props) {
  const { isPlaying, isThumbnail, single, width, showNSFW, onTapExpand,
          interceptListingClick, togglePlaying, showSpoilers } = props;
  const oembed = post.media ? post.media.oembed : null;

  if (isThumbnail && !(post.preview || oembed)) {
    return null; // Compact mode only renders thumbnails _if_ there's a preview
  }

  const isNSFW = isPostNSFW(post);
  const isSpoiler = post.spoiler;
  const needsObfuscating = showObfuscated(isNSFW, isSpoiler, showNSFW, showSpoilers);
  const playableType = postToPlayableType(post);
  const sourceURL = optimizeContent(post);

  let previewImage;
  if (post.preview || oembed) {
    previewImage = findPreviewImage(
      isThumbnail, post.preview, post.thumbnail, oembed, width, needsObfuscating);
  }

  // if we got a preview image that's a gif, convert it to a still image if possible
  if (previewImage && previewImage.url) {
    const html5VideoSources = gifToHTML5Sources(previewImage.url);
    if (html5VideoSources && html5VideoSources.poster) {
      previewImage.url = html5VideoSources.poster;
    }
  }

  let callOnTapExpand;
  if (post.promoted && !post.isSelf) {
    // ads without self text should go to the url instead of expando
    callOnTapExpand = null;
  } else {
    callOnTapExpand = e => {
      if (interceptListingClick(e, LISTING_CLICK_TYPES.CONTENT)) {
        return;
      }

      e.preventDefault();
      const clickTarget = 'thumbnail';
      onTapExpand(clickTarget);
      if (playableType !== PLAYABLE_TYPE.NOT_PLAYABLE) {
        togglePlaying();
      }
    };
  }

  if (isThumbnail && previewImage && previewImage.url) {
    return renderImage(previewImage, sourceURL, linkDescriptor, callOnTapExpand,
                       needsObfuscating, playableType, props);
  }

  // handles:
  //  * image preview of playabe image / video
  //  * a gif that we're playing ourselves with html5 video or inline
  if (playableType !== PLAYABLE_TYPE.NOT_PLAYABLE && previewImage &&
      useOurOwnPlayingOrPreviewing(oembed, sourceURL, isPlaying)) {
    const togglePlay = e => {
      if (interceptListingClick(e, LISTING_CLICK_TYPES.CONTENT)) {
        return;
      }

      e.preventDefault();
      if (isNSFW || isSpoiler) {
        props.toggleShowNSFW();
      }
      togglePlaying();
    };
    return buildImagePreview(previewImage, sourceURL, linkDescriptor,
                             togglePlay, needsObfuscating, playableType, props);
  }

  if (oembed) {
    return buildMediaPreview(post, sourceURL, oembed, single);
  }

  if (previewImage || (post.media && post.media.reddit_video)) {
    const callback = (isNSFW || isSpoiler) ? e => {
      if (interceptListingClick(e, LISTING_CLICK_TYPES.CONTENT)) {
        return;
      }

      e.preventDefault();
      props.toggleShowNSFW();
    } : null;
    return buildImagePreview(previewImage, sourceURL, linkDescriptor, callback,
                             needsObfuscating, playableType, props);
  }
}


function buildImagePreview(previewImage, imageURL, linkDescriptor, callback,
                           needsObfuscating, playableType, props) {

  const { single, isPlaying, post } = props;

  if (isPlaying || !needsObfuscating) {
    //locally hosted video
    if (post.media && post.media.reddit_video) {
      const { width, height } = post.media.reddit_video;
      const aspectRatio = getAspectRatio(single, width, height);

      const generatedSrc = {
        dash: post.media.reddit_video.dash_url,
        hls: post.media.reddit_video.hls_url,
        scrubberThumbSource: post.media.reddit_video.scrubber_media_url,
        isGif: post.media.reddit_video.is_gif,
        width: width,
        height: height,
      };
      return renderVideo(generatedSrc, previewImage, aspectRatio, props);
    }

    const html5sources = gifToHTML5Sources(imageURL, previewImage.url);
    if (isPlaying && html5sources) {
      const { width, height } = previewImage;
      const aspectRatio = getAspectRatio(single, width, height);

      if (html5sources.iframe) {
        return renderIframe(html5sources.iframe, aspectRatio);
      }

      const generatedSrc = {
        webm: html5sources.webm,
        mp4: html5sources.mp4,
        width: previewImage.width,
        height: previewImage.height,
      };

      return renderVideo(generatedSrc, html5sources.poster, aspectRatio, props);
    }
  }

  return renderImage(previewImage, imageURL, linkDescriptor, callback,
    needsObfuscating, playableType, props);
}

function buildMediaPreview(post, sourceURL, oembed, single) {
  const aspectRatio = getAspectRatio(single, oembed.width, oembed.height);

  switch (oembed.type) {
    case 'image':
      return renderIframe(sourceURL, aspectRatio);
    case 'video':
      return renderRawHTML(post.expandedContent, aspectRatio);
    case 'rich':
      return renderRichOembed(oembed.html, aspectRatio);
  }
}

function renderRichOembed(oembedHtml, aspectRatio) {
  const findSrc = oembedHtml.match(/src="([^"]*)/);

  if (findSrc && findSrc[1]) {
    const frameUrl = findSrc[1].replace('&amp;', '&');
    return renderIframe(frameUrl, aspectRatio);
  }
}

function renderImage(previewImage, imageURL, linkDescriptor, onClick,
                     needsObfuscating, playableType, props) {
  const { isThumbnail, single, showLinksInNewTab,
          post, forceHTTPS, isPlaying } = props;
  let playbackControlNode;
  if (playableType && !needsObfuscating) {
    playbackControlNode = renderPlaybackIcon(playableType, isThumbnail);
  }

  let obfuscatedNode;
  if (needsObfuscating) {
    obfuscatedNode = renderWarning(isThumbnail, post);
  }

  const linkTarget = showLinksInNewTab ? '_blank' : null;

  if ((previewImage === null || previewImage === undefined) && post.media && post.media.reddit_video) {
    //Ensure reddit_videos receive a nsfw image even if no poster image available.
    return renderImageWithAspectRatio(null, imageURL, linkDescriptor,
                                    aspectRatio, onClick, isThumbnail,
                                    playbackControlNode, obfuscatedNode, linkTarget,
                                    post.outboundLink, forceHTTPS, isPlaying, post.promoted);
  }

  const aspectRatio = getAspectRatio(single, previewImage.width,
                                     previewImage.height);

  if (previewImage && previewImage.url && !aspectRatio) {
    return renderImageOfUnknownSize(
      previewImage.url, linkDescriptor, onClick, playbackControlNode,
      obfuscatedNode, linkTarget, post.outboundLink, post.promoted);
  }
  return renderImageWithAspectRatio(previewImage, imageURL, linkDescriptor,
                                    aspectRatio, onClick, isThumbnail,
                                    playbackControlNode, obfuscatedNode, linkTarget,
                                    post.outboundLink, forceHTTPS, isPlaying, post.promoted);
}

function baseImageLinkClass(imageUrl, isObfuscated) {
  return `PostContent__image-link ${isObfuscated && !imageUrl ? 'placeholder' :''}`;
}

function renderImageOfUnknownSize(imageURL, linkDescriptor, onClick,
                                  playbackControlNode, obfuscatedNode, linkTarget,
                                  outboundLink, promoted) {
  const linkClass = baseImageLinkClass(imageURL, !!obfuscatedNode);
  return (
    <OutboundLink
      className={ linkClass }
      href={ linkDescriptor.url }
      target={ linkTarget }
      onClick={ onClick }
      outboundLink={ outboundLink }
      promoted={ promoted }
    >
      <img className='PostContent__image-img' src={ imageURL } />
      { playbackControlNode }
      { obfuscatedNode }
    </OutboundLink>
  );
}


function renderImageWithAspectRatio(previewImage, imageURL, linkDescriptor,
                                    aspectRatio, onClick, isThumbnail,
                                    playbackControlNode, obfuscatedNode, linkTarget,
                                    outboundLink, forceHTTPS, isPlaying, promoted) {

  const style = {};

  if (previewImage && previewImage.url && !isPlaying) {
    const giphyPosterHref = posterForHrefIfGiphyCat(imageURL);
    const backgroundImage = giphyPosterHref && !obfuscatedNode ?
      giphyPosterHref : previewImage.url;
    style.backgroundImage = `url("${forceProtocol(backgroundImage, forceHTTPS)}")`;
  }
  let linkClass = baseImageLinkClass(previewImage ? previewImage.url : null, !!obfuscatedNode);
  if (!isThumbnail) {
    linkClass += ` ${aspectRatioClass(aspectRatio)}`;
  }

  return (
    <OutboundLink
      className={ linkClass }
      href={ linkDescriptor.url }
      target={ linkTarget }
      onClick={ onClick }
      style={ style }
      outboundLink={ outboundLink }
      promoted={ promoted }
    >
      { isPlaying
        ? <img className='PostContent__inline-gif' src={ imageURL } />
        : playbackControlNode }
      { obfuscatedNode }
    </OutboundLink>
  );
}

function renderIframe(src, aspectRatio) {
  return (
    <div className={ `PostContent__iframe-wrapper ${aspectRatioClass(aspectRatio)}` } >
      <iframe
        className='PostContent__iframe'
        src={ src }
        frameBorder='0'
        allowFullScreen=''
        sandbox='allow-scripts allow-forms allow-same-origin allow-popups'
      />
    </div>
  );
}

function renderVideo(videoSpec, posterImage, aspectRatio, props) {
  const { post, onUpdatePostPlaytime } = props;
  if (videoSpec.hls || videoSpec.dash) {
    //video limited to 16:9 as specced, will be letterboxed if different reservation.
    let aspectRatio;
    if ((videoSpec.width / videoSpec.height) < (16 / 9)) {
      aspectRatio = getAspectRatio(false, 16, 9);
    } else {
      aspectRatio = getAspectRatio(false, videoSpec.width, videoSpec.height);
    }

    return (
      <HTML5StreamPlayer
        postData = { post }
        onUpdatePostPlaytime = { onUpdatePostPlaytime }
        aspectRatioClassname = { aspectRatioClass(aspectRatio) }
        hlsSource = { videoSpec.hls }
        mpegDashSource = { videoSpec.dash }
        isGif = { videoSpec.isGif }
        isVertical = { (videoSpec.height > videoSpec.width) }
        posterImage = { (posterImage !== null && posterImage !== undefined) ? posterImage.url : null }
        scrubberThumbSource = { videoSpec.scrubberThumbSource }
      />
    );
  }

  return (
    <div className={ `PostContent__video-wrapper ${aspectRatioClass(aspectRatio)}` } >
      <video
        className='PostContent__video'
        poster={ posterImage }
        loop='true'
        muted='true'
        controls='true'
        autoPlay='true'
        ref={ autoPlayGif }
      >
        { buildVideoSources(videoSpec) }
      </video>
    </div>
  );
}


function buildVideoSources(videoSpec) {
  const sources = [];
  ['mp4', 'webm'].forEach(function(videoType) {
    const source = videoSpec[videoType];
    if (source) {
      sources.push(
        <source
          key={ `video-src-${videoType}` }
          type={ `video/${videoType}` }
          src={ source }
        />
      );
    }
  });

  return sources;
}

function renderRawHTML(htmlContent, aspectRatio) {
  return (
    <RedditLinkHijacker>
      <div
        className={ `PostContent__html ${aspectRatioClass(aspectRatio)}` }
        dangerouslySetInnerHTML={ { __html: htmlContent } }
      />
    </RedditLinkHijacker>
  );
}

function renderPlaybackIcon(playableType, isThumbnail) {
  if (playableType === PLAYABLE_TYPE.NOT_PLAYABLE) {
    return;
  }

  let iconCls = 'PostContent__playback-action-icon darkgrey';

  if (playableType === PLAYABLE_TYPE.GALLERY) {
    iconCls += ' icon icon-gallery_squares';
  } else if (playableType === PLAYABLE_TYPE.INLINE) {
    iconCls += ' icon icon-play_triangle';
  }

  const modifierClass = isThumbnail ? 'compact' : 'regular';
  const buttonCls = `PostContent__playback-action-circle  ${modifierClass}`;

  return (
    <div className={ buttonCls }>
      <span className={ iconCls } />
    </div>
  );
}


function renderLinkBar(displayText, href, showLinksInNewTab, outboundLink, promoted) {
  const target = showLinksInNewTab ? '_blank' : null;

  return (
    <OutboundLink
      className='PostContent__link-bar'
      href={ href }
      target={ target }
      outboundLink={ outboundLink }
      promoted={ promoted }
    >
      <span className='PostContent__link-bar-text'>{ displayText }</span>
      <span className='PostContent__link-bar-icon icon icon-linkout blue' />
    </OutboundLink>
  );
}

function renderWarning(isThumbnail, post) {
  if (isThumbnail) {
    return (
      <div className='PostContent__warning' />
    );
  }

  let obfuscationText;
  if (isPostNSFW(post) && post.spoiler) {
    obfuscationText = 'NSFW and as a spoiler';
  } else if (isPostNSFW(post)) {
    obfuscationText = 'NSFW';
  } else if (post.spoiler) {
    obfuscationText = 'a spoiler';
  }

  return (
    <div className='PostContent__warning'>
      <p className='PostContent__warning-text'>This post is marked as { obfuscationText }</p>
      <p className='PostContent__warning-button'>Show Post?</p>
    </div>
  );
}

function useOurOwnPlayingOrPreviewing(oembed, url, isPlaying) {
  
  if (!isPlaying || !oembed) {
    return true;
  }

  // we want to use our own previewing for gifs which will be
  // type 'video', so make sure we don't accidently catch
  // anything else like an imgur gallery (type 'rich')
  if (oembed.type !== 'video') { return false; }

  const provider = oembed.provider_name.toLowerCase();
  return (provider === 'gfycat' || provider === 'imgur' || /\.gif$/.test(url));
}

function showObfuscated(isNSFW, isSpoiler, showNSFW, showSpoilers) {
  return (isNSFW && !showNSFW) || (isSpoiler && showSpoilers);
}

function getAspectRatio(single, width, height) {
  if (width && height) {
    return single ? width / height : limitAspectRatio(width / height);
  }

  return DEFAULT_ASPECT_RATIO;
}

function autoPlayGif(gif) {
  if (!gif) {
    return;
  }

  // need this to make iOS really autoplay the gif
  gif.play();
}

function forceProtocol(url, https) {
  const urlObj = URL.parse(url);
  urlObj.protocol = https ? 'https:' : urlObj.protocol;
  return URL.format(urlObj);
}

// NOTE: Playable Type and LinkDescriptor will move into the new
// representation for PostMediaState (temporary name) once that's
// refactored out into its own real file
const PLAYABLE_TYPE = {
  GALLERY: 'gallery',
  INLINE: 'inline',
  NOT_PLAYABLE: 'not-playable',
};

function postToPlayableType(post) {
  const media = post.media;

  if (media && (Object.keys(media)[0].localeCompare('reddit_video') === 0)) {
    return PLAYABLE_TYPE.INLINE;
  }

  if (media && media.oembed) {
    const type = media.oembed.type;
    if (type === 'gallery') {
      return PLAYABLE_TYPE.GALLERY;
    } else if (type === 'rich' && media.oembed.provider_name.toLowerCase() === 'imgur') {
      return PLAYABLE_TYPE.GALLERY;
    } else if (type !== 'image') {
      return PLAYABLE_TYPE.INLINE;
    }
  }

  if (post.cleanUrl && post.cleanUrl.indexOf('.gif') > -1) {
    return PLAYABLE_TYPE.INLINE;
  }

  return PLAYABLE_TYPE.NOT_PLAYABLE;
}

/**
 * Determines if a post is for a self-hosted gif
 * and tries to swap it for an MP4 preview. The MP4
 * may have smaller dimensions, but considering the
 * filesize of a long GIF, this is worth it.
 * @returns {Object|null}
 */
function gifToMp4Content(post) {
  const url = post.cleanUrl;
  // if the url is for a gif hosted by reddit,
  // try to show a video in its place
  if (post.domain === 'i.redd.it' && url.indexOf('.gif') > -1) {
    const mp4Sub = findPreviewVideo(post.preview);
    if (mp4Sub && mp4Sub.url.indexOf('fm=mp4') > -1) {
      return mp4Sub;
    }
  }
  return null;
}

/**
 * Attempts to swap a GIF URL for an MP4 URL
 * if we host it. Returns the original URL if this is
 * not possible.
 */
function optimizeContent(post) {
  const { url } = gifToMp4Content(post) || {};
  return url || post.cleanUrl;
}
