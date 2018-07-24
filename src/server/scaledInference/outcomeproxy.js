import * as si from './util';

export default (router) => {
  router.post('/si-outcome', async (ctx) => {
    const clientSession = si.getSessionDataFromContext(ctx);
    const fingerprint = si.getFingerprintFromContext(ctx);

    si.debugClient(
      'outcome',
      clientSession.__si_sid,
      clientSession.__si_uid,
      fingerprint,
    );

    const amp = si.createAmp(ctx);

    const sid1 = amp.session.cookieData.__si_sid;
    const uid1 = amp.session.cookieData.__si_uid;

    const { outcome, trigger, xpromoType, headerButton } = ctx.request.body;

    const eventNames = {
      accept: 'XPromoOutcomeAccept',
      dismiss: 'XPromoOutcomeDismiss',
      view: 'XPromoOutcomeView',
    };

    const response = await new Promise((resolve) => {
      amp.session.observe(
        eventNames[outcome], {
          trigger,
          xpromoType,
          headerButton,
        },
        {},
        (err, res) => {
          resolve({ err, res });
        }
      );
    });

    const sid2 = amp.session.cookieData.__si_sid;
    const uid2 = amp.session.cookieData.__si_uid;

    si.debugServer(
      eventNames[outcome],
      sid1, uid1,
      sid2, uid2,
      response.err || null,
      fingerprint,
    );

    ctx.body = {
      session: amp.session.cookieData,
    };
  });
};
