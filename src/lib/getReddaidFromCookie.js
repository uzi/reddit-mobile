import cookies from 'js-cookie';

export const REDDAID = 'reddaid';

export const getReddaidFromCookie = () => {
  const reddaid = cookies.get(REDDAID);
  return reddaid || null;
};
