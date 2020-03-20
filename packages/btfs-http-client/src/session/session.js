'use strict'

var apiConfigStruct = class ApiConfigStruct {
  constructor(PrivKey, PeerId, SessionKey, PublicKey){
    this._PrivateKey = PrivKey
    this._PeerId   = PeerId
    this._SessionKey = SessionKey
    this._PublicKey = PublicKey

    this.getSessionKey = this.getSessionKey.bind(this)
    this.getPrivateKey = this.getPrivateKey.bind(this)
    this.getPeerId = this.getPeerId.bind(this)
    this.setSignature = this.setSignature.bind(this)

  }
  getPrivateKey(){
    return this._PrivateKey
  }
  getPublicKey(){
    return this._PublicKey
  }
  getPeerId(){
    return this._PeerId
  }
  getSessionKey()
  {
    return this._SessionKey
  }
  setSignature(sessionKey){
    this._SessionKey = sessionKey
  }

}



module.exports = apiConfigStruct

