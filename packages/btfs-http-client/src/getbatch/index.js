'use strict'

const configure = require('../lib/configure')
const peerId = require('peer-id')
const sessionUtils = require("../session/session-utils")

module.exports = configure(( ky ) => {
  return async function* batch(input, options) {

    options = options || {}

    const searchParams = new URLSearchParams(options.searchParams)
    const idPriv = await peerId.createFromPrivKey(Buffer.from(input.Session.getPrivateKey(), 'base64')) //get the private key
    const sessionStr = await sessionUtils.getSessionSignature(input)

    searchParams.append("arg", input.SessionId)
    searchParams.append("arg", input.Session.getPeerId())
    searchParams.append("arg", input.TimeNonce)
    searchParams.append("arg",sessionStr)
    searchParams.append("arg", input.Type)

    const res = await ky.ndjson('storage/upload/getcontractbatch', {
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
