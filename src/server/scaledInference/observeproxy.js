import * as si from './util';
import { logServerError } from 'lib/errorLog';
import { SCALED_INFERENCE } from 'app/constants';

const { assign } = Object;

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

const DEBUG_RESULT = null;

export default (router) => {
  router.post('/si-observe', async (ctx) => {
    const amp = si.createAmp(ctx);

    try {
      const { context, project_id } = ctx.request.body;
      await amp.session.observe('XPromoContext', context, {});

      if (project_id === 0) {
        ctx.body = { session: amp.session.cookieData };
        return;
      }

      const { err, decision } = await new Promise((resolve) => {
        amp.session.decide('XPromo', SI_PARAMS, {}, (err, decision) => {
          resolve({
            err,
            decision: DEBUG_RESULT || decision,
          });
        });
      });

      ctx.body = {
        variant: decision,
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
