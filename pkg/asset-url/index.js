const manifest = require('./manifest')

module.exports = function assetUrl (url) {
  return manifest[url]
}
