import './styles.less';
import React from 'react';
import CallToAction from 'app/components/CallToAction';
import OutboundLink from 'app/components/OutboundLink';
import { cleanPostHREF } from 'app/components/Post/postUtils.js';
import mobilify from 'lib/mobilify';
import cx from 'lib/classNames';

export default function AdLinkBar(props) {
  const { outboundLink, callToAction, domain, cleanUrl, promoted, thumbnail } = props.post;
  const linkUrl = cleanPostHREF(mobilify(cleanUrl));
  const linkTarget = props.showLinksInNewTab ? '_blank' : null;
  const className = cx('adLinkBar', {
    '__compactView': props.displayCompact,
    '__compactNoImg': !thumbnail && props.displayCompact,
  });

  return (
    <div className={ className }>
      <OutboundLink
        href={ linkUrl }
        target={ linkTarget }
        promoted={ promoted }
        outboundLink={ outboundLink }
      >
       { domain }
      </OutboundLink>
      { callToAction && 
        <CallToAction
          href={ linkUrl }
          target={ linkTarget }
          promoted={ promoted }
          outboundLink={ outboundLink }
          callToAction= { callToAction }
        />
      }
    </div>
  );
}
