import Amp from 'amp-node';

export const TEST_PROJECT_KEYS = [
  // Scaled Inference test project keys
  '4479164de58f944c',
  '4553532aeeded9b3',
  '21377c707a3198c8',
];

export const PRODUCTION_PROJECT_KEYS = [
  '90cc5238a6c41e71',
  'dcce7f3addf1e3bf',
  'dea870750b61382c',
];

const PROJECT_KEYS = PRODUCTION_PROJECT_KEYS;

export const getConfig = (ctx) => {
  const idx = ctx.request.body.project_id || 0;
  const key = PROJECT_KEYS[idx];

  return {
    key,
    domain: 'https://reddit.agent.amp.ai:8100',
    apiPath: '/api/core/v1/',
  };
};

const SESSIONTTL = 18 * 60 * 60;
const SESSIONLENGTH = 30 * 60;

export function newSession(amp) {
  amp.session = new amp.Session();
  const now = Date.now() / 1000;

  const cookieData = {
    __si_startts: now,
    __si_eventts: now,
    __si_sid: amp.session.id,
    __si_uid: amp.session.userId,
  };

  amp.session.cookieData = cookieData;
}

export function getSessionDataFromContext(ctx) {
  return ctx.request.body.session || {};
}

export function createAmp(ctx) {
  const amp = new Amp(getConfig(ctx));

  const { __si_startts, __si_eventts, __si_sid, __si_uid } = getSessionDataFromContext(ctx);

  if (!(__si_sid || __si_uid)) {
    newSession(amp, ctx);
  } else {
    const now = Date.now() / 1000;

    if (now - __si_eventts > SESSIONTTL || now - __si_startts > SESSIONLENGTH) {
      newSession(amp, ctx);
    } else {
      amp.session = new amp.Session({id: __si_sid, userId: __si_uid});
      amp.session.cookieData = getSessionDataFromContext(ctx);
    }
  }

  return amp;
}
