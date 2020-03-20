const apiSessionStruct = require("../src/session/session")
const sessionUtils = require("../src/session/session-utils")
const { expect } = require('interface-ipfs-core/src/utils/mocha')


describe('.session', () => {

  const PeerID = "16Uiu2HAm5KyUqXm7gZb5ECj4vDWVVjVuzNoj7cNM3Q7Eoz5Vsj2D"
  const PrivKey = "CAISIAHU0I1KRRe0LvFEXXaIOT9aDa3RTSUc488JmHj4kCbW"
  var session = new apiSessionStruct(PrivKey, PeerID)

  var input_ = {
    Hash : "QmUfZ9rAdhV5ioBzXKdUTh2ZNsz9bzbkaLVyQ8uc8pj21F",
    TimeNonce: "1584662938746",
    Session: session
  }

  before(async function () {

  })

  it('should successfully test session', async() => {
    expect(session.getPrivateKey()).to.equals(PrivKey)
    expect(session.getPeerId()).to.equals(PeerID)
    expect(await sessionUtils.newSessionSignature(input_, false)).to.equals("MEUCIQDbDgUbGldJVBvs3XgATfQGInW3cEdBuyoBnTuiB4lpyAIgYwmdv3iEvJiaF2/50gwJb+7/P1cMyr6QyFZz0pxcgTg=")
  })

  it('should successfully test verification', async() => {
    const peerIdJS = require('peer-id')
    var inputDataStr = input_.Hash + input_.Session.getPeerId() + input_.TimeNonce
    console.log(inputDataStr)
    var session = new apiSessionStruct(PrivKey, PeerID)
    session.setSignature("MEUCIQDbDgUbGldJVBvs3XgATfQGInW3cEdBuyoBnTuiB4lpyAIgYwmdv3iEvJiaF2/50gwJb+7/P1cMyr6QyFZz0pxcgTg=")
    var peerId = await peerIdJS.createFromPrivKey(Buffer.from(session.getPrivateKey(), 'base64'))
    expect(await sessionUtils.verifySessionSignature(peerId,inputDataStr, await peerId.privKey.sign(Buffer.from(inputDataStr)))).to.equals(true)
  })

})



