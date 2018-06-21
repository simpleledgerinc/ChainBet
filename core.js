let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();

let crypto = require('crypto');
let base58 = require('bs58');



module.exports = class Core {
	
	static async getUtxo(address) {
		return new Promise( (resolve, reject) => {
			BITBOX.Address.utxo(address).then((result) => { 
				resolve(result)
			}, (err) => { 
				console.log(err)
				reject(err)
			})
		})
	}

	static decodeOP_RETURN(op_return, networkByte=0x00) {

		// split the op_return payload and get relavant data
		let data = op_return.split("04004245544c"); // pushdata (0x04) + Terab ID + pushdata (0x4c)
		let buf = Buffer.from(data[1].trim(), 'hex');

		// grab the common fields
		let version = buf[1];
		let phase = buf[2];
		let results = { version: version, phase: phase };

		// Phase 1 specific fields
		if(phase === 0x01) {
		// Bet Type
		results.type = buf[3];
		// Bet Amount
		results.amount = parseInt(buf.slice(4,12).toString('hex'), 16);
		// Target address (as hash160 without network or sha256)
		if (buf.length > 12) // 11 + 1 length byte
			var pkHash160Hex = buf.slice(12).toString('Hex');
			results.address = Util.hash160_2_cashAddr(pkHash160Hex, networkByte);

		// Phase 2 specific fields
		} else if(phase === 0x02) {
		// Bet Txn Id
		results.betTxId = buf.slice(3, 35);
		// 33 byte Multi-sig Pub Key
		results.multisigPubKey = buf.slice(35,68);
		// 32 byte bob commitment
		results.secretCommitment = buf.slice(68);

		// Phase 3  specific fields
		} else if(phase === 0x03) {
		// 32 byte Bet Txn Id
		results.betTxId = buf.slice(3, 35);
		// 32 byte Participant Txn Id
		results.participantOpReturnTxId = buf.slice(35, 67);
		// 32 byte Host P2SH txid
		results.hostP2SHTxId = buf.slice(67, 99);
		// 33 byte Host (Alice) multsig pubkey
		results.hostMultisigPubKey = buf.slice(99);

		//Phase 4 specific fields
		} else if(phase === 0x04) {
		// 32 byte Bet Txn Id
		results.betTxId = buf.slice(3, 35);
		// 32 byte Participant Txn Id
		results.participantP2SHTxId = buf.slice(35, 67);
		// 72 byte Participant Signature 1
		results.participantSig1 = buf.slice(67, 139);
		// 72 byte Participant Signature 2
		results.participantSig2 = buf.slice(139);

		// Phase 6 specific fields
		} else if(phase === 0x06) {
		// 32 byte Bet Txn Id
		results.betTxId = buf.slice(3, 35)
		// 32 byte Secret Value
		results.secretValue = buf.slice(35, 67);
		}

		return results;
	}

	static async createEscrow(wallet, script, betAmount){
		return new Promise( (resolve, reject) => {
			let transactionBuilder = new BITBOX.TransactionBuilder('bitcoincash');
			let hashType = transactionBuilder.hashTypes.SIGHASH_ALL | transactionBuilder.hashTypes.SIGHASH_ANYONECANPAY;
	
			let totalUtxo = 0;
			wallet.utxo.forEach((item, index) => { 
				transactionBuilder.addInput(item.txid, item.vout); 
				totalUtxo += item.satoshis;
			});
	
			let byteCount = BITBOX.BitcoinCash.getByteCount({ P2PKH: wallet.utxo.length }, { P2SH: 1 }) + 50;
			let satoshisAfterFee = totalUtxo - byteCount - betAmount
	
			let p2sh_hash160 = BITBOX.Crypto.hash160(script);
			let p2sh_hash160_hex = p2sh_hash160.toString('hex');
			let scriptPubKey = BITBOX.Script.scriptHash.output.encode(p2sh_hash160);
			let address = BITBOX.Address.fromOutputScript(scriptPubKey)
	
			transactionBuilder.addOutput(address, betAmount);
			transactionBuilder.addOutput(wallet.utxo[0].cashAddress, satoshisAfterFee);
	
			let key = BITBOX.ECPair.fromWIF(wallet.wif);
	
			let redeemScript;
			wallet.utxo.forEach((item, index) => {
				transactionBuilder.sign(index, key, redeemScript, hashType, item.satoshis);
			});
	
			let hex = transactionBuilder.build().toHex();
			console.log("Create escrow hex:", hex);
			BITBOX.RawTransactions.sendRawTransaction(hex).then((result) => { 
				console.log('Create escrow txid:', result);
				if (result.length < 60) // Very rough txid size check for failure
					reject("txid too small");
				else {
					resolve(result);
				}
			}, (err) => { 
				console.log(err);
				reject(err);
			});
		});
    }
    
    static async redeemEscrowToEscape(wallet, redeemScript, txid, betAmount){
        
        return new Promise( (resolve, reject) => {
    
            let hostKey = BITBOX.ECPair.fromWIF(wallet.wif)
            let participantKey = BITBOX.ECPair.fromWIF(client.wif)
            let transactionBuilder = new BITBOX.TransactionBuilder('bitcoincash');
    
            let hashType = 0xc1 // transactionBuilder.hashTypes.SIGHASH_ANYONECANPAY | transactionBuilder.hashTypes.SIGHASH_ALL
            let byteCount = BITBOX.BitcoinCash.getByteCount({ P2PKH: 1 }, { P2SH: 1 });
            let satoshisAfterFee = betAmount - byteCount - 350;
            // NOTE: must set the Sequence number below
            transactionBuilder.addInput(txid, 0, bip68.encode({ blocks: 1 })); // No need to worry about sweeping the P2SH address.      
            transactionBuilder.addOutput(wallet.utxo[0].cashAddress, satoshisAfterFee);
    
            let tx = transactionBuilder.transaction.buildIncomplete();
    
            let signatureHash = tx.hashForWitnessV0(0, redeemScript, betAmount, hashType);
            let hostSignature = hostKey.sign(signatureHash).toScriptSignature(hashType);
            let participantSignature = participantKey.sign(signatureHash).toScriptSignature(hashType);
    
            let redeemScriptSig = []; // start by pushing with true for makeBet mode
    
            // host signature
            redeemScriptSig.push(hostSignature.length);
            hostSignature.forEach((item, index) => { redeemScriptSig.push(item); });
    
            // push mode onto stack for MakeBet mode
            redeemScriptSig.push(0x00); //use 0 for escape mode
    
            if (redeemScript.length > 75) redeemScriptSig.push(0x4c);
            redeemScriptSig.push(redeemScript.length);
            redeemScript.forEach((item, index) => { redeemScriptSig.push(item); });
            
            redeemScriptSig = Buffer(redeemScriptSig);
            
            let redeemScriptSigHex = redeemScriptSig.toString('hex');
            let redeemScriptHex = redeemScript.toString('hex');
            
            tx.setInputScript(0, redeemScriptSig);
            let hex = tx.toHex();
            
            console.log("Redeem escrow hex:", hex);
            BITBOX.RawTransactions.sendRawTransaction(hex).then((result) => { 
                console.log('Redeem escrow txid:', result);
                if (result.length < 60) // Very rough txid size check for failure
                    reject("txid too small");
                else {
                    resolve(result);
                }
            }, (err) => { 
                console.log(err);
                reject(err);
            });
        });
    }    
}