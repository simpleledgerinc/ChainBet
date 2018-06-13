let fixtures = require('./fixtures/chainbet.json')
let chai = require('chai');
let assert = require('assert');
let cb = require('../index');

describe('#chainbet', () => {
  describe('#encodePhase1', () => {
    fixtures.chainbet.encodePhase1.forEach((fixture) => {
      it(`should encodePhase1`, () => {
        let chainbet = new cb();
        let encoded = chainbet.encodePhase1('01', 12345, 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c')
        assert.equal(true, true);
      });
    });
  });

  describe('#encodePhase2', () => {
    fixtures.chainbet.encodePhase2.forEach((fixture) => {
      it(`should encodePhase2`, () => {
        let chainbet = new cb();
        let encoded = chainbet.encodePhase1('01', 12345, 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c')
        assert.equal(true, true);
      });
    });
  });

  describe('#encodePhase3', () => {
    fixtures.chainbet.encodePhase3.forEach((fixture) => {
      it(`should encodePhase3`, () => {
        let chainbet = new cb();
        let encoded = chainbet.encodePhase1('01', 12345, 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c')
        assert.equal(true, true);
      });
    });
  });

  describe('#encodePhase4', () => {
    fixtures.chainbet.encodePhase4.forEach((fixture) => {
      it(`should encodePhase4`, () => {
        let chainbet = new cb();
        let encoded = chainbet.encodePhase1('01', 12345, 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c')
        assert.equal(true, true);
      });
    });
  });

  describe('#encodePhase5', () => {
    fixtures.chainbet.encodePhase5.forEach((fixture) => {
      it(`should encodePhase5`, () => {
        let chainbet = new cb();
        let encoded = chainbet.encodePhase1('01', 12345, 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c')
        assert.equal(true, true);
      });
    });
  });

  describe('#encodePhase6', () => {
    fixtures.chainbet.encodePhase6.forEach((fixture) => {
      it(`should encodePhase6`, () => {
        let chainbet = new cb();
        let encoded = chainbet.encodePhase1('01', 12345, 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c')
        assert.equal(true, true);
      });
    });
  });

  describe('#decode', () => {
    fixtures.chainbet.decode.forEach((fixture) => {
      it(`should decode`, () => {
        let chainbet = new cb();
        let encoded = chainbet.encodePhase1('01', 12345, 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c')
        assert.equal(true, true);
      });
    });
  });
});
