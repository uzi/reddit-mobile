import { extractUser } from './experiments';

const { keys } = Object;

function featureToTaglist(name, data) {
  const tags = [];

  if (data instanceof Object) {
    tags.push(`${name}`);
    tags.push(`${name}_variant_${data.variant}`);
    tags.push(`${name}_id_${data.experiment_id}`);
  }

  return tags;
}

export default function extractTagList(state) {
  const user = extractUser(state);

  if (!user) { return []; }

  const features = user.features;

  const tags = keys(features)
    .filter(name => /xpromo/.test(name))
    .map(name => featureToTaglist(name, features[name]))
    .reduce((a, x) => [...a, ...x], []);

  if (state.platform.incognito) {
    tags.push('client_settings_empty');
  }

  return tags;
}
