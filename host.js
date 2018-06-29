let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();

let base58 = require('bs58');
let Utils = require('./utils');

module.exports = class Host {
	constructor(){}

	// Phase 1: Bet Offer Announcement
	static encodePhase1Message(amount, hostCommitment, targetAddress) {
		
		let script = [
			BITBOX.Script.opcodes.OP_RETURN,
			// 4 byte prefix
			Buffer('00424554', 'hex'),
			// 1 byte version id / 1 byte phase / 1 byte bet type
			Buffer('010101', 'hex'),
			// add 8 byte amount
			Utils.amount_2_hex(amount),
			// add 20 byte host commitment
			hostCommitment
		];
		
		// add optional 20 byte target address (encode in HASH160 hexidecimal form)
		if(targetAddress != undefined) {
			
			if(BITBOX.Address.isLegacyAddress(targetAddress)) {
				// do nothing
			} else if(BITBOX.Address.isCashAddress(targetAddress)){
				// convert to legacy address
				targetAddress = BITBOX.Address.toLegacyAddress(targetAddress);
			} else
				throw new Error("Unsupported address format provided");

			// convert from base58 to hex (giving us the HASH160)   
			var hash160 = base58.decode(targetAddress);
			let hash160_buf = Buffer(hash160, 'hex');

			// chop off network byte and 4 checksum bytes
			hash160_buf = hash160_buf.slice(1,21);
			script.push(hash160_buf);
			//hash160_buf.forEach((item, index) => { script.push(item); })
		}

		let encoded = BITBOX.Script.encode(script);
		//let asm = BITBOX.Script.toASM(encoded);
		return encoded;
	}

	// Phase 3: Bet Host Funding
	static encodePhase3(betId, participantTxId, hostP2SHTxId, hostMultisigPubKeyHex) {
	
		let script = [
			BITBOX.Script.opcodes.OP_RETURN,
<<<<<<< HEAD
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
=======
			// 4 byte prefix
			Buffer('00424554', 'hex'),
			// 1 byte version id / 1 byte phase
			Buffer('0103', 'hex'),
			// 32 byte bet tx id
			Buffer(betId, 'hex'),
			// 32 byte participant tx id
			Buffer(participantTxId, 'hex'),
			// 32 byte host P2SH id
			Buffer(hostP2SHTxId, 'hex'),
			// 33 byte host (Alice) Multisig Pub Key
			Buffer(hostMultisigPubKeyHex, 'hex')
>>>>>>> multiple pushdata encode/decode
		];

		return BITBOX.Script.encode(script)
	}
}