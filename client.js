let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();

module.exports = class Client {

	// Phase 2: Bet Participant Acceptance
	static encodePhase2Message(betTxId, multisigPubKey, secretCommitment) {

		// set Phase 2 ChainBet payload length to 99 bytes
		var pushdatalength = 0x57

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
			0x02
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
		secretValue.forEach((item, index) => { script.push(item); })

		return BITBOX.Script.encode(script)
	}
	
}