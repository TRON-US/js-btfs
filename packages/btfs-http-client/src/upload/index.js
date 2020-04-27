'use strict'

const configure = require('../lib/configure')
const toCamel = require('../lib/object-to-camel')
const peerId = require('peer-id')
const sessionUtils = require('../session/session-utils')

module.exports = configure((api) => {
  return async function * upload (input, options = {}) {

    options = options || {}

    const searchParams = new URLSearchParams(options.searchParams)
    var offlinePeerSessionSignature = await sessionUtils.newSessionSignature(input,false)

    searchParams.append("arg", input.Hash)
    searchParams.append("arg", input.Session.getPeerId())
    searchParams.append("arg", input.TimeNonce)
    searchParams.append("arg", offlinePeerSessionSignature)

    const res = api.ndjson( 'storage/upload', {
      method: 'POST',
      timeout: options.timeout,
      signal: options.signal,
      headers: options.headers,
      searchParams
    })
    for await (let upRes of res){
      yield upRes
    }
  }
})
