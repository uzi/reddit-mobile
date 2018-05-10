import './styles.less';
import React from 'react';
import OutboundLink from 'app/components/OutboundLink';

export default function CallToAction({ href, target, promoted, outboundLink, callToAction }) {
  return (
    <OutboundLink
      className='callToAction'
      target={ target }
      href={ href }
      outboundLink={ outboundLink }
      promoted={ promoted }
    >
      { callToAction }
    </OutboundLink>
  );
}
