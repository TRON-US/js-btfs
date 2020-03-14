'use strict'

const configure = require('../lib/configure')
const peerId = require('peer-id')

function sessionSignature(peerId, hash, time) {
  return peerId + ":" + hash + ":" + time.toString()
}

module.exports = configure(({ ky }) => {
  return async function* getunsigned(input, options) {
    //BTFS-1437
    options = options || {}

    const searchParams = new URLSearchParams(options.searchParams)
    const idPriv = await peerId.createFromPrivKey(Buffer.from(input.PrivKey, 'base64')) //get the private key
    const sessionBuff = Buffer.from(sessionSignature(input.PeerID, input.Hash, input.TimeNonce))

    searchParams.append("arg", input.SessionId)
    searchParams.append("arg", input.PeerID)
    searchParams.append("arg", input.TimeNonce)
    searchParams.append("arg" , await idPriv.privKey.sign(sessionBuff))
    searchParams.append("arg", input.SessionStatus)

    const res = await ky.post('storage/upload/getunsigned', {
      timeout: options.timeout,
      signal: options.signal,
      headers: options.headers,
      searchParams
    }).json()

    yield res
  }
})
