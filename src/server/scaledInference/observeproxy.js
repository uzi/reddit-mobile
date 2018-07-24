import * as si from './util';
import { logServerError } from 'lib/errorLog';
import { SCALED_INFERENCE } from 'app/constants';

const { LISTING, POST, CLICK, P, D, BB, TA, BLB, N } = SCALED_INFERENCE;

const SI_PARAMS = {
  [LISTING]: [TA, BLB, P, N],
  [POST]: [BB, BLB, P, N],
  [CLICK]: [D, N],
};

// const DEBUG_RESULT = {
//   [LISTING]: P,
//   [POST]: BLB,
//   [CLICK]: D,
// };

/*
__si_startts: now,
__si_eventts: now,
__si_sid: amp.session.id,
__si_uid: amp.session.userId,
*/


const DEBUG_RESULT = null;

export default (router) => {
  router.post('/si-observe', async (ctx) => {

    const clientSession = si.getSessionDataFromContext(ctx);
    const fingerprint = si.getFingerprintFromContext(ctx);

    si.debugClient(
      'observe',
      clientSession.__si_sid,
      clientSession.__si_uid,
      fingerprint,
    );

    const amp = si.createAmp(ctx);

    let sid1, uid1, sid2, uid2;

    sid1 = amp.session.cookieData.__si_sid;
    uid1 = amp.session.cookieData.__si_uid;

    try {
      const { context, project_id } = ctx.request.body;
      const observeResult = await new Promise((resolve) => {
        amp.session.observe('XPromoContext', context, {}, (err, res) => {
          resolve({
            err,
            res,
          });
        });
      });

      sid2 = amp.session.cookieData.__si_sid;
      uid2 = amp.session.cookieData.__si_uid;

      si.debugServer(
        'XPromoContext',
        sid1, uid1,
        sid2, uid2,
        err || null,
        fingerprint,
      );

      if (observeResult.err) {
        ctx.body = {
          variants: null,
          session: null,
          err: observeResult.err,
        };
        return;
      }

      if (project_id === 0) {
        ctx.body = { session: amp.session.cookieData };
        return;
      }

      sid1 = sid2;
      uid1 = uid2;

      const { err, decision } = await new Promise((resolve) => {
        amp.session.decide('XPromo', SI_PARAMS, {}, (err, decision) => {
          resolve({
            err,
            decision: DEBUG_RESULT || decision,
          });
        });
      });

      sid2 = amp.session.cookieData.__si_sid;
      uid2 = amp.session.cookieData.__si_uid;

      si.debugServer(
        'XPromo',
        sid1, uid1,
        sid2, uid2,
        err,
        fingerprint,
      );

      ctx.body = {
        variants: decision,
        err,
        session: amp.session.cookieData,
      };

    } catch (error) {
      ctx.status = 401;
      ctx.body = { error: 'Server Error' };
      logServerError(error, ctx);
    }
  });
};
