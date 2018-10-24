import { XPROMO } from 'app/constants';

export function extractUser(state) {
  if (!state || !state.user || !state.accounts) {
    return;
  }
  return state.accounts[state.user.name];
}

export function getExperimentData(state, experimentName) {
  const queryParams = state.platform.currentPage && state.platform.currentPage.queryParams;
  const hasOverride = queryParams && experimentName in queryParams;
  const override = queryParams && queryParams[experimentName];
  const user = extractUser(state);

  // ?my_experiment=
  if (hasOverride && !override) {
    return null;
  }

  if (!user || !user.features[experimentName]) {
    return override ? { experiment_name: experimentName, variant: override } : null;
  }

  const result = {
    ...user.features[experimentName],
    experiment_name: experimentName,
  };

  if (override) {
    result.variant = override;
  }

  return result;
}

export function getActiveExperimentVariant(state, experimentName) {
  const data = getExperimentData(state, experimentName);
  const enabled = data && !/control/.test(data.variant);
  return enabled ? data.variant : null;
}

export function getExperimentVariant(state, experimentName) {
  if (experimentName === XPROMO.EXPERIMENT) {
    const queryParams = state.platform.currentPage && state.platform.currentPage.queryParams;

    if (queryParams && queryParams.si_experiment) {
      return queryParams.si_experiment;
    }
  }

  const data = getExperimentData(state, experimentName);
  return data && data.variant;
}

export function featureEnabled(state, featureName) {
  // some feature flags are just true/false and don't have experiment
  // variants and their associated bucketing events. They're useful
  // for ramping up / down, and quicky enabling / disabling certain features
  const user = extractUser(state);
  if (!user) {
    return false;
  }

  return !!getExperimentData(state, featureName);
}
