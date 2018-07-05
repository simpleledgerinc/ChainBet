let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();

let Utils = require('./utils');

module.exports = class Client {

	// Phase 2: Bet Participant Acceptance
	static encodePhase2Message(betId, multisigPubKeyHex, secretCommitmentHex) {

		let script = [
			BITBOX.Script.opcodes.OP_RETURN,
			// 4 byte prefix
			Buffer('00424554', 'hex'),
			// 1 byte version id / 1 byte phase id
			Buffer('0102', 'hex'),
			// 32 byte betTxId hex
			Buffer(betId, 'hex'),
			// 33 byte participant (Bob) multisig Pub Key hex 
			Buffer(multisigPubKeyHex, 'hex'),
			// 32 byte participant (Bob) secret commitment
			Buffer(secretCommitmentHex, 'hex')
		];

		return BITBOX.Script.encode(script)
	}

	// Phase 4: Bet Participant Funding
	static encodePhase4(betId, clientEscrowTxId, participantSig1, participantSig2) {

		// pad sigs to ensure 72 bytes
		var sig1 = Utils.padSig(participantSig1);
		var sig2 = Utils.padSig(participantSig2);

		// chop off sighash type (last byte)
		sig1 = sig1.slice(0,71);
		sig2 = sig2.slice(0,71);

		// combine sigs into a single value for one pushdata
		var sigs = Buffer.concat([sig1, sig2]);

		let script = [
			BITBOX.Script.opcodes.OP_RETURN,
			// 4 byte prefix
			Buffer('00424554','hex'),
			// 1 byte version id / 1 phase byte
			Buffer('0104', 'hex'),
			// 32 byte bet tx id
			Buffer(betId, 'hex'),
			// 32 byte bet tx id
			Buffer(clientEscrowTxId, 'hex'),
			// 144 bytes for 2 sigs)
			sigs,
		];

		return BITBOX.Script.encode(script)
	}

	// Phase 6: Bet Participant Resignation
	static encodePhase6(betId, secretValue) {

		let script = [
		BITBOX.Script.opcodes.OP_RETURN,
		// 4 byte prefix
		Buffer('00424554', 'hex'),
		// 1 byte version id / 1 byte phase id
		Buffer('0106', 'hex'),
		// 32 byte bet txn id
		Buffer(betId, 'hex'),
		// 32 byte Secret value
		secretValue
	];

		return BITBOX.Script.encode(script)
	}

}