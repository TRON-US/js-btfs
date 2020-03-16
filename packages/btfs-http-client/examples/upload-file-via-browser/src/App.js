'use strict'
const React = require('react')
const btfsClient = require('../../../../btfs-http-client/src/index')
const config = require("../config")

var errorCount = 0

class App extends React.Component {
  //BTFS-1437
  constructor () {
    super()
    this.state = {
      added_file_hash: null,
      added_session_id:  null,
      added_session_status: null,
      added_session_contracts: null,
      added_status_response: null,
    }

    this.btfs = btfsClient('/ip4/127.0.0.1/tcp/5001')

    // bind methods
    this.captureFile = this.captureFile.bind(this)
    this.saveToIpfs = this.saveToIpfs.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    //bing offline signing methods
    this.upload = this.upload.bind(this)
    this.displayStatus = this.displayStatus.bind(this)
    this.signBatch = this.signBatch.bind(this)
    this.sign = this.sign.bind(this)
    this.getBatch = this.getBatch.bind(this)
    this.getUnsignedData = this.getUnsignedData.bind(this)

    this.statusTimer = null
    this.stateTimer = null
    this.time = Date.now()

  }

  setTime(){
    this.time = Date.now()
  }

  addStatus(status) {
    let div = document.getElementById('contractStatus')
    if (this.state.added_status_response != null){
      div.innerHTML += "<h3>".concat(status).concat(": ").concat(this.state.added_status_response).concat("</h3>")
    }else {
      div.innerHTML += "<h3>".concat(status).concat("</h3>")
    }
  }

  async upload(event) {
    const response = this.btfs.upload(
      {
        Hash: this.state.added_file_hash,
        TimeNonce: this.time.toString(),
        PrivKey: config.PrivKey,
        PeerID: config.PeerID
      },
      { s: `16Uiu2HAmRfbc8E4ungNn3FWqhrKVbXotRLNk8fodgpcUeUP6nw83,16Uiu2HAmRfbc8E4ungNn3FWqhrKVbXotRLNk8fodgpcUeUP6nw83` }
    )
    try {
      for await (const resp of response) {
        this.state.added_session_id = resp.ID
      }
    } catch (err) {
      console.error(err)
    }
    this.displayStatus(event)
  }

  // Example #1
  // Add file to IPFS and return a CID
  async saveToIpfs (files) {
    const source = this.btfs.add(
      [...files],
      {
        progress: (prog) => console.log(`received: ${prog}`),
        chunker : "reed-solomon-1-1-256000"
      }
    )
    try {
      for await (const file of source) {
        console.log(file)
        this.setState({ added_file_hash: file.path })
      }
    } catch (err) {
      console.error(err)
    }
  }

  async getStatus(event) {
    let input  = {
      SessionId: this.state.added_session_id,
    }
    const statusResponse = this.btfs.statusSign(input, {})
    try {
      for await (const response of statusResponse) {
        this.state.added_session_status = response.Status
        this.state.added_status_response =  response.Message
      }
    } catch (err) {
      console.error(err)
    }
  }

  async sign(event, data) {
    let input  = {
      SessionId: this.state.added_session_id,
      SessionStatus: this.state.added_session_status,
      Hash: this.state.added_file_hash,
      Unsigned: data,
      TimeNonce: this.time,
      PrivKey: config.PrivKey,
      PeerID: config.PeerID

    }
    const signResponse = this.btfs.sign(input, {})
    try {
      for await (const response of signResponse) {
      }
    } catch (err) {
      console.error(err)
    }
  }

  async signBatch(event, contracts) {
    let input  = {
      SessionId: this.state.added_session_id,
      SessionStatus: this.state.added_session_status,
      Hash: this.state.added_file_hash,
      Contracts: contracts,
      TimeNonce: this.time,
      PrivKey: config.PrivKey,
      PeerID: config.PeerID
    }
    const signBatchResponse = this.btfs.signBatch(input, {"offline-sign-mode" : true })
    try {
      for await (const response of signResponse) {
      }
    } catch (err) {
      console.error(err)
    }
  }

  async getBatch(event) {
    let input  = {
      SessionId: this.state.added_session_id,
      SessionStatus: this.state.added_session_status,
      Hash: this.state.added_file_hash,
      TimeNonce: this.time,
      PrivKey: config.PrivKey,
      PeerID: config.PeerID
    }
    const batchResponse = this.btfs.getBatch(input, {})
    try {
      for await (const response of batchResponse) {
        input.Contracts = (response).Contracts
        const signBatchResponse = await this.btfs.signBatch(input, {})
        for await (const response of signBatchResponse ){
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  async getUnsignedData(event) {
    let input  = {
      SessionId: this.state.added_session_id,
      SessionStatus: this.state.added_session_status,
      Hash: this.state.added_file_hash,
      TimeNonce: this.time,
      PrivKey: config.PrivKey,
      PeerID: config.PeerID
    }
    const unsignedDataResponse = this.btfs.getUnsigned(input, {})
    try {
      for await (const response of unsignedDataResponse) {
        input.Unsigned = response.Unsigned
        input.Opcode = response.Opcode
        input.Price = response.Price
        const unsignedDataResponse = await this.btfs.sign(input, {}, {})
        for await (const response of unsignedDataResponse ){
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  displayStatus(event) {
    this.statusTimer = setInterval(() => {
      this.getStatus(event)
      if (errorCount > 9){
        //after 10 error, cancel both timers
        clearTimeout(this.statusTimer)
        clearTimeout(this.stateTimer)
      }
    }, 1000)

    this.stateTimer = setInterval(async () => {
      console.log(this.state.added_session_status)
      switch (this.state.added_session_status) {
        case "uninitialized":
          this.addStatus(this.state.added_session_status)
          break
        case "initSignReadyEscrow":
          this.addStatus(this.state.added_session_status)
          await this.getBatch(event)
          break
        case "initSignReadyGuard":
          this.addStatus(this.state.added_session_status)
          this.getBatch(event)
          break
        case "balanceSignReady":
        case "payChannelSignReady":
        case "payRequestSignReady":
        case "guardSignReady":
          this.getUnsignedData(event)
          this.addStatus(this.state.added_session_status)
          break
        case "init":
          this.addStatus(this.state.added_session_status)
          break
        case "complete":
          this.addStatus(this.state.added_session_status)
          clearTimeout(this.statusTimer)
          clearTimeout(this.stateTimer)
          break
        case "done":
          this.addStatus(this.state.added_session_status)
          clearTimeout(this.statusTimer)
          break
        case "error":
          errorCount = errorCount + 1
          this.addStatus(this.state.added_session_status)
          break;
        default:
          break;
      }
    }, 3000)
  }

  captureFile (event) {
    event.stopPropagation()
    event.preventDefault()
    if (document.getElementById('keepFilename').checked) {
      this.saveToIpfsWithFilename(event.target.files)
    } else {
      this.saveToIpfs(event.target.files)
    }
  }

  // Example #2
  // Add file to BTFS and wrap it in a directory to keep the original filename
  saveToIpfsWithFilename (files) {
    const file = [...files][0]
    let btfsId
    const fileDetails = {
      path: file.name,
      content: file
    }
    const options = {
      wrapWithDirectory: true,
      progress: (prog) => console.log(`received: ${prog}`),
      chunker : "reed-solomon-1-1-256000"
    }
    this.btfs.add(fileDetails, options)
      .then((response) => {
        console.log(response)
        // CID of wrapping directory is returned last
        btfsId = response[response.length - 1].hash
        console.log(btfsId)
        this.setState({ added_file_hash: btfsId })
        errorCount = 0
        this.setTime()
      }).catch((err) => {
      console.error(err)
    })
  }

  handleSubmit (event) {
    event.preventDefault()
  }


  render () {
    return (
      <div>
        <form id="myKeys" onSubmit={this.handleSubmit}>
        </form>
        <h2>File upload demo</h2>
        <form id='captureMedia' onSubmit={this.handleSubmit}>
          <input type='file' onChange={this.captureFile} />
          <label htmlFor='keepFilename'><input type='checkbox' id='keepFilename' name='keepFilename' /> keep filename</label>
        </form>
        <div>
          <a target='_blank'
             href={'https://ipfs.io/ipfs/' + this.state.added_file_hash}>
            {this.state.added_file_hash}
          </a>
        </div>
        <h2>Offline signing demo</h2>
        <form id='captureMedia' onSubmit={this.handleSubmit}>
          <input type='text' id='filehash' name='filehash' value={this.state.added_file_hash}/><br/>
          <button onClick={this.upload}>Upload file hash</button>
        </form>
        <div id="contractStatus">
        </div>
      </div>
    )
  }
}
module.exports = App
