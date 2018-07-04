let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();

let base58 = require('bs58');

let Utils = require('./utils')

module.exports = class Host {
	constructor(){}

	// Phase 1: Bet Offer Announcement
	static encodePhase1Message(type, amount, hostCommitment, targetAddress) {

		// Set Phase 1 ChainBet payload length
		var pushdatalength = 0x33 // 51 bytes with optional targetAddress
		if(targetAddress == undefined) {
			pushdatalength = 0x1f   // 31 bytes without targetAddress
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
		amount = Utils.amount_2_hex(amount)
		amount.forEach((item, index) => { script.push(item); })

		// add 20 byte host commitment
		hostCommitment.forEach((item, index) => { script.push(item); })

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
}