/**
 * Force an url to be https.
 */
export default function (url: string): string {
  if (!url.startsWith('http')) { return `https://${url}`; }
  return url.replace(/^http:\/\//i, 'https://');
}
