import './styles.less';
import React from 'react';

import { Form } from 'platform/components';

export default class QuarantineBanner extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      expanded: !!props.expanded,
    };
  }

  expand = () => {
    if (this.state.expanded) { return; }

    this.setState({
      expanded: true,
    });
  }

  render() {
    const { props, state } = this;
    
    return (
      <div
        className={ `QuarantineBanner ${ state.expanded ? 'expanded' : 'collapsed'}` }
        onClick={ this.expand }
      >
        <div className='QuarantineBanner__icon icon icon-xl icon-header_quarantine' />
        <div className='QuarantineBanner__summary'>
          This community is quarantined.<br/>
          Tap to learn more.
        </div>
        <div className="QuarantineBanner__details">
          This community is&nbsp;
          <a href="https://www.reddithelp.com/en/categories/reddit-101/rules-reporting/account-and-community-restrictions/quarantined-subreddits">
            quarantined
          </a>.
          <span dangerouslySetInnerHTML={ { __html: props.quarantineMessageHTML } } />
          <Form
            action={ '/actions/optOutOfQuarantine' }
            className="QuarantineBanner__form"
          >
            <input type="hidden" name="subredditName" value={ props.subredditName } />
            <button type="submit" className="QuarantineBanner__button">
              Leave this community
            </button>
          </Form>
        </div>
      </div>
    );
  }
}
