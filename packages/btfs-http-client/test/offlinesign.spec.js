/* eslint-env mocha */
/* eslint max-nested-callbacks: ["error", 8] */
'use strict'

const { expect } = require('interface-ipfs-core/src/utils/mocha')
const ipfsClient = require('../src')

let ipfs

describe('.offlineSign', () => {
  before(async function () {
    ipfs = (await f.spawn()).api
  })
  it('should test functions of offline signing', async () => {

    var opts = {
      progress: (prog) => console.log(`received: ${prog}`),
        chunker : "reed-solomon-1-1-256000"
    }

    var upOpts = {
      Hash: this.state.added_file_hash,
        TimeNonce: this.time.toString(),
      PrivKey: config.PrivKey,
      PeerID: config.PeerID
    }
    //test add function
    const res = await all(ipfs.add(testfile,opts))
    expect(res).to.have.length(1)
    expect(res[0].cid.toString()).to.equal(expectedMultihash)
    expect(res[0].path).to.equal(expectedMultihash)

    //test upload function
    const responseUpload = ipfs.upload(upOpts)
    expect(responseUpload.ID).to.equal('127.0.0.1')

    //get status
    const reponseStatus = ipfs.statusSign(upOpts)
    expect(reponseStatus.Status).to.equal('initSignReadyEscrow')


  })
})
