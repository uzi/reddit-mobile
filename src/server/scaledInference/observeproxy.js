import * as si from './util';
import { logServerError } from 'lib/errorLog';

const { assign } = Object;

export default (router) => {
  router.post('/si-observe', async (ctx) => {
    const amp = si.createAmp(ctx);

    try {
      const { context, project_id } = ctx.request.body;
      await amp.session.observe('XPromoContext', context, {});

      if (project_id === 0) {
        ctx.body = Object.assign({ session: amp.session.cookieData });
        return;
      }

      const { err, decision } = await new Promise((resolve) => {
        amp.session.decide('XPromo', {
          xpromo_listing: ['TA', 'BLB', 'P', 'N'],
          xpromo_post: ['BB', 'BLB', 'P', 'N'],
          xpromo_click: ['D', 'N'],
        }, {}, (err, decision) => {
          resolve({
            err,
            decision,
          });
        });
      });

      const decisionData = assign(
        { variants: decision, err },
        amp.session.cookieData
      );

      ctx.body = decisionData;
    } catch (error) {
      ctx.status = 401;
      ctx.body = { error: 'Server Error' };
      logServerError(error, ctx);
    }
  });
};
