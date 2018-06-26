## Dev Usage

```js

let chainbet = require('chainbet');

// 1) Create Script Buffer object for any phase
chainbet.encodePhase1(0x01, 1000, 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c');
// <Buffer 6a 04 54 45 42 00 02 01 00 02 01 00 02 01 00 02 01 00 05 31 32 33 34 35 36 62 69 74 63 6f 69 6e 63 61 73 68 3a 71 7a 73 30 32 76 30 35 6c 37 71 73 35 ... >

// 2) Decode Script Hex for any ChainBet phase
let scriptHex = '6a04004245544c1f01010100000000000003e8a0f531f4ff810a415580c12e54a7072946bb927e';
chainbet.decode(scriptHex);
// { phase: 1,
//   type: 1,
//   amount: 1000,
//   address: 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c' }

```

## Bitcoin Cash Coin Flip Demo Usage

1) install node.js
2) install `chainbet` globally `npm install -g chainbet`
3) run coinflip via `node coinflip` & follow user instructions provided


2) git clone repository
3) `cd chainbet`
4) update `examples/wallet.json` file with your compressed pubkey, address, and wif.
5) run `node coinflip` and follow the instructions provided to you.
