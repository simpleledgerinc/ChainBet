let fixtures = require('./fixtures/chainbet.json')
let chai = require('chai');
let assert = require('assert');
let Chainbet = require('../index');

let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();

var asm_phase1;
var asm_phase2;
var asm_phase3;
var asm_phase4;
var asm_phase6;

describe('#chainbet', () => {
  describe('#encodePhase1', () => {
    fixtures.chainbet.encodePhase1.forEach((fixture) => {
      it(`should encodePhase1`, () => {
        let encoded = Chainbet.encodePhase1(0x01, 1000, 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c')
        asm_phase1 = BITBOX.Script.toASM(encoded)
        assert.equal(asm_phase1, 'OP_RETURN 00424554 01010100000000000003e83f8b68135f' +
                                                      '399b101868b540decc00207906f6af');
      });
    });
  });

  describe('#encodePhase2', () => {
    fixtures.chainbet.encodePhase2.forEach((fixture) => {
      it(`should encodePhase2`, () => {
        let betTxId = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b'
        let multiSigPubKey = '000000000000000000000000000000000'
        let encoded = Chainbet.encodePhase2(betTxId, multiSigPubKey)
        asm_phase2 = BITBOX.Script.toASM(encoded)
        assert.equal(asm_phase2, 'OP_RETURN 00424554 01024a5e1e4baab89f3a32518a88c31bc87f618f7' +
                                                    '6673e2cc77ab2127b7afdeda33b00000000000000' +
                                                    '000000000000000000');
      });
    });
  });

  describe('#encodePhase3', () => {
    fixtures.chainbet.encodePhase3.forEach((fixture) => {
      it(`should encodePhase3`, () => {
        let betTxId = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b'
        let participantTxId = '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098'
        let hostP2SHTxId = '999e1c837c76a1b7fbb7e57baf87b309960f5ffefbf2a9b95dd890602272f644'
        let hostmultiSigPubKey = '000000000000000000000000000000000'
        let encoded = Chainbet.encodePhase3(betTxId, participantTxId, hostP2SHTxId, hostmultiSigPubKey)
        asm_phase3 = BITBOX.Script.toASM(encoded)
        assert.equal(asm_phase3, 'OP_RETURN 00424554 01034a5e1e4baab89f3a32518a88c31bc87f618f76673e2' +
                                                    'cc77ab2127b7afdeda33b0e3e2357e806b6cdb1f70b54c3' +
                                                    'a3a17b6714ee1f0e68bebb44a74b1efd512098999e1c837' +
                                                    'c76a1b7fbb7e57baf87b309960f5ffefbf2a9b95dd89060' +
                                                    '2272f64400000000000000000000000000000000');
      });
    });
  });

  describe('#encodePhase4', () => {
    fixtures.chainbet.encodePhase4.forEach((fixture) => {
      it(`should encodePhase4`, () => {
        let betTxId = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b'
        let participantTxId = '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098'
        let participantSig1 = '3045022100c12a7d54972f26d14cb311339b5122f8c187417dde1e8efb6841f55c34220a\
                              e0022066632c5cd4161efa3a2837764eee9eb84975dd54c2de2865e9752585c53e7cce'
        let participantSig2 = '3045022100c12a7d54972f26d14cb311339b5122f8c187417dde1e8efb6841f55c34220a\
                              e0022066632c5cd4161efa3a2837764eee9eb84975dd54c2de2865e9752585c53e7cce'
        let encoded = Chainbet.encodePhase4(betTxId, participantTxId, participantSig1, participantSig2)
        asm_phase4 = BITBOX.Script.toASM(encoded)
        assert.equal(asm_phase4, 'OP_RETURN 00424554 01044a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7af'+
                                                      'deda33b0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74'+
                                                      'b1efd5120983045022100c12a7d54972f26d14cb311339b5122f8c187417d'+
                                                      'de1e8efb6841f55c34220a3045022100c12a7d54972f26d14cb311339b512'+
                                                      '2f8c187417dde1e8efb6841f55c34220a');
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
        let encoded = Chainbet.encodePhase6(betTxId, secrVal)
        asm_phase6 = BITBOX.Script.toASM(encoded)
        assert.equal(asm_phase6, 'OP_RETURN 00424554 01064a5e1e4baab89f3a32518a88c31bc87f618f7667' +
                                                    '3e2cc77ab2127b7afdeda33b00000000000000000000' +
                                                    '00000000000000000000000000000000000000000000');
      });
    });
  });

  describe('#decode', () => {
    fixtures.chainbet.decode.forEach((fixture) => {
      it(`should decode all phases`, () => {

        // Decode Phase 1 (without optional address)
        let buf_phase1 = BITBOX.Script.fromASM(asm_phase1);
        let hex_phase1 = buf_phase1.toString('hex')
        console.log(hex_phase1);
        let actual_phase1 = Chainbet.decode(hex_phase1);
        let expected_phase1 = { version: 0x01, phase: 0x01, type: 0x01, amount: 1000}
        assert.equal(actual_phase1, expected_phase1);

        // Decode Phase 1 (with optional address)
        // let buf_phase1 = BITBOX.Script.fromASM(asm_phase1);
        // let hex_phase1 = buf_phase1.toString()
        // let actual_phase1 = Chainbet.decode(hex_phase1);
        // let expected_phase1 = { version: 0x01, phase: 0x01, type: 0x01, amount: 1000, address: 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'}
        assert.equal(actual_phase1, expected_phase1);

        // Decode Phase 2
        assert.equal(actual_phase1, expected_phase1);

        // Decode Phase 3
        assert.equal(actual_phase1, expected_phase1);

        // Decode Phase 4
        assert.equal(actual_phase1, expected_phase1);

        // Decode Phase 6
        assert.equal(actual_phase1, expected_phase1);

      });
    });
  });

  describe('#amount2Hex', () => {
    fixtures.chainbet.decode.forEach((fixture) => {
      it(`should convert number amount to 8 byte hex big-endian`, () => {
        let amount = 10000000000 // 100 BCH
        let hex = Chainbet.amount2Hex(amount)
        assert.equal(hex.toString('hex'), '00000002540be400');
      });
    });
  });

});
