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

			// convert from legacy address to binary   
			var addrBuf = Buffer(base58.decode(targetAddress), 'hex');

			// chop off network byte and 4 checksum bytes
			let hash160 = addrBuf.slice(1,21);
			script.push(hash160);
		}

		let encoded = BITBOX.Script.encode(script);
		//let asm = BITBOX.Script.toASM(encoded);
		return encoded;
	}

	// Phase 3: Bet Host Funding
	static encodePhase3(betId, participantTxId, hostP2SHTxId, hostMultisigPubKeyHex) {
	
		let script = [
			BITBOX.Script.opcodes.OP_RETURN,
			// 4 byte prefix
			Buffer('00424554', 'hex'),
			// 1 byte betType / 1 byte version id / 1 byte phase
			Buffer('010103', 'hex'),
			// 32 byte bet tx id
			Buffer(betId, 'hex'),
			// 32 byte participant tx id
			Buffer(participantTxId, 'hex'),
			// 32 byte host P2SH id
			Buffer(hostP2SHTxId, 'hex'),
			// 33 byte host (Alice) Multisig Pub Key
			Buffer(hostMultisigPubKeyHex, 'hex')
		];

		return BITBOX.Script.encode(script)
	}
}