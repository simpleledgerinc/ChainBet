let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();
module.exports = class chainbet {
   encodePhase1(type, amount, targetAddress) {
     let hash160 = BITBOX.Crypto.hash160(targetAddress);
     let arr = [...hash160];
     let script = [
       BITBOX.Script.opcodes.OP_RETURN,

       // next 4 bytes will be random data
       '0x04',

       // 4 byte prefix
       '0x00',
       '0x42',
       '0x45',
       '0x54',
       BITBOX.Script.opcodes.OP_PUSHDATA1,
       `0x20`,

       // version id
       '0x01',

       // phase
       '0x01',

       // bet type
       type,

       // amount
       '0x00',
       '0x00',
       '0x00',
       '0x31',
       '0x32',
       '0x33',
       '0x34',
       '0x35',
       //
     ];

     arr.forEach((item, index) => {
       script.push(item);
     })

     return BITBOX.Script.encode(script)
   }

   encodePhase2(betTxId, multisigPubKey) {
     let script = [
       BITBOX.Script.opcodes.OP_RETURN,
       // 4 byte prefix
       Buffer.from('00424554', 'hex'),
       // protocol id
       Buffer.from('01', 'hex'),
       // version id
       Buffer.from('01', 'hex'),
       // phase
       Buffer.from('02', 'hex'),
       // bet tx id
       Buffer.from(betTxId, 'hex'),
       // multisig Pub Key
       Buffer.from(multisigPubKey),
     ];
     return BITBOX.Script.encode(script)
   }

   encodePhase3(betTxId, participantTxId, hostP2SHId, hostMultisigPubKey) {
     let script = [
       BITBOX.Script.opcodes.OP_RETURN,
       // 4 byte prefix
       Buffer.from('00424554', 'hex'),
       // protocol id
       Buffer.from('01', 'hex'),
       // version id
       Buffer.from('01', 'hex'),
       // phase
       Buffer.from('03', 'hex'),
       // bet tx id
       Buffer.from(betTxId, 'hex'),
       // Participant tx id
       Buffer.from(participantTxId, 'hex'),
       // host P2SH id
       Buffer.from(hostP2SHId, 'hex'),
       // host Multisig Pub Key
       Buffer.from(hostMultisigPubKey, 'hex'),
     ];
     return BITBOX.Script.encode(script)
   }

   encodePhase4(betTxId, participantTxId, participantSig1, participantSig2) {
     let script = [
       BITBOX.Script.opcodes.OP_RETURN,
       // 4 byte prefix
       Buffer.from('00424554', 'hex'),
       // protocol id
       Buffer.from('01', 'hex'),
       // version id
       Buffer.from('01', 'hex'),
       // phase
       Buffer.from('04', 'hex'),
       // bet tx id
       Buffer.from(betTxId, 'hex'),
       // Participant tx id
       Buffer.from(participantTxId, 'hex'),
       // Participant signature 1
       Buffer.from(participantSig1, 'hex'),
       // Participant signature 2
       Buffer.from(participantSig2, 'hex'),
     ];
     return BITBOX.Script.encode(script)
   }

   encodePhase5() {
   }

   encodePhase6(betTxId, secretValue) {
     let script = [
       BITBOX.Script.opcodes.OP_RETURN,
       // 4 byte prefix
       Buffer.from('00424554', 'hex'),
       // protocol id
       Buffer.from('01', 'hex'),
       // version id
       Buffer.from('01', 'hex'),
       // phase
       Buffer.from('06', 'hex'),
       // bet tx id
       Buffer.from(betTxId, 'hex'),
       // Secret value
       Buffer.from(secretValue, 'hex'),
     ];
     return BITBOX.Script.encode(script)
   }

   decode(op_return) {
     let data = op_return.split(" ");
     let buf = Buffer.from(data[2], 'hex');
     let results = {};
     let phase = buf[1].toString(16);
     if(phase === '1') {
       // phase 1
       results.phase = buf[1].toString(16);
       // type 1
       results.type = buf[2].toString(16);
       // amount
       // results.amount = decoded[6].toString();
       // // target address
       // results.address = decoded[7].toString()
     } else if(phase === '2') {
       // phase 2
       results.phase = 2;
       // Bet Txn Id
       results.betTxId = decoded[5].toString();
       // Multi-sig Pub Key
       results.multisigPubKey = decoded[6].toString()
     } else if(phase === '3') {
       // phase 3
       results.phase = 3;
       // Bet Txn Id
       results.betTxId = decoded[5].toString();
       // Participant Txn Id
       results.participantTxId = decoded[6].toString();
       // Host P2SH txid
       results.hostP2SHId = decoded[8].toString();
       // Host multsig pubkey
       results.hostMultisigPubKey = decoded[7].toString();
     } else if(phase === '4') {
       // phase 4
       results.phase = 4;
       // Bet Txn Id
       results.betTxId = decoded[5].toString();
       // Participant Txn Id
       results.participantTxId = decoded[6].toString();
       // Participant Signature 1
       results.participantSig1 = decoded[7].toString();
       // Participant Signature 2
       results.participantSig2 = decoded[8].toString();
     } else if(phase === '5') {
     } else if(phase === '6') {
       // phase 6
       results.phase = 6;
       // Bet Txn Id
       results.betTxId = decoded[5].toString();
       // Secret Value
       results.secretValue = decoded[6].toString();
     }
     return results;
   }
 }
