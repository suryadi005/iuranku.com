function getContinueUrl (query = {}) {
  if (query.continue) {
      const homeUrl = new URL(process.env.HOME_URL)
      const continueUrl = new URL(query.continue, process.env.HOME_URL)
      if (continueUrl.host === homeUrl.host) {
          continueUrl.encodedFullPath = continueUrl.pathname + continueUrl.search
          return continueUrl
      }
  }
  return undefined
}

module.exports = getContinueUrl
