const manifest = require('./manifest')

module.exports = function assetUrl (url, baseUrl) {
  if (baseUrl) {
    return baseUrl + manifest[url]
  }
  return manifest[url]
}
