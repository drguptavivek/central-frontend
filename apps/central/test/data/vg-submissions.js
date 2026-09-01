import { T } from 'ramda';

import { wktToGeojson } from '../util/data';
import { extendedSubmissions } from './submissions';

const firstGeojson = (value, path = []) => {
  if (typeof value === 'string') {
    const geojson = wktToGeojson(value);
    return geojson == null
      ? null
      : { ...geojson, fieldpath: '/' + path.join('/') };
  }
  if (value == null || typeof value !== 'object') return null;

  for (const [key, child] of Object.entries(value)) {
    const geojson = firstGeojson(child, [...path, key]);
    if (geojson != null) return geojson;
  }
  return null;
};

const submissionToGeojson = (submission) => {
  const geojson = firstGeojson(submission._odata);
  return geojson == null
    ? null
    : {
      ...geojson,
      id: submission._odata.__id,
      properties: { fieldpath: geojson.fieldpath }
    };
};

export const submissionGeojson = (filterExpression = T) => ({
  type: 'FeatureCollection',
  features: extendedSubmissions.sorted()
    .filter(filterExpression)
    .map(submissionToGeojson)
    .filter(geojson => geojson != null)
});
