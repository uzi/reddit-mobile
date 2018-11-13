import './styles.less';

import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import SitewideRule from 'apiClient/models/SitewideRule';
import SubredditRule from 'apiClient/models/SubredditRule';
import * as ModelTypes from 'apiClient/models/thingTypes';

import * as modalActions from 'app/actions/modal';
import * as reportingActions from 'app/actions/reporting';
import Loading from 'app/components/Loading';
import Report from 'app/models/Report';
import { formatPythonString } from 'lib/formatPythonString';
import { getSitewideRulesFromState } from 'lib/sitewideRules';
import { getSubredditRulesFromState } from 'lib/subredditRules';

import cx from 'lib/classNames';

const T = React.PropTypes;

/**
 * Get a list of subreddit rules that apply to the thing currently being reported.
 * @function
 * @param {Object} state
 * @returns {SubredditRule[]}
 */
function subredditRulesFromState(state) {
  const { subredditName, thingId } = state.modal.props;
  const thingType = ModelTypes.thingType(thingId);

  return getSubredditRulesFromState(state, subredditName, thingType);
}

/**
 * Component for rendering the reporting modal
 * This is the modal used to *submit* reports, not the modal mods use to
 * *view* reports.
 * @class
 * @extends {React.Component}
 */
class ReportingModal extends React.Component {
  // sequenceOfParentRules: the sequence of rule indexes
  // that led us to the current rules page
  // indexOfChosenChildRule: the index of the rule that is
  // chosen on the current rules page
  state = {
    sequenceOfParentRules: [],
    indexOfChosenChildRule: null,
    fileAComplaintPage: false,
  }

  static propTypes = {
    onCloseReportFlow: T.func.isRequired,
    onSubmit: T.func.isRequired,
    sitewideRules: T.arrayOf(SitewideRule),
    subredditName: T.string,
    subredditRules: T.arrayOf(SubredditRule),
    thingId: T.string,
  };

  handlerBack = this.handleBack.bind(this);
  handlerNextOrSubmit = this.handleNextOrSubmit.bind(this);

  render() {
    const {
      onCloseReportFlow,
      sitewideRules,
      thingId,
    } = this.props;

    const {
      fileAComplaintPage,
      indexOfChosenChildRule,
      sequenceOfParentRules,
    } = this.state;

    const showReportFlow = !!sitewideRules.length;
    const rulesChosen = indexOfChosenChildRule !== null;
    const isFirstPage = !sequenceOfParentRules.length;
    const currentRule = this.getCurrentRules()[indexOfChosenChildRule];

    return (
      <div className='ReportingModalWrapper' onClick={ onCloseReportFlow }>
        <div className='ReportingModal' onClick={ this.stopPropagationOfClick }>

          <div className='ReportingModal__title-bar'>
            <div className='ReportingModal__close' />
            <div className='ReportingModal__title'>
              { this.getCurrentHeader() }
            </div>
          </div>

          { fileAComplaintPage
            ? (
              <div>
                <div className='ReportingModal__file-prompt'>
                  { currentRule.complaintPrompt }
                </div>
                <div className='ReportingModal__file-complaint-button'>
                {/* Server returns complaintUrls in the format of `/api/report_redirect?reason_code=SomeFileComplaintReason&thing=%(thing)s`
                in order to track clicking of "File a complaint" button. Because of that we need to format it and put thingId inside */}
                  <a href={ formatPythonString(decodeURI(currentRule.complaintUrl), { thing: thingId }) }
                     target='_blank'>
                    { currentRule.complaintButtonText }
                  </a>
                </div>
              </div>
            )
            : showReportFlow
              ? (
                <div className='ReportingModal__options'>
                  { this.getCurrentRules().map((r, i) => this.renderReportRow(r, i)) }
                </div>
              ) : <Loading />
          }

          { fileAComplaintPage
            ? (
              <div className='ReportingModal__submit'>
                <div
                  className={ cx('ReportingModal__submit-button', {
                    disabled: true,
                  }) }
                >
                  REPORT
                </div>
                <div
                  className='ReportingModal__back-button'
                  onClick={ onCloseReportFlow }
                >
                  CLOSE
                </div>
              </div>
            )
            : showReportFlow
              ? (
                <div className='ReportingModal__submit'>
                  <div
                    className={ cx('ReportingModal__submit-button', {
                      disabled: !rulesChosen,
                    }) }
                    onClick={ rulesChosen ? this.handlerNextOrSubmit : this.stopPropagationOfClick }
                  >
                    { rulesChosen
                      && !(this.getCurrentRules()[indexOfChosenChildRule].nextStepReasons
                          && this.getCurrentRules()[indexOfChosenChildRule].nextStepReasons.length)
                        ? 'REPORT'
                        : 'NEXT'
                    }
                  </div>
                  <div
                    className='ReportingModal__back-button'
                    onClick={ isFirstPage ? onCloseReportFlow : this.handlerBack }
                  >
                    { isFirstPage ? 'CLOSE' : 'BACK' }
                  </div>
                </div>
              ) : null
          }
        </div>
      </div>
    );
  }

  getAllRules() {
    const {
      sitewideRules,
      subredditName,
      subredditRules,
    } = this.props;

    const allRules = sitewideRules.slice();
    const reasonTextToShow = `It breaks r/${subredditName}'s rules`;

    if (subredditRules && subredditRules.length) {
      const subredditRulesReason = {
        nextStepHeader: 'Which rule does it break?',
        nextStepReasons: subredditRules,
        reasonTextToShow,
        getReportReasonToShow: () => { return reasonTextToShow; },
      };
      allRules.splice(2, 0, subredditRulesReason);
    }

    return allRules;
  }

  getCurrentRules() {
    const {
      sequenceOfParentRules,
    } = this.state;

    let currentRules = this.getAllRules();
    sequenceOfParentRules.forEach(function(indexOfRule) {
      currentRules = currentRules[indexOfRule].nextStepReasons;
    });

    return currentRules;
  }

  getCurrentHeader() {
    const {
      fileAComplaintPage,
      indexOfChosenChildRule,
      sequenceOfParentRules,
    } = this.state;

    const currentRule = this.getCurrentRules()[indexOfChosenChildRule];

    if (fileAComplaintPage) {
      return currentRule.complaintPageTitle;
    }

    if (!sequenceOfParentRules.length) {
      return 'We\'re sorry something\'s wrong. How can we help?';
    }

    let rules = this.getAllRules();
    let parentRule;
    sequenceOfParentRules.forEach(function(indexOfRule) {
      parentRule = rules[indexOfRule];
      rules = rules[indexOfRule].nextStepReasons;
    });

    return parentRule.nextStepHeader;
  }

  onUpdateIndexOfChosenRule(indexOfRule) {
    this.setState({
      indexOfChosenChildRule: indexOfRule,
    });
  }

  onAddToSequenceOfParentRules(indexOfRule) {
    const newSequence = this.state.sequenceOfParentRules.slice();
    newSequence.push(indexOfRule);
    this.setState({
      sequenceOfParentRules: newSequence,
      indexOfChosenChildRule: null,
    });
  }

  handleNextOrSubmit(e) {
    e.stopPropagation();

    const {
      onCloseReportFlow,
      onSubmit,
      thingId,
    } = this.props;

    const {
      indexOfChosenChildRule,
    } = this.state;

    const violatedRule = this.getCurrentRules()[indexOfChosenChildRule];

    if (violatedRule.fileComplaint) {
      this.setState({
        fileAComplaintPage: true,
      });
      return;
    }

    if (violatedRule.nextStepReasons && violatedRule.nextStepReasons.length) {
      this.onAddToSequenceOfParentRules(indexOfChosenChildRule);
    } else {
      let report;
      if (violatedRule instanceof SitewideRule) {
        report = Report.fromSitewideRule(thingId, violatedRule);
      } else {
        report = Report.fromSubredditRule(thingId, violatedRule);
      }
      onSubmit(report);
      onCloseReportFlow();
    }
  }

  handleBack(e) {
    e.stopPropagation();

    const newSequence = this.state.sequenceOfParentRules.slice();
    newSequence.pop();
    this.setState({
      sequenceOfParentRules: newSequence,
      indexOfChosenChildRule: null,
    });
  }

  renderReportRow(rule, selectedRuleIndex) {
    const onClick = e => {
      e.stopPropagation();
      this.onUpdateIndexOfChosenRule(selectedRuleIndex);
    };
    const isChecked = this.state.indexOfChosenChildRule === selectedRuleIndex;

    const className = cx('icon', {
      'icon-check-circled': isChecked,
      'icon-circle': !isChecked,
    });

    const displayText = rule.getReportReasonToShow();

    return (
      <div className='ReportingModal__option' onClick={ onClick } >
        <div className={ className } />
        <div className="ReportingModal__reason-text">
          { displayText }
        </div>
      </div>
    );
  }

  stopPropagationOfClick(e) {
    e.stopPropagation();
  }
}

const selector = createSelector(
  state => state.modal.props.thingId,
  state => getSitewideRulesFromState(state),
  state => state.modal.props.subredditName,
  state => subredditRulesFromState(state),
  (thingId, sitewideRules, subredditName, subredditRules) => ({
    thingId,
    sitewideRules,
    subredditName,
    subredditRules,
  }),
);

const dispatcher = dispatch => ({
  onCloseReportFlow: () => dispatch(modalActions.closeModal()),
  onSubmit: report => dispatch(reportingActions.submit(report)),
});

export default connect(selector, dispatcher)(ReportingModal);
