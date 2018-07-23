import * as si from './util';

export default (router) => {
  router.post('/si-outcome', async (ctx) => {
    const amp = si.createAmp(ctx);
    const { outcome, trigger, xpromoType, headerButton } = ctx.request.body;

    const eventNames = {
      accept: 'XPromoOutcomeAccept',
      dismiss: 'XPromoOutcomeDismiss',
      view: 'XPromoOutcomeView',
    };

    amp.session.observe(eventNames[outcome], {
      trigger,
      xpromoType,
      headerButton,
    });

    ctx.body = {
      session: amp.session.cookieData,
    };
  });
};
