'use strict'

const { Buffer } = require('buffer')
const CID = require('cids')
const globSource = require('ipfs-utils/src/files/glob-source')
const urlSource = require('ipfs-utils/src/files/url-source')

function btfsClient (config) {
  return {
    add: require('./add')(config),
    bitswap: require('./bitswap')(config),
    block: require('./block')(config),
    bootstrap: require('./bootstrap')(config),
    cat: require('./cat')(config),
    commands: require('./commands')(config),
    config: require('./config')(config),
    dag: require('./dag')(config),
    dht: require('./dht')(config),
    diag: require('./diag')(config),
    dns: require('./dns')(config),
    files: require('./files')(config),
    get: require('./get')(config),
    getEndpointConfig: require('./get-endpoint-config')(config),
    id: require('./id')(config),
    key: require('./key')(config),
    log: require('./log')(config),
    ls: require('./ls')(config),
    mount: require('./mount')(config),
    name: require('./name')(config),
    object: require('./object')(config),
    pin: require('./pin')(config),
    ping: require('./ping')(config),
    pubsub: require('./pubsub')(config),
    refs: require('./refs')(config),
    repo: require('./repo')(config),
    resolve: require('./resolve')(config),
    stats: require('./stats')(config),
    stop: require('./stop')(config),
    shutdown: require('./stop')(config),
    swarm: require('./swarm')(config),
    version: require('./version')(config),
    upload: require('./upload')(config),
    statusSign: require('./status')(config),
    getBatch: require('./getbatch')(config),
    sign: require('./sign')(config),
    signBatch: require('./signbatch')(config),
    getUnsigned: require('./getunsigned')(config)
  }
}

Object.assign(btfsClient, { Buffer, CID, globSource, urlSource })

module.exports = btfsClient
