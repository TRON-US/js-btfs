/* eslint-env mocha */
/* eslint max-nested-callbacks: ["error", 8] */
'use strict'

const { expect } = require('interface-btfs-core/src/utils/mocha')
const loadFixture = require('aegir/fixtures')
const all = require('it-all')
const testfile = loadFixture('test/fixtures/testfile.txt')
const f = require('./utils/factory')()
const btfsClient = require('../src')

let btfs
let time
let status
let sessionId
let contracts

describe('.offlineSign', () => {
  before(async function () {
    btfs = btfsClient('http://127.0.0.1:5001/api/v0/')
    time = Date.now()
  })

  it('should successfully sign sample contract ', async () => {

    const expectedMultihash = 'QmRoACBEDRtT1GF9WE21qHGgZSNPsL3zbTawC24Gnfk5bb'

    before(async () => {
      btfs = (await f.spawn()).api
    })

    after(() => f.clean())

    var addOpts = {
      progress: (prog) => console.log(`received: ${prog}`),
        chunker : "reed-solomon-1-1-256000"
    }

    var upOpts = {
      Hash: expectedMultihash,
      TimeNonce: time,
      PeerID : "16Uiu2HAm5KyUqXm7gZb5ECj4vDWVVjVuzNoj7cNM3Q7Eoz5Vsj2D",
      PrivKey: "CAISIAHU0I1KRRe0LvFEXXaIOT9aDa3RTSUc488JmHj4kCbW"
    }
    var s = { s: `16Uiu2HAmRfbc8E4ungNn3FWqhrKVbXotRLNk8fodgpcUeUP6nw83,16Uiu2HAmRfbc8E4ungNn3FWqhrKVbXotRLNk8fodgpcUeUP6nw83` }

    //test add function
    const res = await all(btfs.add(testfile,addOpts))
    expect(res).to.have.length(1)
    expect(res[0].cid.toString()).to.equal(expectedMultihash)
    expect(res[0].path).to.equal(expectedMultihash)

    //test upload function
    const responseUpload = await all(btfs.upload(upOpts, s))

    for await (const response of responseUpload) {
      sessionId = response.ID
      await expect(response.ID.length).to.equal("75a2bca4-1924-46a0-99f8-298a3294e594".length)
    }

    //Testing init payment
    //escrow
    //get status
    var inputSessionId = {SessionId: sessionId}
    const reponseStatusEscrow = await btfs.statusSign(inputSessionId)
    for await (const response of reponseStatusEscrow) {
      status = response.Status
      expect(response.Status).to.equal('initSignReadyEscrow')
    }

    let inputBatch  = {
      SessionId: inputSessionId.SessionId,
      SessionStatus: status,
    }

    Object.assign(inputBatch, upOpts)

    //get contracts escrow
    const responseBatchEscrow = await btfs.getBatch(inputBatch)

    for await (const response of responseBatchEscrow) {
      contracts = response
      expect(response.Contracts).to.not.equal(null)
    }

    for await (const response of await btfs.statusSign(inputSessionId)) {
      status = response.Status
      expect(response.Status).to.equal('initSignProcessEscrow')
    }

    //add contracts to the input batch to  be signed
    inputBatch.Contracts = contracts
    inputBatch.SessionStatus = status

    //sign escrow contracts
    const reponseSignEscrowBatch = await btfs.signBatch(inputBatch)
    for await (const response of reponseSignEscrowBatch) {
    }

    /*
    //guard
    for await (const response of await btfs.statusSign(inputSessionId)) {
      status = response.Status
      expect(response.Status).to.equal('initSignProcessGuard')
    }

    var inputGaurdBatch = {
      SessionId: inputSessionId.SessionId,
        SessionStatus: status,
    }

    Object.assign(inputGaurdBatch, upOpts )
    //get contracts guard
    const responseBatchGuard = await btfs.getBatch(inputGaurdBatch)

    for await (const response of responseBatchGuard) {
      contracts = response
      console.log(response)
      expect(response.Contracts).to.not.equal(null)
    }

    //add contracts to the input batch to  be signed
    inputBatch.Contracts = contracts
    inputBatch.SessionStatus = status
    console.log(inputBatch)

    //sign escrow contracts
    const reponseSignGuard = await btfs.signBatch(inputBatch)
    for await (const response of reponseSignGuard) {
    }

    //add contracts to the input batch to  be signed
    inputBatch.Contracts = contracts
    inputBatch.SessionStatus = status
    console.log(inputBatch)

    //sign guard contracts
    const responseSignGuard = await btfs.signBatch(inputBatch)
    for await (const response of responseSignGuard) {
    }
    */
    //reference the demo app for more examples on how to use api
  })
})
