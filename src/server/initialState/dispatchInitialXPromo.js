import { getExperimentDataByFlags } from '../../app/selectors/xpromo';
import { XPROMO_ADLOADING_TYPES as TYPE, FIRST_BIT } from '../../app/constants';
import {
  trackBucketingEvents,
  trackPagesXPromoEvents,
} from 'lib/eventUtils';
import { getExperimentData } from '../../lib/experiments';


export const dispatchInitialXPromo = async (ctx, dispatch, getState) => {
  const state = getState();
  // don't fire xpromo app-load bucketing event if we're slowing down app-load
  const firstBitFeatureData = getExperimentData(state, FIRST_BIT.EXPERIMENT_NAME);
  if (!firstBitFeatureData) {
    const experimentData = getExperimentDataByFlags(state);
    trackBucketingEvents(state, experimentData, dispatch);
    trackPagesXPromoEvents(state, {interstitial_type: TYPE.MAIN});
  }
};
