import './styles.less';

import React from 'react';
import config from 'config';
import { getBranchLink } from 'lib/xpromoState';
import { connect } from 'react-redux';
import cx from 'lib/classNames';
import { flags } from 'app/constants';
import { getActiveExperimentVariant } from 'lib/experiments';
import { EXPERIMENT_NAMES } from '../../selectors/xpromo';

class XPromoPill extends React.Component {
  constructor() {
    super();
    this.state = {
      dismissed: false,
    };
  }

  render() {
    const { dismissed } = this.state;

    const onClick = (e) => {
      this.setState({ dismissed: true });
      e.stopPropagation();
      e.preventDefault();
      return false;
    };

    if (!this.props.active) {
      return null;
    }

    return (
      <a className={ cx('XPromoPill', { dismissed }) } href={ this.props.href }>
        <span>OPEN REDDIT APP</span>
        <img
          className="XPromoPill__close"
          src={ `${config.assetPath}/img/close-circle-x.png` }
          onClick={ onClick }
        />
      </a>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { NSFW_XPROMO } = flags;
  const active = !!getActiveExperimentVariant(state, EXPERIMENT_NAMES[NSFW_XPROMO]);
  const href = getBranchLink(state, ownProps.url, {
    channel: 'xpromo',
    campaign: 'mweb',
    feature: 'mweb_nsfw_xpromo',
    id: 'treatment_1',
    utm_source: 'xpromo',
    utm_medium: 'mweb',
    utm_name: 'mweb_nsfw_xpromo',
    utm_term: 'treatment_1',
  });
  return { href, active };
};

export default connect(mapStateToProps)(XPromoPill);

/*
https://www.reddit.com/?channel=xpromo&feature=mweb_nsfw_xpromo&campaign=mweb&%2524og_redirect=https%3A%2F%2Fwww.reddit.com%2Fr%2Favocadosgonewild%2F&%2524deeplink_path=%2Fr%2Favocadosgonewild%2F&%2524android_deeplink_path=reddit%2Fr%2Favocadosgonewild%2F&mweb_loid=00000000001idl174i&mweb_loid_created=1528158071812&mweb_user_id36=&mweb_user_name=&domain=localhost%3A4444&geoip_country=US&user_agent=Mozilla%2F5.0+(iPhone%3B+CPU+iPhone+OS+11_0+like+Mac+OS+X)+AppleWebKit%2F604.1.38+(KHTML%2C+like+Gecko)+Version%2F11.0+Mobile%2F15A372+Safari%2F604.1&base_url=%2Fr%2Favocadosgonewild&referrer_domain=&referrer_url=&language=&dnt=false&compact_view=true&adblock=false&session_id=Ob36ZwPYy0gN5qnwLa&loid=00000000001idl174i&loid_created=1528158071812&reddaid=&sr_id=4840364&sr_name=avocadosgonewild&id=treatment_1&tags%5B%5D=mweb_xpromo_ad_loading_ios&tags%5B%5D=mweb_xpromo_ad_loading_ios_variant_control_2&tags%5B%5D=mweb_xpromo_ad_loading_ios_id_186&tags%5B%5D=mweb_nsfw_xpromo&tags%5B%5D=mweb_nsfw_xpromo_variant_treatment_1&tags%5B%5D=mweb_nsfw_xpromo_id_361&tags%5B%5D=client_settings_empty&_branch_match_id=532340418190380955
*/
