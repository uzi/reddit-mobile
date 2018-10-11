/**
 * Helper to get sitewide rules from state.
 * @param {Object} state 
 * @returns {SitewideRule[]} Returns sitewide rules.
 */
export function getSitewideRulesFromState(state) {
  return state.sitewideRules;
}
