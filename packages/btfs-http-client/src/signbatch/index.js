'use strict'

const configure = require('../lib/configure')
const toCamel = require('../lib/object-to-camel')
const protoGuard = require('../../js-btfs-common/master/js/protos/guard/guard_pb')
const protoEscrow = require('../../js-btfs-common/master/js/protos/escrow/escrow_pb')
const peerId = require('peer-id')
const sessionUtils = require("../session/session-utils")

var signContract = function (privKey, contract, sessionStatus) {
  return new Promise(async (resolve, reject) => {
      var by = Buffer.from(contract,'base64') // contract in string <- 1. OK
      const id = await peerId.createFromPrivKey(Buffer.from(privKey, 'base64'))
      let raw
      if (sessionStatus == 'initSignReadyEscrow' || sessionStatus == "initSignProcessEscrow"){
          raw = proto.escrow.EscrowContract.deserializeBinary(by).serializeBinary()
      }
      else if (sessionStatus == 'initSignReadyGuard' || sessionStatus == "initSignProcessGuard") {
          raw = proto.guard.ContractMeta.deserializeBinary(by).serializeBinary()
      }
     const signature = await id.privKey.sign(Buffer.from(raw,'base64'))
     var signC = (signature.toString('base64'))
     resolve(signC)
  })
}

module.exports = configure((ky) => {
  return async function * signbatch(input, options) {
    options = options || {}
    const idPriv = await peerId.createFromPrivKey(Buffer.from(input.Session.getPrivateKey(), 'base64')) //get the private key
    const sessionStr = await sessionUtils.getSessionSignature(input)

    const searchParams = new URLSearchParams(options)

    searchParams.append("arg", input.SessionId)
    searchParams.append("arg", input.Session.getPeerId())
    searchParams.append("arg", input.TimeNonce)
    searchParams.append("arg", sessionStr)
    searchParams.append("arg", input.SessionStatus)

    var contracts = input.Contracts

    //check the existance of private key
    if (input.Session.getPrivateKey() != null) {
      //get contracts from input
      for (var i = 0 ; i < contracts.length ; i++) {
          input.Contracts[i].contract = await signContract(input.Session.getPrivateKey(), input.Contracts[i].contract, input.SessionStatus)
      }
      //add signed contracts to the searchParams
      searchParams.append("arg", JSON.stringify(input.Contracts))

      let res
      res = await ky.ndjson('storage/upload/signcontractbatch', {
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
  }
})
