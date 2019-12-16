[![Build Status](https://travis-ci.org/ALAIO/alaexplorerjs-v4.0.2.svg?branch=master)](https://travis-ci.org/ALAIO/alaexplorerjs-v4.0.2)
[![NPM](https://img.shields.io/npm/v/alaexplorerjs-v4.0.2.svg)](https://www.npmjs.org/package/alaexplorerjs-v4.0.2)

# alaexplorerjs-v4.0.2

General purpose library for the ALA blockchain.

### Usage (read-only)

```javascript
Ala = require('alaexplorerjs-v4.0.2') // Or Ala = require('./src')

// API, note: testnet uses alad at localhost (until there is a testnet)
ala = Ala.Testnet()

// All API methods print help when called with no-arguments.
ala.getBlock()

// Next, your going to need alad running on localhost:8888

// If a callback is not provided, a Promise is returned
ala.getBlock(1).then(result => {console.log(result)})

// Parameters can be sequential or an object
ala.getBlock({block_num_or_id: 1}).then(result => console.log(result))

// Callbacks are similar
callback = (err, res) => {err ? console.error(err) : console.log(res)}
ala.getBlock(1, callback)
ala.getBlock({block_num_or_id: 1}, callback)

// Provide an empty object or a callback if an API call has no arguments
ala.getInfo({}).then(result => {console.log(result)})

```

API methods and documentation are generated from:
* [chain.json](https://github.com/ALADIN-Network/alaexplorerjs-v4.0.2-json-v2.0.2/blob/master/api/v1/chain.json)
* [account_history.json](https://github.com/ALADIN-Network/alaexplorerjs-v4.0.2-json-v2.0.2/blob/master/api/v1/account_history.json)

### Configuration

```js
Ala = require('alaexplorerjs-v4.0.2') // Or Ala = require('./src')

config = {
  httpEndpoint: 'http://127.0.0.1:8888',
  expireInSeconds: 60,
  broadcast: true,
  debug: false,
  sign: true
}

ala = Ala.Testnet(config)
```

### Options

Options may be provided immediately after parameters.

Example: `ala.transfer(params, options)`

```js
options = {
  broadcast: true,
  sign: true,
  scope: null,
  authorization: null
}
```

* **scope** `{array<string>|string}` - account name or names that may
  undergo a change in state.
  * If missing default scopes will be calculated.
  * If provided additional scopes will not be added.
  * Sorting is always performed.

* **authorization** `{array<auth>|auth}` - identifies the
  signing account and permission typically in a multi-sig
  configuration.  Authorization may be a string formatted as
  `account@permission` or an `object<{account, permission}>`.
  * If missing default authorizations will be calculated.
  * If provided additional authorizations will not be added.
  * Sorting is always performed (by account name).

### Usage (read/write)

```javascript
Ala = require('alaexplorerjs-v4.0.2') // Or Ala = require('./src')

ala = Ala.Testnet({keyProvider: '5HzzqBmg4DeneRqNRznPiBubRDGEPdcVjGZCTMGjGJWJubKm2Pe'})

// Run with no arguments to print usage.
ala.transfer()

// Usage with options (options are always optional)
options = {broadcast: false}
ala.transfer({from: 'inita', to: 'initb', amount: 1, memo: ''}, options)

// Object or ordered args may be used.
ala.transfer('inita', 'initb', 1, 'memo', options)

// A broadcast boolean may be provided as a shortcut for {broadcast: false}
ala.transfer('inita', 'initb', 1, '', false)
```

Read-write API methods and documentation are generated from this [schema](https://github.com/ALADIN-Network/alaexplorerjs-v4.0.2-json-v2.0.2/blob/master/schema/generated.json).

For more advanced signing, see `keyProvider` in the [unit test](./index.test.js).

### Shorthand

Shorthand is available for some types such as Asset and Authority.

For example:
* deposit: `'1 ALA'` is shorthand for `1.0000 ALA`
* owner: `'ALA6MRy..'` is shorthand for `{threshold: 1, keys: [key: 'ALA6MRy..', weight: 1]}`
* recovery: `inita` or `inita@active` is shorthand
  * `{{threshold: 1, accounts: [..account: inita, permission: active, weight: 1]}}`
  * `inita@other` would replace the permission `active` with `other`


```javascript
Ala = require('alaexplorerjs-v4.0.2') // Or Ala = require('./src')

initaPrivate = '5HzzqBmg4DeneRqNRznPiBubRDGEPdcVjGZCTMGjGJWJubKm2Pe'
initaPublic = 'ALA8dM36QedcUfPTNF7maThtRqHP5xvCqMsYiHUz1Rz7sPfhvCYuo'
keyProvider = initaPrivate

ala = Ala.Testnet({keyProvider})

ala.newaccount({
  creator: 'inita',
  name: 'mynewacct',
  owner: initaPublic,
  active: initaPublic,
  recovery: 'inita',
  deposit: '1 ALA'
})

```

### Contract

```javascript
Ala = require('alaexplorerjs-v4.0.2') // Or Ala = require('./src')
let {ecc} = Ala.modules

initaPrivate = '5HzzqBmg4DeneRqNRznPiBubRDGEPdcVjGZCTMGjGJWJubKm2Pe'

// New deterministic key for the currency account.  Only use a simple
// seedPrivate in production if you want to give away money.
currencyPrivate = ecc.seedPrivate('currency')
currencyPublic = ecc.privateToPublic(currencyPrivate)

keyProvider = [initaPrivate, currencyPrivate]

ala = Ala.Testnet({keyProvider})

ala.newaccount({
  creator: 'inita',
  name: 'currency',
  owner: currencyPublic,
  active: currencyPublic,
  recovery: 'inita',
  deposit: '1 ALA'
})

contractDir = `${process.env.HOME}/alaio/ala/build/contracts/currency`
wast = fs.readFileSync(`${contractDir}/currency.wast`)
abi = fs.readFileSync(`${contractDir}/currency.abi`)

// Publish contract to the blockchain
ala.setcode('currency', 0, 0, wast, abi)

// ala.contract(code<string>, [options], [callback])
ala.contract('currency').then(currency => {
  // Transfer is one of the actions in currency.abi 
  currency.transfer('currency', 'inita', 10)
})

```

### Atomic Operations

Blockchain level atomic operations.  All will pass or fail.

```javascript
Ala = require('alaexplorerjs-v4.0.2') // Or Ala = require('./src')

keyProvider = [
  '5HzzqBmg4DeneRqNRznPiBubRDGEPdcVjGZCTMGjGJWJubKm2Pe',
  Ala.modules.ecc.seedPrivate('currency')
]

testnet = Ala.Testnet({keyProvider})

// if either transfer fails, both will fail (1 transaction, 2 messages)
testnet.transaction(ala =>
  {
    ala.transfer('inita', 'initb', 1, '')
    ala.transfer('inita', 'initc', 1, '')
    // Returning a promise is optional (but handled as expected)
  }
  // [options],
  // [callback]
)

// transaction on a single contract
testnet.transaction('currency', currency => {
  currency.transfer('inita', 'initd', 1)
})

// mix contracts in the same transaction
testnet.transaction(['currency', 'ala'], ({currency, ala}) => {
  currency.transfer('inita', 'initd', 1)
  ala.transfer('inita', 'initd', 1, '')
})

// contract lookups then transactions
testnet.contract('currency').then(currency => {
  currency.transaction(tr => {
    tr.transfer('inita', 'initd', 1)
    tr.transfer('initd', 'inita', 1)
  })
  currency.transfer('inita', 'inite', 1)
})

// Note, the contract method does not take an array.  Just use Await or yield
// if multiple contracts are needed outside of a transaction.

```

### Usage (manual)

A manual transaction provides for more flexibility.

```javascript
Ala = require('alaexplorerjs-v4.0.2') // Or Ala = require('./src')

ala = Ala.Testnet({keyProvider: '5HzzqBmg4DeneRqNRznPiBubRDGEPdcVjGZCTMGjGJWJubKm2Pe'})

ala.transaction({
  scope: ['inita', 'initb'],
  messages: [
    {
      code: 'ala',
      type: 'transfer',
      authorization: [{
        account: 'inita',
        permission: 'active'
      }],
      data: {
        from: 'inita',
        to: 'initb',
        amount: 7,
        memo: ''
      }
    }
  ]
})

```

# Development

From time-to-time the alaexplorerjs-v4.0.2 and alad binary format will change between releases
so you may need to start `alad` with the `--skip-transaction-signatures` parameter
to get your transactions to pass.

Note, `package.json` has a "main" pointing to `./lib`.  The `./lib` folder is for
es2015 code built in a separate step.  If your changing and testing code,
import from `./src` instead.

```javascript
Ala = require('./src')
```

Use Node v8+ to `package-lock.json`.

# Related Libraries

These libraries are exported from `alaexplorerjs-v4.0.2` or may be used separately.

```javascript
var {api, ecc, json, Fcbuffer} = Ala.modules
```

# About

* alaexplorerjs-v4.0.2-api-v2.0.1 [[Github](https://github.com/ALADIN-Network/alaexplorerjs-v4.0.2-api-v2.0.1), [NPM](https://www.npmjs.org/package/alaexplorerjs-v4.0.2-api-v2.0.1)]
  * Remote API to an ALA blockchain node (alad)
  * Use this library directly if you need read-only access to the blockchain
    (don't need to sign transactions).

* alaexplorerjs-v4.0.2-ecc-v1.6.1 [[Github](https://github.com/ALADIN-Network/alaexplorerjs-v4.0.2-ecc-v1.6.1), [NPM](https://www.npmjs.org/package/alaexplorerjs-v4.0.2-ecc-v1.6.1)]
  * Private Key, Public Key, Signature, AES, Encryption / Decryption
  * Validate public or private keys
  * Encrypt or decrypt with ALA compatible checksums
  * Calculate a shared secret

* alaexplorerjs-v4.0.2-json-v2.0.2 [[Github](https://github.com/ALADIN-Network/alaexplorerjs-v4.0.2-json-v2.0.2), [NPM](https://www.npmjs.org/package/alaexplorerjs-v4.0.2-json-v2.0.2)]
  * Blockchain definitions (api method names, blockchain operations, etc)
  * Maybe used by any language that can parse json
  * Kept up-to-date

* Fcbuffer [[Github](https://github.com/ALADIN-Network/alaexplorerjs-v4.0.2-alaexplorerjs-fcbuffer-v2.0.0), [NPM](https://www.npmjs.org/package/alaexplorerjs-fcbuffer-v2.0.0)]
  * Binary serialization used by the blockchain
  * Clients sign the binary form of the transaction
  * Essential so the client knows what it is signing

# Browser

```bash
git clone https://github.com/ALADIN-Network/alaexplorerjs-v4.0.2.git
cd alaexplorerjs-v4.0.2
npm install
npm run build
# builds: ./dist/ala.js
```

```html
<script src="ala.js"></script>
<script>
var ala = Ala.Testnet()
//...
</script>
```

# Environment

Node 6+ and browser (browserify, webpack, etc)

React Native should work, create an issue if you find a bug.
