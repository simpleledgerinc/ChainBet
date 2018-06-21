let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();

let crypto = require('crypto');
let base58 = require('bs58');

module.exports = class Util {

	// get big-endian hex from satoshis
	static amount_2_hex(amount) {
		var hex = amount.toString(16)
		const len = hex.length
		for (let i = 0; i < 16 - len; i++) {
		hex = '0' + hex;
		}
		let buf = Buffer.from(hex, 'hex')
		return buf
	}

	static hash160_2_cashAddr(pkHash160Hex, networkByte) {
		// handle the network byte prefix
		let networkHex = Buffer([networkByte]).toString('hex');

		// calculate checksum and 
		// add first 4 bytes from double sha256
		let hash1 = crypto.createHash('sha256');
		let hash2 = crypto.createHash('sha256');
		hash1.update(Buffer(networkHex + pkHash160Hex, 'hex'));
		hash2.update(hash1.digest());
		let checksum = hash2.digest().slice(0,4).toString('hex');
		let addressBuf = Buffer(networkHex + pkHash160Hex + checksum, 'hex')
		let hex = addressBuf.toString('hex')
		let addressBase58 = base58.encode(addressBuf)
		
		return BITBOX.Address.toCashAddress(addressBase58);
    }
    
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

}