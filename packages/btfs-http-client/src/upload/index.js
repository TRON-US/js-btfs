'use strict'

const configure = require('../lib/configure')
const toIterable = require('../lib/stream-to-iterable')
const toCamel = require('../lib/object-to-camel')
const peerId = require('peer-id')
const ndjson = require('iterable-ndjson')

function sessionSignature(peerId, hash, time) {
  return peerId + ":" + hash + ":" + time.toString()
}

module.exports = configure(({ ky }) => {
  return async function * upload (input, options) {
    //BTFS-1437
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

    var res = await ky.post( 'storage/upload/offline', {
      timeout: options.timeout,
      signal: options.signal,
      headers: options.headers,
      searchParams
    }).json()

    yield res
  }
})

