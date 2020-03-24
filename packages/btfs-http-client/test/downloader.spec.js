/* eslint-env mocha */
'use strict'

const { expect } = require('interface-ipfs-core/src/utils/mocha')
const downloader = require("../../btfs-http-client/src/downloader")
const fs = require('fs-extra')

describe('.downloader', function () {
  this.timeout(60 * 1000)
  var filePath = ['guard', 'ledger', 'escrow']

  before(async () => {
  })

  after(async () => {
    for (var i = 0 ; i < filePath.length ; i++) {
      const dir = path.join(__dirname+"/../", 'js-btfs-common', 'master', 'js', 'protos', filePath[i])
      fs.removeSync(dir);
    }
  })

  it('download all dependency files to local', async () => {

    for (let i = 0 ; i < filePath.length ; i++ ) {
      //download each file to local directory
      await downloader(filePath[i])
    }
  })
})
