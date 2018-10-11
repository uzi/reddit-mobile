import apiRequest from '../apiBase/apiRequest';
import SitewideRule from '../models/SitewideRule';

export default {
  /**
   * Get the sitewide rules.
   * @function
   * @param {Object} apiOptions
   * @returns {Promise<Object>} A promise resolving with the ApiResponse
   */
  async get(apiOptions) {
    const path = 'api/sitewide_rules.json';
    const query = {
      raw_json: 1,
    };

    const apiResponse = await apiRequest(apiOptions, 'GET', path, { query });
    const { sitewide_rules } = apiResponse.response.body;

    if (sitewide_rules) {
      sitewide_rules.forEach(rule => {
        apiResponse.addResult(SitewideRule.fromJSON(rule));
      });
    }

    return apiResponse;
  },
};
