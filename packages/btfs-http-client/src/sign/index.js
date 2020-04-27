'use strict'

const homedir = require('homedir')
const configure = require('../lib/configure')
const toCamel = require('../lib/object-to-camel')
const path = require('path')
const protoGuard = require('../../js-btfs-common/master/js/protos/guard/guard_pb')
const protoEscrow = require('../../js-btfs-common/master/js/protos/escrow/escrow_pb')
const protoLedger = require('../../js-btfs-common/master/js/protos/ledger/ledger_pb')

const sessionUtils = require("../session/session-utils")

const peerId = require('peer-id')
var EC = require('elliptic').ec


function bnToBuf(bn) {
  var hex = BigInt(bn).toString(16)
  if (hex.length % 2) { hex = '0' + hex }
  var len = hex.length / 2
  var u8 = new Uint8Array(len)
  var i = 0
  var j = 0
  while (i < len) {
    u8[i] = parseInt(hex.slice(j, j+2), 16)
    i += 1
    j += 2
  }
  return u8
}

function rawFullPrivKey(privKey) {
  var ec = new EC('secp256k1')
  const key = ec.keyFromPrivate(privKey, 'bytes')
  const pubkey = key.getPublic()
  const x =  bnToBuf(pubkey.x.toString())
  const y =  bnToBuf(pubkey.y.toString())
  var publicKey = Buffer.concat([new Buffer([0x04]), new Buffer(x.slice(0,32)), new Buffer(y)])
  return publicKey
}

function rawFullPubKey(pubKey) {
  var ec = new EC('secp256k1')
  const key = ec.keyFromPublic(pubKey, 'bytes')
  const pubkey = key.getPublic()
  const x =  bnToBuf(pubkey.x.toString())
  const y =  bnToBuf(pubkey.y.toString())
  var publicKey = Buffer.concat([new Buffer([0x04]), new Buffer(x.slice(0,32)), new Buffer(y)])
  return publicKey
}

var signBalanceContract = function (privKey) {
  return new Promise(async (resolve, reject) => {
    const id = await peerId.createFromPrivKey(Buffer.from(privKey, 'base64')) //get the private key
    var pubKeyBytes = id._pubKey._key //get byte array of public key
    var lgPubKeyBuffer = new proto.ledger.PublicKey().setKey(pubKeyBytes).serializeBinary()
    var signature = await id.privKey.sign(lgPubKeyBuffer) //sign the public key
    var rawlgSignedPubKey = new proto.ledger.SignedPublicKey().setSignature(signature.toString('base64')).setKey(new proto.ledger.PublicKey().setKey(pubKeyBytes))
    var signedPubKeyBinary = rawlgSignedPubKey.serializeBinary()  //marshal ledgerSignedPublicKey into bytes -> signedBytes
    resolve (signedPubKeyBinary)
  })
}

var signPayChanContract = function (privKey, unsigned, totalPrice) {
  return new Promise(async (resolve, reject) => {
    const cryptoKeys = require('libp2p-crypto/src/keys')
    const idPriv = await peerId.createFromPrivKey(Buffer.from(privKey, 'base64')) //get the private key
    //var pubKeyBytes = idPriv._pubKey.bytes //get byte array of public key
    var unsignedBytes = Buffer.from(unsigned, "base64")//unsignedBytes, err := stringToBytes(unsignedData.Unsigned, Base64)
    var escrowPubKey = await peerId.createFromPubKey(unsignedBytes) //escrowPubKey, err := ic.UnmarshalPublicKey(unsignedBytes)
    const pubKey = await cryptoKeys.unmarshalPublicKey(escrowPubKey._pubKey.bytes,cryptoKeys.keysPBM.KeyType.Secp256k1)
    var toAddress = rawFullPubKey(pubKey._key)
    var fromAddress = rawFullPrivKey(idPriv.privKey._key)
    //var toAddress = escrowPubKey._pubKey.bytes
    var mSecTime = new Date().getTime() //need miniseconds ??
    var fromPublicKey = new proto.ledger.PublicKey().setKey(fromAddress)
    var toPublicKey = new proto.ledger.PublicKey().setKey(toAddress)
    var channelCommit =  new proto.ledger.ChannelCommit().setAmount(totalPrice).setPayerId(mSecTime).setPayer(fromPublicKey).setRecipient(toPublicKey)
    var buyerPrivKey = idPriv.privKey //buyerPrivKey, err := crypto.ToPrivKey(utils.PrivateKey)
    var buyerChanSign = await buyerPrivKey.sign(channelCommit.serializeBinary().buffer)//buyerChanSig, err := crypto.Sign(buyerPrivKey, chanCommit)
    var signedChanCommit = new proto.ledger.SignedChannelCommit().setChannel(channelCommit).setSignature(buyerChanSign)
    var signedChanCommitBytes = signedChanCommit.serializeBinary() //signedChanCommitBytes, err := proto.Marshal(signedChanCommit)
    resolve (signedChanCommitBytes)
  })
}

var signPayRequestContract = function (privKey, unsigned) {
  return new Promise(async (resolve, reject) => {
    const idPriv = await peerId.createFromPrivKey(Buffer.from(privKey, 'base64')) //get the private key
    var unsignedBytes = Buffer.from(unsigned, 'base64')
    var result = proto.escrow.SignedSubmitContractResult.deserializeBinary(unsignedBytes)
    var buyerChannelState = result.getResult().getBuyerChannelState()
    var signature = await idPriv.privKey.sign(buyerChannelState.getChannel().serializeBinary())
    buyerChannelState.setFromSignature(signature)
    var pubKeyBytes = idPriv._pubKey.bytes //get byte array of public key
    var payerPubKey = await peerId.createFromPubKey(pubKeyBytes) //get the private key//buyerPubKey, err := crypto.ToPubKey(utils.PublicKey)
    var rawFull = rawFullPubKey(payerPubKey._pubKey._key)
    var payInRequest = proto.escrow.PayinRequest.deserializeBinary()
        .setPayinId(result.getResult().getPayinId()).setBuyerAddress(rawFull).setBuyerChannelState(buyerChannelState)
    //payinSig, err := crypto.Sign(privKey, payinReq)
    var payinSig = await idPriv.privKey.sign(payInRequest.serializeBinary())
    var signedPayinReq = proto.escrow.SignedPayinRequest.deserializeBinary().setRequest(payInRequest).setBuyerSignature(payinSig)
    //signedPayinReqBytes, err := proto.Marshal(signedPayinReq)
    var signedPayinReqBytes = signedPayinReq.serializeBinary()
    resolve(signedPayinReqBytes)
  })
}

var signGuardSignContract = function (privKey, unsigned) {
  return new Promise(async (resolve, reject) => {
    var unsignedBytes = Buffer.from(unsigned, "base64")
    var meta = proto.guard.FileStoreMeta.deserializeBinary(unsignedBytes)
    const idPriv = await peerId.createFromPrivKey(Buffer.from(privKey, 'base64')) //get the private key
    var signed = await idPriv.privKey.sign(meta.serializeBinary())
    resolve (signed)
  })
}

var signGuardQuestions = function (privKey, unsigned) {
  return new Promise(async (resolve, reject) => {
    var unsignedBytes = Buffer.from(unsigned, "base64")
    var meta = proto.guard.FileChallengeQuestions.deserializeBinary(unsignedBytes)
    const idPriv = await peerId.createFromPrivKey(Buffer.from(privKey, 'base64')) //get the private key
    for (var i = 0 ; i < meta.getShardQuestionsList().length ; i++) {
      console.log("[i]",meta.getShardQuestionsList()[i])
      var signed = await idPriv.privKey.sign(meta.getShardQuestionsList()[i].serializeBinary())
      meta.getShardQuestionsList()[i].setPreparerSignature(signed)
    }
    resolve (meta.serializeBinary())
  })
}

var signWaituploadReq = function (privKey, unsigned) {
  return new Promise(async (resolve, reject) => {
    var unsignedBytes = Buffer.from(unsigned, "base64")
    var meta = proto.guard.CheckFileStoreMetaRequest.deserializeBinary(unsignedBytes)
    const idPriv = await peerId.createFromPrivKey(Buffer.from(privKey, 'base64')) //get the private key
    var signed = await idPriv.privKey.sign(meta.serializeBinary())
    resolve (signed)
  })
}

module.exports = configure((ky) => {
  return async function* sign(input, options) {
    options = options || {}
    var privKey = input.Session.getPrivateKey()

    const searchParams = new URLSearchParams(options.searchParams)
    const sessionStr = await sessionUtils.getSessionSignature(input)

    searchParams.append("arg", input.SessionId)
    searchParams.append("arg", input.Session.getPeerId())
    searchParams.append("arg", input.TimeNonce)
    searchParams.append("arg", sessionStr)

    //sign input here with` private key
    if (privKey != null) {
      //get contracts from input
      var unsigned = input.Unsigned
      let signedBytes

      switch (input.SessionStatus) {
        case "submit" :
          //sign contract
          signedBytes = await signBalanceContract(privKey)
          break
        case "submit:check-balance-req-singed" :
          signedBytes = await signPayChanContract(privKey, unsigned,input.Price)
          break
        case "pay" :
          signedBytes = await signPayRequestContract(privKey, unsigned)
          break
        case "guard":
          signedBytes = await signGuardSignContract(privKey, unsigned)
          break
        case "guard:file-meta-signed":
          signedBytes = await signGuardQuestions(privKey, unsigned)
          break
        case "wait-upload":
          signedBytes = await signWaituploadReq(privKey, unsigned)
          break
      }

      //add signed contracts to the searchParams
      searchParams.append("arg", input.SessionStatus)
      searchParams.append("arg", btoa(String.fromCharCode.apply(null, signedBytes)))

      let res
      yield res = await ky.ndjson('storage/upload/sign', {
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
  }
})
