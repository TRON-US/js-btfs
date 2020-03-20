const ApiConfigStruct = require('../session/session')

module.exports = {

  newSessionSignature : async (input, verifyBefore) => {
    const peerId = require('peer-id')
    var inputDataStr = input.Hash + input.Session.getPeerId() + input.TimeNonce
    var key = await peerId.createFromPrivKey(input.Session.getPrivateKey())
    const byteSignature = await key.privKey.sign(Buffer.from(inputDataStr))
    var sigStr = Buffer.from(byteSignature).toString("base64")
    input.Session.setSignature(sigStr)

    if (verifyBefore) {
      if (!(await verifySessionSignature(key, inputDataStr, byteSignature))) {
        return false
      }
    }
    return sigStr
  },

  verifySessionSignature: async (peerId, inputDataStr, byteSignature) => {
    var inputDataBytes = Buffer.from(inputDataStr)
    var verified = await peerId.pubKey.verify(inputDataBytes, byteSignature)
    if (verified != true) {
      return false
    }
    return true
  },

  getSessionSignature: async (input) => {
    return input.Session.getSessionKey()
  },
}


