let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();

let crypto = require('crypto');
let base58 = require('bs58');

module.exports = class Utils {

	static getNewPrivKeyWIF() {

		var wif;
		var n = Buffer([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
						0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFE,
						0xBA, 0xAE, 0xDC, 0xE6, 0xAF, 0x48, 0xA0, 0x3B,
						0xBF, 0xD2, 0x5E, 0x8C, 0xD0, 0x36, 0x41, 0x41])

		var isValid = false;

		while (!isValid) {
			var pk = BITBOX.Crypto.randomBytes(32);

			if(Buffer.compare(n, pk)){
				isValid = true;
			}
		}

		// add 0x01 to priv key for WIF-compressed format
		pk = Buffer.concat([pk, Buffer.from('01', 'hex')])

		// add wif-compressed version prefix (0x80) before calculating checksum
		let preHash = Buffer.concat([ Buffer.from('80', 'hex'), pk ]);

		// get hash and append 4 byte checksum
		let hash1 = crypto.createHash('sha256');
		let hash2 = crypto.createHash('sha256');
		hash1.update(preHash);
		hash2.update(hash1.digest());
		let checksum = hash2.digest().slice(0,4);
		let wifBuf = Buffer.concat([preHash, checksum]);

		// get base58 encoded
		wif = base58.encode(wifBuf);

		return wif;
	}

	static padSig(sig){
		sig = Buffer(sig, 'hex');
		if(sig.length == 71){
			var sigHex = sig.toString('hex');
			sigHex = '00' + sigHex;
			sig = Buffer(sigHex, 'hex');
		}
		return sig;
	}

	static unpadSig(sig){
		sig = Buffer(sig, 'hex')
		if(sig[0] == 0){
			return sig.slice(1,72);
		}
		return sig;
	}

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

	static secret_2_buf(secret_number){
		var hex = secret_number.toString(16)
		const len = hex.length
		for (let i = 0; i < 64 - len; i++) {
		hex = hex + '0';
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
	
	static async sweepToAddress(wallet, destinationAddress) {
		// create a new transaction with all UTXOs from each Private Key sent destination

		wallet.forEach(async (wif, index) => {

			let ecpair = BITBOX.ECPair.fromWIF(wif.wif);
			let address = BITBOX.ECPair.toCashAddress(ecpair);
			wif.utxo = await Core.getUtxoWithRetry(address);

			//return new Promise( (resolve, reject) => {
			let transactionBuilder = new BITBOX.TransactionBuilder('bitcoincash');
			let hashType = transactionBuilder.hashTypes.SIGHASH_ALL;
	
			let totalUtxo = 0;
			wif.utxo.forEach((item, index) => { 
				transactionBuilder.addInput(item.txid, item.vout); 
				totalUtxo += item.satoshis;
			});

			if(totalUtxo > 0){

				let byteCount = BITBOX.BitcoinCash.getByteCount({ P2PKH: wif.utxo.length });
				let satoshisAfterFee = totalUtxo - byteCount;
		
				// let p2sh_hash160 = BITBOX.Crypto.hash160(script);
				// let p2sh_hash160_hex = p2sh_hash160.toString('hex');
				// let scriptPubKey = BITBOX.Script.scriptHash.output.encode(p2sh_hash160);
		
				//let escrowAddress = BITBOX.Address.toLegacyAddress(BITBOX.Address.fromOutputScript(scriptPubKey));
				//let changeAddress = BITBOX.Address.toLegacyAddress(destinationAddress);
				// console.log("escrow address: " + address);
				// console.log("change satoshi: " + satoshisAfterFee);
				// console.log("change bet amount: " + betAmount);
		
				//transactionBuilder.addOutput(escrowAddress, betAmount);
				transactionBuilder.addOutput(destinationAddress, satoshisAfterFee);
				//console.log("Added escrow outputs...");
		
				//let key = BITBOX.ECPair.fromWIF(wallet.wif);
		
				let redeemScript;
				wif.utxo.forEach((item, index) => {
					transactionBuilder.sign(index, ecpair, redeemScript, hashType, item.satoshis);
				});
				//console.log("signed escrow inputs...");
		
				let hex = transactionBuilder.build().toHex();
				//console.log("built escrow...");
		
				let txId = await Core.sendRawTransaction(hex);
				console.log("Sent " + totalUtxo + " from " + address + "to " + destinationAddress);
				console.log("(txn: " + txId);
			}
			else {
				console.log("No funds at " + address);
			}
		});
	}

	// static getVanityWif(vanityString) {

	// 	var addrPrefix = "";
	// 	var wif;

	// 	while(!(addrPrefix === vanityString)){

	// 		//wif = this.getNewPrivKeyWIF();

	// 		// get legacy address
	// 		let ecpair = bitcoin.ECPair.makeRandom();
	// 		let address = ecpair.getAddress();
	// 		wif = ecpair.toWIF();
	// 		addrPrefix = address.slice(0, vanityString.length);
	// 	}

	// 	return wif;
	// }
}