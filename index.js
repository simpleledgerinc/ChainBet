let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();
module.exports = class chainbet {
   encodePhase1(type, amount, targetAddress) {
     let script = [
       BITBOX.Script.opcodes.OP_RETURN,
       // 4 byte prefix
       Buffer.from('00424554', 'hex'),
       // next 4 bytes will be random data
       '0x04',

       // 4 byte prefix
       '0x00',
       '0x42',
       '0x45',
       '0x54',

       // next 1 byte will be random data
       '0x01',
       // protocol id
       '0x01',

       // next 1 byte will be random data
       '0x01',
       // version id
       '0x01',

       // next 1 byte will be random data
       '0x01',
       // phase
       '0x01',

       // next 1 byte will be random data
       '0x01',
       // bet type
       Buffer.from(type, 'hex'),

       // next 8 bytes will be random data
       '0x08',
       // hardcoded amount
       '0x00',
       '0x00',
       '0x00',
       '0x00',
       '0x31',
       '0x32',
       '0x33',
       '0x34',
       '0x35',

       // target address
       Buffer.from(BITBOX.Crypto.hash160(targetAddress)),
     ];
    
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
     let fromASM = BITBOX.Script.fromASM(op_return);
     let decoded = BITBOX.Script.decode(fromASM);
     let results = {};
     let phase = decoded[4].toString('hex');
     if(phase === '01') {
       // phase 1
       results.phase = 1;
       // type 1
       results.type = 1;
       // amount
       results.amount = decoded[6].toString();
       // target address
       results.address = decoded[7].toString()
     } else if(phase === '02') {
       // phase 2
       results.phase = 2;
       // Bet Txn Id
       results.betTxId = decoded[5].toString();
       // Multi-sig Pub Key
       results.multisigPubKey = decoded[6].toString()
     } else if(phase === '03') {
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
     } else if(phase === '04') {
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
     } else if(phase === '05') {
     } else if(phase === '06') {
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
