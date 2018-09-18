import apiRequest from '../apiBase/apiRequest';

function getPath(token) {
  return `api/v1/verify_email/${token}.json`;
}

function parsePostBody(apiResponse) {
  const { body } = apiResponse.response;
  return body;
}

export default {
  post(apiOptions, token) {
    const path = getPath(token);
    return apiRequest(apiOptions, 'POST', path)
      .then(parsePostBody)
      .catch(parsePostBody);
  },
};
