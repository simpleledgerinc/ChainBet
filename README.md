## Usage

```js
let cb = require('chainbet');
let chainbet = new cb()
chainbet.encodePhase1('01', 12345, 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c')
// <Buffer 6a 04 54 45 42 00 02 01 00 02 01 00 02 01 00 02 01 00 05 31 32 33 34 35 36 62 69 74 63 6f 69 6e 63 61 73 68 3a 71 7a 73 30 32 76 30 35 6c 37 71 73 35 ... >

let asm = 'OP_RETURN 00424554 01 01 01 01 3132333435 626974636f696e636173683a717a7330327630356c377173357332347372716a75343938717535356477756a3063783565686a6d3263'
chainbet.decode(asm) ;
// { phase: 1,
//   type: 1,
//   amount: '12345',
//   address: 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c' }
```
