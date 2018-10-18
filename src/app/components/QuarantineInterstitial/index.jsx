import './styles.less';
import React from 'react';

import { Anchor, Form } from 'platform/components';

export default function QuarantineInterstitial(props) {
  return (
    <div className='QuarantineInterstitial'>
      <div className='QuarantineInterstitial__icon-wrapper'>
        <span className='QuarantineInterstitial__icon icon icon-header_quarantine quarantine' />
      </div>
      <h3 className='QuarantineInterstitial__header'>
        Are you sure you want to view this community?
      </h3>
      <p className='QuarantineInterstitial__text'>
        This community is quarantined.
      </p>
      <div
        className='QuarantineInterstitial__message'
        dangerouslySetInnerHTML={ {
          __html: props.quarantineMessage,
        } }
      />
      <p className='QuarantineInterstitial__text'>
        Are you certain you want to continue?
      </p>
      <div className='QuarantineInterstitial__buttons'>
        <Anchor href='/' className='QuarantineInterstitial__button'>
          NO THANK YOU
        </Anchor>
        <Form
          action={ '/actions/optIntoQuarantine' }
          className='QuarantineInterstitial__form'
        >
          <input type='hidden' name='subredditName' value={ props.subredditName } />
          <button type='submit' className='QuarantineInterstitial__button'>
            CONTINUE
          </button>
        </Form>
      </div>
    </div>
  );
}
