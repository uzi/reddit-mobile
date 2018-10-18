
export const isErrorFromQuarantine = e => {
  return (
    e.status === 403 &&
    e.response &&
    e.response.body &&
    e.response.body.reason === 'quarantined'
  );
};
