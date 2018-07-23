const fingerprint = Math.random();

export const sendObserve = (payload) => {
  return fetch('/si-observe', {
    credentials: 'include',
    method: 'POST',
    body: JSON.stringify({ ...payload, fingerprint}),
    headers: {
      'content-type': 'application/json',
    },
  }).then(res => res.json());
};

export const sendOutcome = (payload) => {
  return fetch('/si-outcome', {
    credentials: 'include',
    method: 'POST',
    body: JSON.stringify({ ...payload, fingerprint }),
    headers: {
      'content-type': 'application/json',
    },
  }).then(res => res.json());
};
