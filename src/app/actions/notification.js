export const NOTIFY = 'NOTIFICATION__NOTIFY';
export const DISMISS = 'NOTIFICIATION_DISMISS';

export const notify = payload => ({ type: NOTIFY, payload });
export const dismiss = () => ({ type: DISMISS });
