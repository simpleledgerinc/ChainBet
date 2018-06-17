let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();
let base58 = require('bs58');
let crypto = require('crypto');

module.exports = class chainbet {
  
  // Phase 1: Bet Offer Announcement
  static encodePhase1(type, amount, targetAddress) {

    // Set Phase 1 ChainBet payload length
    var pushdatalength = 0x1f // 31 bytes with optional targetAddress
    if(targetAddress == undefined) {
      pushdatalength = 0x0b   // 11 bytes without targetAddress
    }
    
    let script = [
      BITBOX.Script.opcodes.OP_RETURN,
      // pushdata, 4 bytes
      0x04,
      // 4 byte Terab prefix
      0x00,
      0x42,
      0x45,
      0x54,
      BITBOX.Script.opcodes.OP_PUSHDATA1,
      pushdatalength,
      // 1 byte version id
      0x01,
      // 1 byte phase id
      0x01,
      // 1 byte bet type id
      type,
    ];
    
    // add 8 byte amount
    amount = this.amount_2_hex(amount)
    amount.forEach((item, index) => { script.push(item); })

    // add optional 20 byte target address (encode in HASH160 hexidecimal form)
    if(targetAddress != undefined) {
      // NOTE: for now just add the address in ascii (in any form)
      //let target_ascii_buf = Buffer(targetAddress);
      //target_ascii_buf.forEach((item, index) => { script.push(item); })

      // NOTE: HASH160 makes this more difficult becuase the network pre-fix gets chopped off...
      if(BITBOX.Address.isLegacyAddress(targetAddress)) {
        // do nothing
      } else if(BITBOX.Address.isCashAddress(targetAddress)){
        // convert to legacy address
        targetAddress = BITBOX.Address.toLegacyAddress(targetAddress)
      } else {
        throw "Unsupported address format provided";
      }
      // convert from base58 to hex (giving us the HASH160)   
      var hash160 = base58.decode(targetAddress);
      let hash160_buf = Buffer(hash160, 'hex');
      // chop off network byte and 4 checksum bytes
      hash160_buf = hash160_buf.slice(1,21)
      hash160_buf.forEach((item, index) => { script.push(item); })
    }

    let encoded = BITBOX.Script.encode(script);
    //let asm = BITBOX.Script.toASM(encoded);
    return encoded;
  } 

  // Phase 2: Bet Participant Acceptance
  static encodePhase2(betTxId, multisigPubKey, secretCommitment) {

    // set Phase 2 ChainBet payload length to 99 bytes
    var pushdatalength = 0x63

    let script = [
      BITBOX.Script.opcodes.OP_RETURN,
      // pushdata, 4 bytes
      0x04,
      // 4 byte Terab prefix
      0x00,
      0x42,
      0x45,
      0x54,
      BITBOX.Script.opcodes.OP_PUSHDATA1,
      pushdatalength,
      // 1 byte version id
      0x01,
      // 1 byte phase id
      0x02,
    ];

    // 32 byte betTxId hex
    betTxId = Buffer(betTxId, 'hex')
    betTxId.forEach((item, index) => { script.push(item); })

    // 33 byte participant (Bob) multisig Pub Key hex 
    multisigPubKey = Buffer(multisigPubKey, 'hex')
    multisigPubKey.forEach((item, index) => { script.push(item); })

    // 32 byte participant (Bob) secret commitment
    secretCommitment = Buffer(secretCommitment, 'hex')
    secretCommitment.forEach((item, index) => { script.push(item); })

    return BITBOX.Script.encode(script)
  }

  // Phase 3: Bet Host Funding
  static encodePhase3(betTxId, participantTxId, hostP2SHTxId, hostMultisigPubKey) {
    
    // set Phase 3 ChainBet payload length to 131 bytes
    var pushdatalength = 0x83

    let script = [
      BITBOX.Script.opcodes.OP_RETURN,
      // pushdata, 4 bytes
      0x04,
      // 4 byte prefix
      0x00,
      0x42,
      0x45,
      0x54,
      BITBOX.Script.opcodes.OP_PUSHDATA1,
      pushdatalength,
      // 1 byte version id
      0x01,
      // 1 byte phase id
      0x03,
    ];

    // 32 byte bet tx id
    betTxId = Buffer(betTxId, 'hex')
    betTxId.forEach((item, index) => { script.push(item); })

    // 32 byte participant tx id
    participantTxId = Buffer(participantTxId, 'hex')
    participantTxId.forEach((item, index) => { script.push(item); })

    // 32 byte host P2SH id
    hostP2SHTxId = Buffer(hostP2SHTxId, 'hex')
    hostP2SHTxId.forEach((item, index) => { script.push(item); })

    // 33 byte host (Alice) Multisig Pub Key
    hostMultisigPubKey = Buffer(hostMultisigPubKey, 'hex')
    hostMultisigPubKey.forEach((item, index) => { script.push(item); })

    return BITBOX.Script.encode(script)
  }

    // Phase 4: Bet Participant Funding
    static encodePhase4(betTxId, participantTxId, participantSig1, participantSig2) {

      // set Phase 4 ChainBet payload length to 210 bytes
      var pushdatalength = 0xd2

      let script = [
        BITBOX.Script.opcodes.OP_RETURN,
        // pushdata, 4 bytes
        0x04,
        // 4 byte prefix
        0x00,
        0x42,
        0x45,
        0x54,
        BITBOX.Script.opcodes.OP_PUSHDATA1,
        pushdatalength,
        // 1 byte version id
        0x01,
        // 1 byte phase id
        0x04,
      ];

      // 32 byte bet tx id
      betTxId = Buffer(betTxId, 'hex')
      betTxId.forEach((item, index) => { script.push(item); })

      // 32 byte Participant tx id
      participantTxId = Buffer(participantTxId, 'hex')
      participantTxId.forEach((item, index) => { script.push(item); })

      // 72 byte Participant signature 1
      participantSig1 = Buffer(participantSig1, 'hex')  // TODO: check for padding (71 vs 72 bytes)
      participantSig1.forEach((item, index) => { script.push(item); })

      // 72 byte Participant signature 2
      participantSig2 = Buffer(participantSig2, 'hex')  // TODO: check for padding (71 vs 72 bytes)
      participantSig2.forEach((item, index) => { script.push(item); })

      return BITBOX.Script.encode(script)
    }

    // Phase 5: Funding Transaction
    static encodePhase5() {
      // TODO
    }

    // Phase 6: Bet Participant Resignation
    static encodePhase6(betTxId, secretValue) {

      // set Phase 6 ChainBet payload length to 66 bytes
      var pushdatalength = 0x42
    
      let script = [
        BITBOX.Script.opcodes.OP_RETURN,
        // pushdata, 4 bytes
        0x04,
        // 4 byte prefix
        0x00,
        0x42,
        0x45,
        0x54,
        BITBOX.Script.opcodes.OP_PUSHDATA1,
        pushdatalength,
        // 1 byte version id
        0x01,
        // 1 byte phase id
        0x06,
      ];

      // 32 byte bet txn id
      betTxId = Buffer(betTxId, 'hex')
      betTxId.forEach((item, index) => { script.push(item); })

      // 32 byte Secret value
      secretValue = Buffer(secretValue, 'hex')
      secretValue.forEach((item, index) => { script.push(item); })

      return BITBOX.Script.encode(script)
    }

    static decode(op_return, networkByte=0x00) {

      // split the op_return payload and get relavant data
      let data = op_return.split("04004245544c"); // pushdata (0x04) + Terab ID + pushdata (0x4c)
      let buf = Buffer.from(data[1].trim(), 'hex');

      // grab the common fields
      let version = buf[1];
      let phase = buf[2];
      let results = { version: version, phase: phase };

      // Phase 1 specific fields
      if(phase === 0x01) {
        // Bet Type
        results.type = buf[3];
        // Bet Amount
        results.amount = parseInt(buf.slice(4,12).toString('hex'), 16);
        // Target address (as hash160 without network or sha256)
        if (buf.length > 12) // 11 + 1 length byte
            var pkHash160Hex = buf.slice(12).toString('Hex');
            results.address = this.hash160_2_cashAddr(pkHash160Hex, networkByte);

      // Phase 2 specific fields
      } else if(phase === 0x02) {
        // Bet Txn Id
        results.betTxId = buf.slice(3, 35);
        // 33 byte Multi-sig Pub Key
        results.multisigPubKey = buf.slice(35,68);
        // 32 byte bob commitment
        results.secretCommitment = buf.slice(68);

      // Phase 3  specific fields
      } else if(phase === 0x03) {
        // 32 byte Bet Txn Id
        results.betTxId = buf.slice(3, 35);
        // 32 byte Participant Txn Id
        results.participantOpReturnTxId = buf.slice(35, 67);
        // 32 byte Host P2SH txid
        results.hostP2SHTxId = buf.slice(67, 99);
        // 33 byte Host (Alice) multsig pubkey
        results.hostMultisigPubKey = buf.slice(99);

      //Phase 4 specific fields
      } else if(phase === 0x04) {
        // 32 byte Bet Txn Id
        results.betTxId = buf.slice(3, 35);
        // 32 byte Participant Txn Id
        results.participantP2SHTxId = buf.slice(35, 67);
        // 72 byte Participant Signature 1
        results.participantSig1 = buf.slice(67, 139);
        // 72 byte Participant Signature 2
        results.participantSig2 = buf.slice(139);

      // Phase 6 specific fields
      } else if(phase === 0x06) {
        // 32 byte Bet Txn Id
        results.betTxId = buf.slice(3, 35)
        // 32 byte Secret Value
        results.secretValue = buf.slice(35, 67);
      }

      return results;
    }

    // get big-endian hex from satoshis
    static amount_2_hex(amount) {
      var hex = amount.toString(16)
      const len = hex.length
      for (let i = 0; i < 16 - len; i++) {
        hex = '0' + hex;
      }
      let buf = Buffer.from(hex, 'hex')
      return buf
    }

    static hash160_2_cashAddr(pkHash160Hex, networkByte) {
      // handle the network byte prefix
      let networkHex = Buffer([networkByte]).toString('hex');

      // calculate checksum and 
      // add first 4 bytes from double sha256
      let hash1 = crypto.createHash('sha256');
      let hash2 = crypto.createHash('sha256');
      hash1.update(Buffer(networkHex + pkHash160Hex, 'hex'));
      hash2.update(hash1.digest());
      let checksum = hash2.digest().slice(0,4).toString('hex');
      let addressBuf = Buffer(networkHex + pkHash160Hex + checksum, 'hex')
      let hex = addressBuf.toString('hex')
      let addressBase58 = base58.encode(addressBuf)
      
      return BITBOX.Address.toCashAddress(addressBase58);
    }

  }