## Usage

```js
let cb = require('chainbet');
let chainbet = new cb()
chainbet.encodePhase1('01', 12345, 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c')
// <Buffer 6a 04 54 45 42 00 02 01 00 02 01 00 02 01 00 02 01 00 05 31 32 33 34 35 36 62 69 74 63 6f 69 6e 63 61 73 68 3a 71 7a 73 30 32 76 30 35 6c 37 71 73 35 ... >

let asm = 'OP_RETURN 00424554 01010100000031323334353f8b68135f399b101868b540decc00207906f6af3'
chainbet.decode(asm);
// { phase: 1,
//   type: 1,
//   amount: '12345',
//   address: 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c' }
```
