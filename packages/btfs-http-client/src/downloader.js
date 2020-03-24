'use strict'

const req = require("superagent")
const path = require('path')
const fs = require('fs-extra')
const homedir = require('homedir')

const filePath = ['guard', 'ledger', 'escrow']

async function downloader(folder) {
  const dir = path.join(homedir(), 'go-btfs-common', 'master', 'js', 'protos', folder)
  let filePath = path.join(dir, `${folder}_pb.js`)
  await fs.ensureDir(path.join(dir))
  const url = `https://tron-us.github.io/go-btfs-common/js/protos/${folder}/${folder}_pb.js`
  const res = await req.get(url).responseType('blob')
  if (res && res.body) {
    await fs.writeFile(path.resolve(dir, `${folder}_pb.js`), res.body)
    // double check
    if (!fs.existsSync(filePath)) {
      console.error('Error. Permission required.')
    } else {
      console.info(folder + " downloaded.")
    }
  } else {
    console.error('Error. Wrong file name.')
  }
}

async function processor() {
  for ( var i = 0 ; i < filePath.length ; i++ ){
    await downloader(filePath[i])
  }
}

processor().then(()=> {})

module.exports = downloader

