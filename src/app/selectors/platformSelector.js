export const pageTypeSelector = state => {
  const currentPageURL = (state.platform.currentPage && state.platform.currentPage.url) || '';
  const segs = currentPageURL.split('/');
  if (segs[3] === 'comments') { return 'post'; }
  return 'listing';
};
