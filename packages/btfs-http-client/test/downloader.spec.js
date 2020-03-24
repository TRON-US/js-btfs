/* eslint-env mocha */
'use strict'

const { expect } = require('interface-ipfs-core/src/utils/mocha')
const downloader = require("../../btfs-http-client/src/downloader")
const fs = require('fs-extra')

describe('.downloader', function () {
  this.timeout(60 * 1000)

  before(async () => {
  })

  after(async () => {
  })

  it('download all dependency files to local', async () => {
    var filePath = ['guard', 'ledger', 'escrow']
    for (let i = 0 ; i < filePath.length ; i++ ) {
      //download each file to local directory
      await downloader(filePath[i])
    }
  })
})
