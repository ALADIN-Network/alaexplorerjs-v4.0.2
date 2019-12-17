/* eslint-env mocha */
const assert = require('assert')
const Fcbuffer = require('alafcbuffer20')

const Ala = require('.')

describe('shorthand', () => {

  it('asset', () => {
    const ala = Ala.Testnet()
    const {types} = ala.fc
    const AssetType = types.asset()

    assertSerializer(AssetType, '1.0000 ALA')

    const obj = AssetType.fromObject('1 ALA')
    assert.equal(obj, '1.0000 ALA')

    const obj2 = AssetType.fromObject({amount: 10000, symbol: 'ALA'})
    assert.equal(obj, '1.0000 ALA')
  })

  it('authority', () => {
    const ala = Ala.Testnet()
    const {authority} = ala.fc.structs

    const pubkey = 'ALA8dM36QedcUfPTNF7maThtRqHP5xvCqMsYiHUz1Rz7sPfhvCYuo'
    const auth = {threshold: 1, keys: [{key: pubkey, weight: 1}], accounts: []}

    assert.deepEqual(authority.fromObject(pubkey), auth)
    assert.deepEqual(authority.fromObject(auth), auth)
  })

  it('public_key', () => {
    const ala = Ala.Testnet()
    const {structs, types} = ala.fc
    const PublicKeyType = types.public_key()
    const pubkey = 'ALA8dM36QedcUfPTNF7maThtRqHP5xvCqMsYiHUz1Rz7sPfhvCYuo'
    // 02c0ded2bc1f1305fb0faac5e6c03ee3a1924234985427b6167ca569d13df435cf
    assertSerializer(PublicKeyType, pubkey)
  })

  it('asset_symbol', () => {
    const ala = Ala.Testnet()
    const {types} = ala.fc
    const AssetSymbolType = types.asset_symbol()

    assertSerializer(AssetSymbolType, 'ALA')

    const obj = AssetSymbolType.fromObject('ALA')
    const buf = Fcbuffer.toBuffer(AssetSymbolType, obj)
    assert.equal(buf.toString('hex'), '04454f5300000000')
  })

})

describe('Message.data', () => {
  it('json', () => {
    const ala = Ala.Testnet({forceMessageDataHex: false})
    const {structs, types} = ala.fc
    const value = {
      code: 'ala',
      type: 'transfer',
      data: {
        from: 'inita',
        to: 'initb',
        amount: '1',
        memo: ''
      },
      authorization: []
    }
    assertSerializer(structs.message, value)
  })

  it('hex', () => {
    const ala = Ala.Testnet({forceMessageDataHex: false, debug: false})
    const {structs, types} = ala.fc

    const tr = {from: 'inita', to: 'initb', amount: '1', memo: ''}
    const hex = Fcbuffer.toBuffer(structs.transfer, tr).toString('hex')
    // const lenPrefixHex = Number(hex.length / 2).toString(16) + hex.toString('hex')

    const value = {
      code: 'ala',
      type: 'transfer',
      data: hex,
      authorization: []
    }
    
    const type = structs.message
    const obj = type.fromObject(value) // tests fromObject
    const buf = Fcbuffer.toBuffer(type, obj) // tests appendByteBuffer
    const obj2 = Fcbuffer.fromBuffer(type, buf) // tests fromByteBuffer
    const obj3 = type.toObject(obj) // tests toObject

    assert.deepEqual(Object.assign({}, value, {data: tr}), obj3, 'serialize object')
    assert.deepEqual(obj3, obj2, 'serialize buffer')
  })

  it('force hex', () => {
    const ala = Ala.Testnet({forceMessageDataHex: true})
    const {structs, types} = ala.fc
    const value = {
      code: 'ala',
      type: 'transfer',
      data: {
        from: 'inita',
        to: 'initb',
        amount: '1',
        memo: ''
      },
      authorization: []
    }
    const type = structs.message
    const obj = type.fromObject(value) // tests fromObject
    const buf = Fcbuffer.toBuffer(type, obj) // tests appendByteBuffer
    const obj2 = Fcbuffer.fromBuffer(type, buf) // tests fromByteBuffer
    const obj3 = type.toObject(obj) // tests toObject

    const data = Fcbuffer.toBuffer(structs.transfer, value.data)
    const dataHex = //Number(data.length).toString(16) + 
      data.toString('hex')

    assert.deepEqual(Object.assign({}, value, {data: dataHex}), obj3, 'serialize object')
    assert.deepEqual(obj3, obj2, 'serialize buffer')
  })

  it('unknown type', () => {
    const ala = Ala.Testnet({forceMessageDataHex: false})
    const {structs, types} = ala.fc
    const value = {
      code: 'ala',
      type: 'mytype',
      data: '030a0b0c',
      authorization: []
    }
    assertSerializer(structs.message, value)
  })
})

function assertSerializer (type, value) {
  const obj = type.fromObject(value) // tests fromObject
  const buf = Fcbuffer.toBuffer(type, obj) // tests appendByteBuffer
  const obj2 = Fcbuffer.fromBuffer(type, buf) // tests fromByteBuffer
  const obj3 = type.toObject(obj) // tests toObject

  assert.deepEqual(value, obj3, 'serialize object')
  assert.deepEqual(obj3, obj2, 'serialize buffer')
}
