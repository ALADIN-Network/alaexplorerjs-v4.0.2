const ecc = require('alaexplorerjs-v4.0.2-ecc-v1.6.1')
const json = require('alaexplorerjs-v4.0.2-json-v2.0.2')
const Fcbuffer = require('alaexplorerjs-fcbuffer-v2.0.0')
const api = require('alaexplorerjs-v4.0.2-api-v2.0.1')

const Structs = require('./structs')
const AbiCache = require('./abi-cache')
const writeApiGen = require('./write-api')
const assert = require('assert')

const Ala = {}

module.exports = Ala

Ala.modules = {
  json,
  ecc,
  api,
  Fcbuffer
}

// Ala.Mainnet = config => ..

Ala.Testnet = config => {
  const Network = api.Testnet
  const network = Network(Object.assign({}, {apiLog: consoleObjCallbackLog}, config))
  const alaConfig = Object.assign({}, {transactionLog: consoleObjCallbackLog}, config)
  return createAla(alaConfig, Network, network)
}

function createAla(config, Network, network) {
  const abiCache = AbiCache(network, config)
  config = Object.assign({}, config, {network, abiCache})

  if(!config.chainId) {
    config.chainId = '00'.repeat(32)
  }

  const ala = mergeWriteFunctions(config, Network)

  if(!config.signProvider) {
    config.signProvider = defaultSignProvider(ala, config)
  }

  return ala
}

function consoleObjCallbackLog(error, result, name) {
  if(error) {
    if(name) {
      console.error(name, 'error')
    }
    console.error(error);
  } else {
    if(name) {
      console.log(name, 'reply:')
    }
    console.log(JSON.stringify(result, null, 4))
  }
}

/**
  Merge in write functions (operations).  Tested against existing methods for
  name conflicts.

  @arg {object} config.network - read-only api calls
  @arg {object} Network - api[Network] read-only api calls
  @return {object} - read and write method calls (create and sign transactions)
  @throw {TypeError} if a funciton name conflicts
*/
function mergeWriteFunctions(config, Network) {
  assert(config.network, 'network instance required')

  const {network} = config
  const {structs, types} = Structs(config)
  const merge = Object.assign({}, {fc: {structs, types}})

  throwOnDuplicate(merge, network, 'Conflicting methods in Ala and Network Api')
  Object.assign(merge, network)

  const writeApi = writeApiGen(Network, network, structs, config)
  throwOnDuplicate(merge, writeApi, 'Conflicting methods in Ala and Transaction Api')
  Object.assign(merge, writeApi)

  return merge
}

function throwOnDuplicate(o1, o2, msg) {
  for(const key in o1) {
    if(o2[key]) {
      throw new TypeError(msg + ': ' + key)
    }
  }
}

const defaultSignProvider = (ala, config) => ({sign, buf, transaction}) => {
  let keyProvider = config.keyProvider
  if(typeof keyProvider === 'function') {
    keyProvider = keyProvider({transaction})
  }
  if(keyProvider) {
    return Promise.resolve(keyProvider).then(keys => {
      if(!Array.isArray(keys)) {
        keys = [keys]
      }

      if(!keys.length) {
        throw new Error('missing private key(s), check your keyProvider')
      }

      // Public to private key map -> maps server's required public keys
      // back to signing keys.
      const keyMap = keys.reduce((map, wif) => {
        map[ecc.privateToPublic(wif)] = wif
        return map
      }, {})

      return ala.getRequiredKeys(transaction, Object.keys(keyMap))
      .then(({required_keys}) => {
        if(!required_keys.length) {
          throw new Error('missing required keys ')
        }
        const sigs = []
        for(const key of required_keys) {
          sigs.push(sign(buf, keyMap[key]))
        }
        return sigs
      })
    })
  }
  throw new TypeError('This transaction requires a config.keyProvider for signing')
}
