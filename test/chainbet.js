let fixtures = require('./fixtures/chainbet.json')
//let chai = require('chai');
let assert = require('assert');
let chainbet = require('../chainbet');

let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();

var script_phase1;
var script_phase1_noAddr;
var script_phase2;
var script_phase3;
var script_phase4;
var script_phase6;

describe('#chainbet', () => {
	describe('#encodePhase1', () => {
		fixtures.chainbet.encodePhase1.forEach((fixture) => {
			it(`should encodePhase1`, () => {
				// Phase 1 with optional target address
				let script_buf = chainbet.Host.encodePhase1Message(0x01, 1000, MISSING_HOST_COMMITMENT, 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c');
				
				script_phase1 = script_buf.toString('hex');

				let asm_phase1 = BITBOX.Script.toASM(script_buf)
				assert.equal(asm_phase1, 'OP_RETURN 00424554 01010100000000000003e' + 
										'8a0f531f4ff810a415580c12e54a7072946bb927e');

				// Phase 1 with no target address
				let script_buf_noAddr = chainbet.Host.encodePhase1Message(0x01, 1000, MISSING_HOST_COMMITMENT);

				script_phase1_noAddr = script_buf.toString('hex');

				let asm_phase1_noAddr = BITBOX.Script.toASM(script_buf_noAddr);
				assert.equal(asm_phase1_noAddr, 'OP_RETURN 00424554 01010100000000000003e8');
			});
		});
	});

	describe('#encodePhase2', () => {
		fixtures.chainbet.encodePhase2.forEach((fixture) => {
			it(`should encodePhase2`, () => {
				let betTxId = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b'
				let multiSigPubKey = '000000000000000000000000000000000000000000000000000000000000000000';
				let secretCommitment = '1111111111111111111111111111111111111111';
				
				let script_buf = chainbet.Client.encodePhase2(betTxId, multiSigPubKey, secretCommitment)

				script_phase2 = script_buf.toString('hex');

				let asm_phase2 = BITBOX.Script.toASM(script_buf)
				assert.equal(asm_phase2, 'OP_RETURN 00424554 01024a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b' + 
											'000000000000000000000000000000000000000000000000000000000000000000' + 
											'1111111111111111111111111111111111111111');
			});
		});
	});

	describe('#encodePhase3', () => {
		fixtures.chainbet.encodePhase3.forEach((fixture) => {
			it(`should encodePhase3`, () => {
				let betTxId = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b'
				let participantTxId = '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098'
				let hostP2SHTxId = '999e1c837c76a1b7fbb7e57baf87b309960f5ffefbf2a9b95dd890602272f644'
				let hostmultiSigPubKey = '111111111111111111111111111111111111111111111111111111111111111111'
				let script_buf = chainbet.Host.encodePhase3(betTxId, participantTxId, hostP2SHTxId, hostmultiSigPubKey)

				script_phase3 = script_buf.toString('hex');

				asm_phase3 = BITBOX.Script.toASM(script_buf)
				assert.equal(asm_phase3, 'OP_RETURN 00424554 01034a5e1e4baab89f3a32518a88c31bc87f618f76673e2' +
											'cc77ab2127b7afdeda33b0e3e2357e806b6cdb1f70b54c3' +
											'a3a17b6714ee1f0e68bebb44a74b1efd512098999e1c837' +
											'c76a1b7fbb7e57baf87b309960f5ffefbf2a9b95dd890602272f644'+
											'111111111111111111111111111111111111111111111111111111111111111111');
			});
		});
	});

	describe('#encodePhase4', () => {
		fixtures.chainbet.encodePhase4.forEach((fixture) => {
			it(`should encodePhase4`, () => {
				let betTxId = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b'
				let participantTxId = '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098'
				// added 1 byte padding for 72 byte signatures
				let participantSig1 = '003045022100c12a7d54972f26d14cb311339b5122f8c187417dde1e8efb6841f55c34220a' +
															'e0022066632c5cd4161efa3a2837764eee9eb84975dd54c2de2865e9752585c53e7cce'
				let participantSig2 = '003045022100c12a7d54972f26d14cb311339b5122f8c187417dde1e8efb6841f55c34220a' +
															'e0022066632c5cd4161efa3a2837764eee9eb84975dd54c2de2865e9752585c53e7cce'
				let script_buf = chainbet.Client.encodePhase4(betTxId, participantTxId, participantSig1, participantSig2)

				script_phase4 = script_buf.toString('hex');

				asm_phase4 = BITBOX.Script.toASM(script_buf)
				assert.equal(asm_phase4, 'OP_RETURN 00424554 01044a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77a' + 
											'b2127b7afdeda33b0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b' + 
											'1efd512098003045022100c12a7d54972f26d14cb311339b5122f8c187417dde1e8efb68' + 
											'41f55c34220ae0022066632c5cd4161efa3a2837764eee9eb84975dd54c2de2865e975' + 
											'2585c53e7cce003045022100c12a7d54972f26d14cb311339b5122f8c187417dde1e8efb' + 
											'6841f55c34220ae0022066632c5cd4161efa3a2837764eee9eb84975dd54c2de2865e9' + 
											'752585c53e7cce');
			});
		});
	});

	describe('#encodePhase5', () => {
		fixtures.chainbet.encodePhase5.forEach((fixture) => {
			it(`should encodePhase5`, () => {
				
				// TODO ...

				assert.equal(true, true);
			});
		});
	});

	describe('#encodePhase6', () => {
		fixtures.chainbet.encodePhase6.forEach((fixture) => {
			it(`should encodePhase6`, () => {
				let betTxId = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b'
				let secrVal = '0000000000000000000000000000000000000000000000000000000000000000'
				let script_buf = chainbet.Client.encodePhase6(betTxId, secrVal)

				script_phase6 = script_buf.toString('hex');

				asm_phase6 = BITBOX.Script.toASM(script_buf)
				assert.equal(asm_phase6, 'OP_RETURN 00424554 01064a5e1e4baab89f3a32518a88c31bc87f618f7667' +
															'3e2cc77ab2127b7afdeda33b00000000000000000000' +
															'00000000000000000000000000000000000000000000');
			});
		});
	});

	describe('#decodePhase1', () => {
		fixtures.chainbet.decode.forEach((fixture) => {
			it(`should decodePhase1`, () => {
				// Decode Phase 1 (with optional address)
				let actual_phase1 = chainbet.Core.decodeOP_RETURN(script_phase1);
				let expected_phase1 = { 
					version: 0x01, 
					phase: 0x01, 
					type: 0x01, 
					amount: 1000, 
					address: 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'
				};
				assert.equal(actual_phase1.address.length, 54);
				assert.equal(actual_phase1.version, expected_phase1.version);
				assert.equal(actual_phase1.phase, expected_phase1.phase);
				assert.equal(actual_phase1.type, expected_phase1.type);
				assert.equal(actual_phase1.amount, expected_phase1.amount);
				assert.equal(actual_phase1.address, expected_phase1.address);

				// Decode Phase 1 (without optional address)
				let actual_phase1_noAddr = chainbet.Core.decodeOP_RETURN(script_phase1_noAddr);
				let expected_phase1_noAddr = { 
					version: 0x01, 
					phase: 0x01, 
					type: 0x01, 
					amount: 1000 
				};
				assert.equal(actual_phase1_noAddr.version, expected_phase1_noAddr.version);
				assert.equal(actual_phase1_noAddr.phase, expected_phase1_noAddr.phase);
				assert.equal(actual_phase1_noAddr.betType, expected_phase1_noAddr.betType);
				assert.equal(actual_phase1_noAddr.amount, actual_phase1_noAddr.amount);
			});
		});
	});

	describe('#decodePhase2', () => {
		fixtures.chainbet.decode.forEach((fixture) => {
			it(`should decodePhase2`, () => {

				// Decode Phase 2
				var actual_phase2 = chainbet.Core.decodeOP_RETURN(script_phase2);
				var expected_phase2 = { 
					version: 0x01, 
					phase: 0x02, 
					betTxId: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b', 
					multisigPubKey:  '000000000000000000000000000000000000000000000000000000000000000000',
					secretCommitment: '1111111111111111111111111111111111111111'
				};
				assert.equal(actual_phase2.betTxId.length, 32);
				assert.equal(actual_phase2.multisigPubKey.length, 33);      
				assert.equal(actual_phase2.secretCommitment.length, 20);
				assert.equal(actual_phase2.version, expected_phase2.version);
				assert.equal(actual_phase2.phase, expected_phase2.phase);
				assert.equal(actual_phase2.betTxId.toString('hex'), expected_phase2.betTxId);
				assert.equal(actual_phase2.multisigPubKey.toString('hex'), expected_phase2.multisigPubKey);
				
			});
		});
	});

	describe('#decodePhase3', () => {
		fixtures.chainbet.decode.forEach((fixture) => {
			it(`should decodePhase3`, () => {
				// Decode Phase 3
				let actual_phase3 = chainbet.Core.decodeOP_RETURN(script_phase3);
				let expected_phase3 = { 
					version: 0x01, 
					phase: 0x03, 
					betTxId: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b', 
					participantOpReturnTxId: '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098',
					hostP2SHTxId: '999e1c837c76a1b7fbb7e57baf87b309960f5ffefbf2a9b95dd890602272f644',
					hostMultisigPubKey: '111111111111111111111111111111111111111111111111111111111111111111' 
				}
				assert.equal(actual_phase3.betTxId.length, 32);
				assert.equal(actual_phase3.participantOpReturnTxId.length, 32);
				assert.equal(actual_phase3.hostP2SHTxId.length, 32);
				assert.equal(actual_phase3.hostMultisigPubKey.length, 33);   

				assert.equal(actual_phase3.version, expected_phase3.version);
				assert.equal(actual_phase3.phase, expected_phase3.phase);
				assert.equal(actual_phase3.betTxId.toString('hex'), expected_phase3.betTxId);
				assert.equal(actual_phase3.participantOpReturnTxId.toString('hex'), expected_phase3.participantOpReturnTxId);
				assert.equal(actual_phase3.hostP2SHTxId.toString('hex'), expected_phase3.hostP2SHTxId);
				assert.equal(actual_phase3.hostMultisigPubKey.toString('hex'), expected_phase3.hostMultisigPubKey);
				
			});
		});
	});

	describe('#decodePhase4', () => {
		fixtures.chainbet.decode.forEach((fixture) => {
			it(`should decodePhase4`, () => {
				// Decode Phase 4
				let actual_phase4 = chainbet.Core.decodeOP_RETURN(script_phase4);
				let expected_phase4 = { 
					version: 0x01, 
					phase: 0x04, 
					betTxId: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b', 
					participantP2SHTxId: '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098',
					participantSig1: '003045022100c12a7d54972f26d14cb311339b5122f8c187417dde1e8efb6841f55c34220a' +
														'e0022066632c5cd4161efa3a2837764eee9eb84975dd54c2de2865e9752585c53e7cce',
					participantSig2: '003045022100c12a7d54972f26d14cb311339b5122f8c187417dde1e8efb6841f55c34220a' +
														'e0022066632c5cd4161efa3a2837764eee9eb84975dd54c2de2865e9752585c53e7cce' 
				}
				assert.equal(actual_phase4.participantP2SHTxId.length, 32);
				assert.equal(actual_phase4.participantSig1.length, 72);
				assert.equal(actual_phase4.participantSig2.length, 72); 
				assert.equal(actual_phase4.version, expected_phase4.version);
				assert.equal(actual_phase4.phase, expected_phase4.phase);
				assert.equal(actual_phase4.betTxId.toString('hex'), expected_phase4.betTxId);
				assert.equal(actual_phase4.participantP2SHTxId.toString('hex'), expected_phase4.participantP2SHTxId);
				assert.equal(actual_phase4.participantSig1.toString('hex'), expected_phase4.participantSig1);
				assert.equal(actual_phase4.participantSig2.toString('hex'), expected_phase4.participantSig2);
			});
		});
	});

	describe('#decodePhase6', () => {
		fixtures.chainbet.decode.forEach((fixture) => {
			it(`should decodePhase6`, () => {
				// Decode Phase 6
				let actual_phase6 = chainbet.Core.decodeOP_RETURN(script_phase6);
				let expected_phase6 = { 
					version: 0x01, 
					phase: 0x06, 
					betTxId: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b', 
					secretValue: '0000000000000000000000000000000000000000000000000000000000000000'
				}
				assert.equal(actual_phase6.betTxId.length, 32);
				assert.equal(actual_phase6.secretValue.length, 32);
				assert.equal(actual_phase6.version, expected_phase6.version);
				assert.equal(actual_phase6.phase, expected_phase6.phase);
				assert.equal(actual_phase6.betTxId.toString('hex'), expected_phase6.betTxId);
				assert.equal(actual_phase6.secretValue.toString('hex'), expected_phase6.secretValue);
			});
		});
	});

	describe('#amount_2_Hex', () => {
		fixtures.chainbet.decode.forEach((fixture) => {
			it(`should convert number amount to 8 byte hex big-endian`, () => {
				let amount = 10000000000 // 100 BCH
				let hex = chainbet.Utils.amount_2_hex(amount)
				assert.equal(hex.toString('hex'), '00000002540be400');
			});
		});
	});

	describe('#hash160_2_cashAddr', () => {
		fixtures.chainbet.decode.forEach((fixture) => {
			it(`should convert public key hash160 to bitcoin cash address format`, () => {
				let expected_address = 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c';
				let actual_pkHash160 = 'a0f531f4ff810a415580c12e54a7072946bb927e';
				let networkByte = 0x00;
				let actual_address = chainbet.Utils.hash160_2_cashAddr(actual_pkHash160, networkByte);
				assert.equal(actual_address, expected_address);
			});
		});
	});
});
