'use strict'

const configure = require('../lib/configure')
const toCamel = require('../lib/object-to-camel')
const peerId = require('peer-id')

function sessionSignature(peerId, hash, time) {
  return peerId + ":" + hash + ":" + time.toString()
}

module.exports = configure((api) => {
  return async function * upload (input, options = {}) {

    options = options || {}

    const searchParams = new URLSearchParams(options.searchParams)
    var privKey = input.PrivKey
    const idPriv = await peerId.createFromPrivKey(Buffer.from(privKey, 'base64')) //get the private key

    searchParams.append("arg", input.Hash)
    searchParams.append("arg", input.PeerID)
    searchParams.append("arg", input.TimeNonce)
    searchParams.append("arg",  await idPriv.privKey.sign(Buffer.from(sessionSignature(input.PeerID, input.Hash, input.TimeNonce))))
    searchParams.set('m', "custom")
    searchParams.set('s', options.s.toString())

    const res = api.ndjson( 'storage/upload/offline', {
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
