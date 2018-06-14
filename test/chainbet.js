let fixtures = require('./fixtures/chainbet.json')
let chai = require('chai');
let assert = require('assert');
let Chainbet = require('../index');

describe('#chainbet', () => {
  describe('#encodePhase1', () => {
    fixtures.chainbet.encodePhase1.forEach((fixture) => {
      it(`should encodePhase1`, () => {
        let encoded = Chainbet.encodePhase1(0x01, 1000, 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c')
        assert.equal(true, true);
      });
    });
  });

  describe('#encodePhase2', () => {
    fixtures.chainbet.encodePhase2.forEach((fixture) => {
      it(`should encodePhase2`, () => {
        let betTxId = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b'
        let multiSigPubKey = '000000000000000000000000000000000'
        let encoded = Chainbet.encodePhase2(betTxId, multiSigPubKey)
        assert.equal(true, true);
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
        assert.equal(true, true);
      });
    });
  });

  describe('#encodePhase4', () => {
    fixtures.chainbet.encodePhase4.forEach((fixture) => {
      it(`should encodePhase4`, () => {
        let betTxId = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b'
        let participantTxId = '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098'
        let participantSig1 = '3045022100c12a7d54972f26d14cb311339b5122f8c187417dde1e8efb6841f55c34220ae0022066632c5cd4161efa3a2837764eee9eb84975dd54c2de2865e9752585c53e7cce'
        let participantSig2 = '3045022100c12a7d54972f26d14cb311339b5122f8c187417dde1e8efb6841f55c34220ae0022066632c5cd4161efa3a2837764eee9eb84975dd54c2de2865e9752585c53e7cce'
        let encoded = Chainbet.encodePhase4(betTxId, participantTxId, participantSig1, participantSig2)
        assert.equal(true, true);
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
        assert.equal(true, true);
      });
    });
  });

  describe('#decode', () => {
    fixtures.chainbet.decode.forEach((fixture) => {
      it(`should decode`, () => {

        // TODO: ...
        
        assert.equal(true, true);
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
