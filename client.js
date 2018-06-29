let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();

module.exports = class Client {

	// Phase 2: Bet Participant Acceptance
	static encodePhase2Message(betId, multisigPubKeyHex, secretCommitmentHex) {

		let script = [
			BITBOX.Script.opcodes.OP_RETURN,
<<<<<<< HEAD
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
			0x02
=======
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
>>>>>>> multiple pushdata encode/decode
		];

		return BITBOX.Script.encode(script)
	}

	// Phase 4: Bet Participant Funding
	static encodePhase4(betId, clientEscrowTxId, participantSig1, participantSig2) {

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
			0x04,
=======
			// 4 byte prefix
			Buffer('424554','hex'),
			// 1 byte version id / 1 phase byte
			Buffer('0104', 'hex'),
			// 32 byte bet tx id
			Buffer(betId, 'hex'),
			// 32 byte bet tx id
			Buffer(clientEscrowTxId, 'hex'),
			// 72 byte Participant signature 1
			Buffer(participantSig1, 'hex'),
			// 72 byte Participant signature 2
			Buffer(participantSig2, 'hex'),
>>>>>>> multiple pushdata encode/decode
		];

		return BITBOX.Script.encode(script)
	}

	// Phase 6: Bet Participant Resignation
	static encodePhase6(betId, secretValue) {

		let script = [
<<<<<<< HEAD
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

=======
		BITBOX.Script.opcodes.OP_RETURN,
		// 4 byte prefix
		Buffer('00424554', 'hex'),
		// 1 byte version id / 1 byte phase id
		Buffer('0106', 'hex'),
>>>>>>> multiple pushdata encode/decode
		// 32 byte bet txn id
		Buffer(betId, 'hex'),
		// 32 byte Secret value
		secretValue
	];

		return BITBOX.Script.encode(script)
	}

}