import apiRequest from '../apiBase/apiRequest';

export default {
  postOptIn(apiOptions, subreddit) {
    const body = {
      sr_name: subreddit,
      api_type: 'json',
    };

    return apiRequest(apiOptions, 'POST', 'api/quarantine_optin', { body, type: 'form' });
  },

  postOptOut(apiOptions, subreddit) {
    const body = {
      sr_name: subreddit,
      api_type: 'json',
    };

    return apiRequest(apiOptions, 'POST', 'api/quarantine_optout', { body, type: 'form' });
  },
};
