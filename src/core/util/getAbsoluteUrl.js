/**
 * @name getAbsoluteUrl
 * @summary Combines and returns the given root URL and path
 * @param {String} rootUrl URL ending with /
 * @param {String} path Path that may or may not start with /
 * @returns {String} Full URL
 */
export default function getAbsoluteUrl(rootUrl, path = "") {
  // Check if the path is already absolute
  const regExp = /^https?:\/\/|^\/\//i;
  if (regExp.test(path)) {
    return path;
  }

  let pathNoSlash = path;
  if (path.startsWith("/")) {
    pathNoSlash = path.slice(1);
  }

  return `${rootUrl}${pathNoSlash}`;
}
