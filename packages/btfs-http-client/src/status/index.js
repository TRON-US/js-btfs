'use strict'

const configure = require('../lib/configure')

module.exports = configure((ky) => {
  return async function * status (input, options) {
    options = options || {}

    const searchParams = new URLSearchParams(options)

    searchParams.set("arg", input.SessionId)

    var res = await ky.ndjson( 'storage/upload/status', {
      method: 'POST',
      timeout: options.timeout,
      signal: options.signal,
      headers: options.headers,
      searchParams: searchParams
    })
    for await (let upRes of res){
      yield upRes
    }
  }
})
