import './styles.less';
import React from 'react';

const T = React.PropTypes;

export const SuspensionBanner = props => {
  const suspensionText = (
    <div className="SuspensionBanner__text">
      Your account has been suspended.
    </div>
  );

  const fprText = (
    <div className="SuspensionBanner__text">
      Uh oh! We have suspended your account due to suspicious activity. Not to worry. You can continue using Reddit by resetting your password.
    </div>
  );

  const redditHelpFPRLink = 'https://www.reddithelp.com/en/categories/using-reddit/your-reddit-account/my-account-was-disabled';
  const redditHelpSuspendedLink = 'https://www.reddithelp.com/en/node/851';

  return (
    <a className='SuspensionBanner' href={ props.isFPR ? redditHelpFPRLink : redditHelpSuspendedLink } target="blank">
      <div className='SuspensionBanner__icon icon icon-xl icon-law' />
      { props.isFPR ? fprText : suspensionText }
    </a>
  );
};

SuspensionBanner.propTypes = {
  isFPR: T.bool,
};
