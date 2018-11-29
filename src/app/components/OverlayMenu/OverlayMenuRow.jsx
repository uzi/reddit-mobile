import './styles.less';

import React from 'react';
import map from 'lodash/map';

import { Anchor, Form } from 'platform/components';
import { COLOR_SCHEME } from 'app/constants';

const { NIGHTMODE } = COLOR_SCHEME;

const T = React.PropTypes;

const BaseRowProps = {
  text: T.node.isRequired,
  icon: T.string,
  iconURL: T.string,
  theme: T.string,
};

function iconOrSpacerFromProps(props) {
  if (props.subtext) {
    return false;
  }

  let iconContent;

  if (props.iconURL) {
    const backgroundStyle = {
      backgroundImage: `url(${props.iconURL})`,
    };

    if (props.iconBackgroundColor) {
      if (props.theme === NIGHTMODE) {
        backgroundStyle.borderColor = props.iconBackgroundColor;
      }

      backgroundStyle.backgroundColor = props.iconBackgroundColor;
    }

    if (props.iconWidth) {
      backgroundStyle.width = props.iconWidth;
    }

    iconContent = (
      <span
        className='OverlayMenu-icon OverlayMenu-icon-img'
        style={ backgroundStyle }
      />);
  } else if (props.icon) {
    const iconStyles = {};

    if (props.iconBackgroundColor) {
      if (props.theme === NIGHTMODE) {
        iconStyles.borderColor = props.iconBackgroundColor;
      } else {
        iconStyles.backgroundColor = props.iconBackgroundColor;
      }
    }

    iconContent = <span className={ `OverlayMenu-icon icon ${props.icon}` } style={ iconStyles } />;
  }

  return (<span className='OverlayMenu-row-spacer'>{ iconContent }</span>);
}

const paramsToInputs = (params) => {
  const keys = Object.keys(params);
  return map(keys, key => (
    <input type='hidden' key={ `button-row-input-${key}` }name={ key } value={ params[key] } />
  ));
};

ButtonRow.propTypes = {
  ...BaseRowProps,
  action: T.string.isRequired,
  params: T.object,
};

function ButtonRow(props) {
  return (
    <li className='OverlayMenu-row'>
      <Form
        action={ props.action }
        className='OverlayMenu-row-button'
      >
        { paramsToInputs(props.parms || {}) }
        <button type='submit' className='OverlayMenu-row-button'>
          { iconOrSpacerFromProps(props) }
          <span className='OverlayMenu-row-text'>{ props.text }</span>
          { props.children }
        </button>
      </Form>
    </li>
  );
}

LinkRow.propTypes = {
  ...BaseRowProps,
  href: T.string.isRequired,
  noRoute: T.bool,
  clickHandler: T.func,
  onClick: T.func,
  iconWidth: T.number,
};

function LinkRow(props) {
  const linkElementProps = {
    className: 'OverlayMenu-row-button',
    href: props.href,
    children: [
      iconOrSpacerFromProps(props),
      (<span className='OverlayMenu-row-text'>{ props.text }</span>),
    ],
  };

  return (
    <li className='OverlayMenu-row' onClick={ props.onClick }>
      { props.noRoute
        ? <a { ...linkElementProps } />
        : <Anchor { ...linkElementProps } />
      }
      { props.children }
    </li>
  );
}

class ExpandoRow extends React.Component {
  static propTypes = {
    ...BaseRowProps,
    subtext: T.string,
    autoExpanded: T.bool,
  };

  static defaultProps = {
    autoExpanded: false,
  };

  constructor(props) {
    super(props);

    this.state = {
      expanded: props.autoExpanded,
    };

    this._onClick = this._onClick.bind(this);
  }

  _onClick() {
    const newExpanded = !this.state.expanded;
    this.setState({ expanded: newExpanded });
  }

  render() {
    const props = this.props;
    const expanded = this.state.expanded;

    let body;
    if (expanded) {
      body = (
        <ul className='OverlayMenu-ul list-unstyled'>
          { props.children }
        </ul>
      );
    }

    let rowText;
    if (props.subtext) {
      rowText = (
        <span className='OverlayMenu-row-text with-subtext'>
          { props.text }
          <br />
          <span className='OverlayMenu-row-text subtext'>{ props.subtext }</span>
        </span>
      );
    } else {
      rowText = <span className='OverlayMenu-row-text'>{ props.text }</span>;
    }

    return (
      <li className='OverlayMenu-row top-border'>
        <button type='button' className='OverlayMenu-row-button' onClick={ this._onClick }>
          { iconOrSpacerFromProps(props) }
          { rowText }
          <span className='OverlayMenu-row-right-item'>
            <span className={ `icon ${expanded ? 'icon-nav-arrowup' : 'icon-nav-arrowdown'}` } />
          </span>
        </button>
        { body }
      </li>
    );
  }
}

export { ButtonRow, LinkRow, ExpandoRow };
